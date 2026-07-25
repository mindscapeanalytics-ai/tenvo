'use client';

/**
 * Milk Route Hisab 58mm thermal bill — same printer path as POS.
 * Supports totals-only receipt and PK-style day Y/N breakdown sheet.
 */
import { dispatchThermalReceipt, printThermalReceiptHtml } from '@/lib/print/thermalReceipt';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import {
  parseMilkHisabBillingPeriod,
  buildMilkHisabDayBreakdownGrid,
  formatMilkHisabDayLine,
  shortMilkHisabProductLabel,
  abbreviateMilkHisabColumn,
} from '@/lib/storefront/milkShopHisab';
import {
  normalizeMilkHisabBillLocale,
  getMilkHisabDaySheetCopy,
  localizeMilkHisabPeriodLabel,
  milkHisabUrduProductLabel,
  milkHisabUrduUnit,
} from '@/lib/storefront/milkHisabUrdu';

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolvePeriodMeta(period = '', periodLabel = '') {
  let kind = 'month';
  let label = periodLabel;
  if (period && !label) {
    try {
      const parsed = parseMilkHisabBillingPeriod(period);
      kind = parsed.kind;
      label = parsed.label;
    } catch {
      label = period;
    }
  } else if (period) {
    try {
      kind = parseMilkHisabBillingPeriod(period).kind;
    } catch {
      kind = /W\d/i.test(period) ? 'week' : 'month';
    }
  }
  return { kind, label };
}

function money(amount, currencyCode = 'PKR', locale) {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currencyCode} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

/**
 * Build thermal receipt options from a hisab invoice payload.
 */
export function buildMilkHisabThermalOpts({
  business,
  invoice,
  items = [],
  houseNo = '',
  period = '',
  periodLabel = '',
  category = 'milk-shop',
}) {
  const pack = getBusinessRegionalPack(business);
  const { kind, label } = resolvePeriodMeta(period, periodLabel);

  const documentLabel = kind === 'week' ? 'Weekly Hisab Bill' : 'Monthly Hisab Bill';
  const customerBase = invoice.customer_name || invoice.customerName || 'Customer';
  const customerName = houseNo
    ? `${customerBase} · House ${houseNo}`
    : customerBase;

  const lineItems = (items || []).map((item) => {
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
    const lineTotal = Number(
      item.total_amount ?? item.lineTotal ?? Math.round(qty * unitPrice * 100) / 100
    );
    const unit = item.product_unit || item.unit || '';
    const name = item.name || item.product_name || 'Item';
    return {
      name: unit ? `${name} (${unit})` : name,
      sku: item.sku || item.product_sku || null,
      quantity: qty,
      unitPrice,
      lineTotal,
    };
  });

  if (!lineItems.length) {
    const total = Number(invoice.grand_total || invoice.amount || 0);
    lineItems.push({
      name: label ? `Route hisab ${label}` : 'Route hisab',
      quantity: 1,
      unitPrice: total,
      lineTotal: total,
    });
  }

  return {
    business,
    documentLabel,
    category: business?.category || category,
    currencyCode: pack.currency,
    paperSize: '58mm',
    sale: {
      invoice_number: invoice.invoice_number || invoice.invoiceNumber || 'DRAFT',
      date: invoice.date || invoice.created_at || invoice.due_date || new Date(),
      customerName,
      paymentMethod: invoice.payment_status === 'paid' ? (invoice.payment_method || 'cash') : 'credit',
    },
    lineItems,
  };
}

/**
 * Build 58mm bill from a Bills-table customer row (works before invoice exists).
 */
export function buildMilkHisabThermalOptsFromRow({
  business,
  row,
  productColumns = [],
  period = '',
  periodLabel = '',
  category = 'milk-shop',
}) {
  const { kind, label } = resolvePeriodMeta(period, periodLabel);
  const qtyByProduct = row?.qtyByProduct || {};
  const meta = row?.productMeta || {};
  const total = Math.round((Number(row?.amount) || 0) * 100) / 100;

  const rawLines = [];
  const seen = new Set();

  for (const col of productColumns) {
    const qty = Number(qtyByProduct[col.id]) || 0;
    if (qty <= 0) continue;
    seen.add(String(col.id));
    const unitMeta = meta[col.id] || {};
    const unit = unitMeta.unit || col.unit || '';
    const name = unitMeta.name || col.name || 'Item';
    rawLines.push({ name: unit ? `${name} (${unit})` : name, quantity: qty });
  }

  for (const [productId, rawQty] of Object.entries(qtyByProduct)) {
    if (seen.has(String(productId))) continue;
    const qty = Number(rawQty) || 0;
    if (qty <= 0) continue;
    const unitMeta = meta[productId] || {};
    const unit = unitMeta.unit || '';
    const name = unitMeta.name || 'Item';
    rawLines.push({ name: unit ? `${name} (${unit})` : name, quantity: qty });
  }

  const qtySum = rawLines.reduce((s, r) => s + (Number(r.quantity) || 0), 0) || 1;
  let allocated = 0;
  const itemsForReceipt = rawLines.length
    ? rawLines.map((item, idx) => {
        const qty = Number(item.quantity) || 1;
        let lineTotal;
        if (idx === rawLines.length - 1) {
          lineTotal = Math.round((total - allocated) * 100) / 100;
        } else {
          lineTotal = Math.round((qty / qtySum) * total * 100) / 100;
          allocated += lineTotal;
        }
        return {
          name: item.name,
          quantity: qty,
          unit_price: qty ? Math.round((lineTotal / qty) * 100) / 100 : lineTotal,
          total_amount: lineTotal,
        };
      })
    : [
        {
          name: label ? `Route hisab ${label}` : 'Route hisab',
          quantity: 1,
          unit_price: total,
          total_amount: total,
        },
      ];

  return buildMilkHisabThermalOpts({
    business,
    invoice: {
      invoice_number: row?.invoiceNumber || (kind === 'week' ? 'WEEKLY-DRAFT' : 'MONTHLY-DRAFT'),
      customer_name: row?.customerName || 'Customer',
      grand_total: total,
      subtotal: total,
      payment_status: row?.paymentStatus || 'unpaid',
      payment_method: 'credit',
      date: new Date(),
      isDraft: !row?.invoiceId,
    },
    items: itemsForReceipt,
    houseNo: row?.houseNo || '',
    period,
    periodLabel: label,
    category,
  });
}

/**
 * Normalize day-breakdown payload for HTML / PDF.
 * @param {object} args
 * @param {'en'|'ur'} [args.billLocale]
 */
export function buildMilkHisabDayBreakdownPrintModel({
  business,
  breakdown,
  customerName = '',
  houseNo = '',
  period = '',
  periodLabel = '',
  invoiceNumber = '',
  grandTotal = 0,
  paymentStatus = 'unpaid',
  productMeta = {},
  billLocale = 'en',
}) {
  const pack = getBusinessRegionalPack(business);
  const locale = normalizeMilkHisabBillLocale(billLocale);
  const { kind, label } = resolvePeriodMeta(period, periodLabel);
  const copy = getMilkHisabDaySheetCopy(locale, kind);
  const columns = breakdown?.columns || [];
  const days = breakdown?.days || [];
  const headerLine = `D  ${columns
    .map((c) => String(c.abbrev || 'Itm').trim().padEnd(3, ' ').slice(0, 3))
    .join('   ')}`.trim();
  const dayLines = days.map((day) => formatMilkHisabDayLine(day, columns));

  const totals = (breakdown?.totalsByProduct || [])
    .filter((t) => Number(t.qty) > 0)
    .map((t) => {
      const meta = productMeta[t.id] || {};
      const unitPrice = Number(meta.unitPrice) || 0;
      const qty = Number(t.qty) || 0;
      const amount =
        unitPrice > 0
          ? Math.round(qty * unitPrice * 100) / 100
          : null;
      const enLabel = shortMilkHisabProductLabel(
        { name: t.name, hisabShortLabel: t.shortLabel },
        12
      );
      const unitRaw = t.unit || meta.unit || '';
      return {
        label:
          locale === 'ur'
            ? milkHisabUrduProductLabel({
                name: t.name || meta.name,
                hisabShortLabel: t.shortLabel || enLabel,
              })
            : enLabel,
        unit: locale === 'ur' ? milkHisabUrduUnit(unitRaw) : unitRaw,
        qty,
        amount,
      };
    });

  const paid = String(paymentStatus || 'unpaid').toLowerCase() === 'paid';
  const localizedPeriod = localizeMilkHisabPeriodLabel(label || period, locale, kind);

  return {
    billLocale: locale,
    businessName: business?.business_name || business?.name || copy.shopFallback,
    address: business?.address || '',
    phone: business?.phone || '',
    documentLabel: copy.documentLabel,
    periodLabel: localizedPeriod,
    customerName: customerName || copy.customerFallback,
    houseNo: houseNo || '',
    housePrefix: copy.housePrefix,
    invoiceNumber:
      invoiceNumber || (kind === 'week' ? copy.draftWeekly : copy.draftMonthly),
    paymentMethod: paid ? copy.cash : copy.credit,
    daysWord: copy.daysWord,
    totalLabel: copy.total,
    thanks: copy.thanks,
    legend: copy.legend,
    currencyCode: pack.currency,
    locale: pack.locale,
    numberLocale: locale === 'ur' ? 'ur-PK' : pack.locale,
    headerLine,
    dayLines,
    activeDays: breakdown?.activeDays || days.filter((d) => d.hasDelivery).length,
    totals,
    grandTotal: Math.round((Number(grandTotal) || 0) * 100) / 100,
    columns,
  };
}

/**
 * Compact 58mm HTML for day Y/N sheet + period totals.
 */
export function buildMilkHisabDayBreakdownHtml(model) {
  const d = model;
  const isUrdu = d.billLocale === 'ur';
  const width = '54mm';
  const fontStack = isUrdu
    ? `'Noto Naskh Arabic', 'Noto Nastaliq Urdu', 'Segoe UI', Tahoma, sans-serif`
    : `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  const styles = `
  @page { size: 58mm auto; margin: 2mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${width}; max-width: ${width}; margin: 0 auto;
    padding: 2.5mm 2mm 4mm;
    font-family: ${fontStack};
    font-size: ${isUrdu ? '9px' : '8.5px'}; line-height: ${isUrdu ? '1.45' : '1.28'}; color: #111;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
    direction: ltr;
  }
  .ur { font-family: 'Noto Naskh Arabic', 'Noto Nastaliq Urdu', 'Segoe UI', Tahoma, sans-serif; direction: rtl; unicode-bidi: plaintext; }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .t { font-size: ${isUrdu ? '11px' : '10.5px'}; margin-bottom: 0.8mm; }
  .s { font-size: ${isUrdu ? '8px' : '7.5px'}; color: #444; }
  .m { color: #666; }
  hr { border: none; border-top: 1px dashed #999; margin: 1.8mm 0; }
  .grid {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 7.5px; white-space: pre; letter-spacing: 0;
    line-height: 1.35; font-variant-numeric: tabular-nums;
    direction: ltr; text-align: left;
  }
  .grid .hdr { font-weight: 700; border-bottom: 1px solid #333; padding-bottom: 0.6mm; margin-bottom: 0.6mm; }
  .row { display: flex; justify-content: space-between; gap: 1mm; font-size: ${isUrdu ? '8.5px' : '8px'}; padding: 0.4mm 0; direction: ltr; }
  .row .l { color: #444; ${isUrdu ? 'font-family: inherit; direction: rtl; unicode-bidi: plaintext; text-align: right; flex: 1;' : ''} }
  .row .r { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .tot { font-weight: 800; font-size: ${isUrdu ? '10.5px' : '10px'}; border-top: 1px solid #333; padding-top: 1.2mm; margin-top: 1mm; }
  .foot { margin-top: 2mm; text-align: center; font-size: ${isUrdu ? '8.5px' : '8px'}; }
  `;

  const dayBlock = [
    `<div class="hdr">${esc(d.headerLine)}</div>`,
    ...(d.dayLines || []).map((line) => esc(line)),
  ].join('\n');

  const moneyLocale = d.numberLocale || d.locale;
  const totalRows = (d.totals || [])
    .map((t) => {
      const left = `${t.label}${t.unit ? ` ${t.unit}` : ''} ${t.qty}`;
      const right =
        t.amount != null ? money(t.amount, d.currencyCode, moneyLocale) : '';
      return `<div class="row"><span class="l">${esc(left)}</span><span class="r">${esc(right)}</span></div>`;
    })
    .join('');

  const urClass = isUrdu ? ' ur' : '';
  const houseBit = d.houseNo
    ? isUrdu
      ? ` · ${esc(d.housePrefix)} ${esc(d.houseNo)}`
      : ` · ${esc(d.housePrefix)} ${esc(d.houseNo)}`
    : '';

  const fontLink = isUrdu
    ? `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap" rel="stylesheet"/>`
    : '';

  return `<!doctype html>
<html lang="${isUrdu ? 'ur' : 'en'}"><head>
<meta charset="utf-8"/>
<title>${esc(d.documentLabel)}</title>
${fontLink}
<style>${styles}</style>
</head><body>
  <div class="c b t${urClass}">${esc(d.businessName)}</div>
  ${d.address ? `<div class="c s${urClass}">${esc(d.address)}</div>` : ''}
  ${d.phone ? `<div class="c s">${esc(d.phone)}</div>` : ''}
  <hr/>
  <div class="c b${urClass}">${esc(d.documentLabel)}</div>
  <div class="c s m${urClass}">${esc(d.periodLabel)}</div>
  <div class="c s${urClass}">${esc(d.customerName)}${houseBit}</div>
  <div class="c s m${urClass}">${esc(d.invoiceNumber)} · ${esc(d.paymentMethod)} · ${esc(String(d.activeDays || 0))} ${esc(d.daysWord || 'days')}</div>
  <hr/>
  <div class="grid">${dayBlock}</div>
  <hr/>
  ${totalRows}
  <div class="row tot"><span class="l${urClass}">${esc(d.totalLabel || 'TOTAL')}</span><span class="r">${esc(money(d.grandTotal, d.currencyCode, moneyLocale))}</span></div>
  <hr/>
  <div class="foot">
    <div class="b${urClass}">${esc(d.thanks || 'Shukriya · Thank you')}</div>
    <div class="s m${urClass}">${esc(d.legend || 'Y = delivered · N = not delivered')}</div>
  </div>
</body></html>`;
}

/**
 * PDF twin of day-breakdown HTML (58mm courier layout).
 * Urdu uses HTML print path (Save as PDF) so Naskh glyphs render correctly.
 */
export async function downloadMilkHisabDayBreakdownPdf(model) {
  if (model?.billLocale === 'ur') {
    // Courier cannot paint Urdu; open the same HTML slip for Save as PDF / printer.
    const html = buildMilkHisabDayBreakdownHtml(model);
    return printThermalReceiptHtml(html, { delayMs: 900 });
  }

  try {
    const { default: jsPDF } = await import('jspdf');
    const d = model;
    const pageW = 58;
    const margin = 2;
    const contentW = pageW - margin * 2;
    const lineCount = 14 + (d.dayLines?.length || 0) + (d.totals?.length || 0);
    const estHeight = Math.min(Math.max(40 + lineCount * 3.1, 70), 320);

    const doc = new jsPDF({
      unit: 'mm',
      format: [pageW, estHeight],
      orientation: 'portrait',
      compress: true,
    });

    let y = margin + 2;
    const write = (text, opts = {}) => {
      const { size = 7, bold = false, align = 'left' } = opts;
      doc.setFont('courier', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      const x = align === 'center' ? pageW / 2 : align === 'right' ? pageW - margin : margin;
      doc.text(String(text), x, y, { align, maxWidth: contentW });
      y += size * 0.4 + 1.05;
    };
    const rule = () => {
      y += 0.6;
      doc.setDrawColor(150);
      doc.line(margin, y, pageW - margin, y);
      y += 2.2;
    };

    write(d.businessName, { size: 9, bold: true, align: 'center' });
    if (d.address) write(d.address, { size: 6.5, align: 'center' });
    if (d.phone) write(d.phone, { size: 6.5, align: 'center' });
    rule();
    write(String(d.documentLabel).toUpperCase(), { size: 8, bold: true, align: 'center' });
    write(d.periodLabel, { size: 6.5, align: 'center' });
    write(
      `${d.customerName}${d.houseNo ? ` · ${d.housePrefix || 'H'} ${d.houseNo}` : ''}`,
      {
        size: 7,
        align: 'center',
      }
    );
    write(
      `${d.invoiceNumber} · ${d.paymentMethod} · ${d.activeDays || 0} ${d.daysWord || 'days'}`,
      {
        size: 6.5,
        align: 'center',
      }
    );
    rule();
    write(d.headerLine, { size: 6.5, bold: true });
    for (const line of d.dayLines || []) {
      write(line, { size: 6.5 });
    }
    rule();
    for (const t of d.totals || []) {
      const left = `${t.label}${t.unit ? ` ${t.unit}` : ''} ${t.qty}`;
      const right =
        t.amount != null ? money(t.amount, d.currencyCode, d.numberLocale || d.locale) : '';
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.text(left, margin, y, { maxWidth: contentW * 0.58 });
      if (right) doc.text(right, pageW - margin, y, { align: 'right' });
      y += 3.1;
    }
    y += 0.5;
    doc.setDrawColor(40);
    doc.line(margin, y, pageW - margin, y);
    y += 3;
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text(d.totalLabel || 'TOTAL', margin, y);
    doc.text(money(d.grandTotal, d.currencyCode, d.numberLocale || d.locale), pageW - margin, y, {
      align: 'right',
    });
    y += 4;
    rule();
    write(d.thanks || 'Shukriya · Thank you', { size: 7, bold: true, align: 'center' });
    write(d.legend || 'Y = delivered · N = not delivered', { size: 6, align: 'center' });

    const slug = String(d.invoiceNumber || 'hisab-day')
      .replace(/[^\w-]+/g, '-')
      .slice(0, 36);
    doc.save(`${slug || 'hisab-day'}-days.pdf`);
    return true;
  } catch (err) {
    console.error('downloadMilkHisabDayBreakdownPdf', err);
    return false;
  }
}

export async function printMilkHisabThermalBill(args, mode = 'print') {
  const opts = buildMilkHisabThermalOpts(args);
  return dispatchThermalReceipt(opts, mode);
}

/** Print/PDF from Bills table row (invoice optional) — totals style. */
export async function printMilkHisabThermalBillFromRow(args, mode = 'print') {
  const opts = buildMilkHisabThermalOptsFromRow(args);
  return dispatchThermalReceipt(opts, mode);
}

/**
 * Print/PDF PK day-sheet (Y/N per day) for one customer period.
 * @param {object} args
 * @param {'print'|'pdf'} [mode]
 */
export async function printMilkHisabDayBreakdownBill(args, mode = 'print') {
  const model = buildMilkHisabDayBreakdownPrintModel(args);
  if (mode === 'pdf') {
    return downloadMilkHisabDayBreakdownPdf(model);
  }
  const html = buildMilkHisabDayBreakdownHtml(model);
  // Give Noto Naskh a moment to load for Urdu slips.
  if (model.billLocale === 'ur' && typeof window !== 'undefined') {
    try {
      if (document.fonts?.load) {
        await document.fonts.load('700 11px "Noto Naskh Arabic"');
      }
    } catch {
      /* print anyway */
    }
  }
  return printThermalReceiptHtml(html, {
    delayMs: model.billLocale === 'ur' ? 900 : 500,
  });
}

// re-export helpers used by verify / UI
export { abbreviateMilkHisabColumn, buildMilkHisabDayBreakdownGrid, formatMilkHisabDayLine };
