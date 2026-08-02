'use client';

/**
 * Water Route Hisab 58mm thermal bills — Daily Sale Summary + weekly/monthly period sheets.
 * Exact MediaBox sizing (same printer path as POS / milk hisab).
 */
import {
  dispatchThermalReceipt,
  printThermalReceiptHtml,
  printJsPdfDocument,
} from '@/lib/print/thermalReceipt';
import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import {
  parseWaterHisabBillingPeriod,
  formatWaterHisabDayHeaderLine,
  shortWaterHisabProductLabel,
  computeWaterSaleAmount,
} from '@/lib/storefront/waterShopHisab';
import { formatMilkHisabDayLine } from '@/lib/storefront/milkShopHisab';
import {
  buildMilkHisabDayBreakdownPrintModel,
  createMilkHisabDayBreakdownPdf,
  buildMilkHisabDayBreakdownHtml,
  downloadMilkHisabDayBreakdownPdf,
} from '@/lib/print/milkHisabThermalBill';

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

function resolvePeriodMeta(period = '', periodLabel = '') {
  let kind = 'month';
  let label = periodLabel;
  if (period && !label) {
    try {
      const parsed = parseWaterHisabBillingPeriod(period);
      kind = parsed.kind;
      label = parsed.label;
    } catch {
      label = period;
    }
  } else if (period) {
    try {
      kind = parseWaterHisabBillingPeriod(period).kind;
    } catch {
      kind = /W\d/i.test(period) ? 'week' : 'month';
    }
  }
  return { kind, label };
}

function pad(s, w, align = 'left') {
  const t = String(s ?? '').slice(0, w);
  if (align === 'right') return t.padStart(w, ' ');
  if (align === 'center') {
    const left = Math.floor((w - t.length) / 2);
    return t.padStart(left + t.length, ' ').padEnd(w, ' ');
  }
  return t.padEnd(w, ' ');
}

/**
 * Daily Sale Summary model (one customer, one delivery date).
 */
export function buildWaterDailySalePrintModel({
  business,
  row,
  products = [],
  deliveryDate = '',
  category = 'water-delivery',
}) {
  const pack = getBusinessRegionalPack(business);
  const lines = [];
  let delTotal = 0;
  let recTotal = 0;
  let saleTotal = 0;
  const rate =
    Number(row?.productRate) > 0
      ? Number(row.productRate)
      : 0;

  for (const p of products || []) {
    const pid = String(p.id);
    const del = Number(row?.qtyByProduct?.[pid] ?? row?.qtyByProduct?.[p.id]) || 0;
    const rec = Number(row?.recByProduct?.[pid] ?? row?.recByProduct?.[p.id]) || 0;
    if (del <= 0 && rec <= 0) continue;
    const unitRate = rate > 0 ? rate : Number(p.price) || 0;
    const amount = computeWaterSaleAmount({ qty: del, unitPrice: unitRate, accountRate: rate });
    delTotal += del;
    recTotal += rec;
    saleTotal += amount;
    lines.push({
      name: shortWaterHisabProductLabel(p, 14),
      del,
      rec,
      rate: unitRate,
      amount,
      unit: p.unit || 'pcs',
    });
  }

  const discount = Math.max(0, Number(row?.specialDiscount) || 0);
  const cash = Math.max(0, Number(row?.cashCollected) || 0);
  const grandTotal = Math.max(0, Math.round((saleTotal - discount) * 100) / 100);
  const prevBottle = Number(row?.prevBottle) || 0;
  const bottleBalance = Math.round((prevBottle + delTotal - recTotal) * 1000) / 1000;

  const dateLabel = deliveryDate
    ? String(deliveryDate).slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    businessName:
      business?.business_name || business?.name || business?.businessName || 'Water supply',
    address: business?.address || '',
    phone: business?.phone || '',
    documentLabel: 'Daily Sale Summary',
    deliveryDate: dateLabel,
    customerName: row?.customerName || 'Customer',
    accountNo: row?.accountNo || '',
    townCode: row?.townCode || '',
    houseNo: row?.houseNo || '',
    floorFlat: row?.floorFlat || '',
    routeLabel: row?.routeLabel || '',
    productRate: rate,
    lines,
    delTotal: Math.round(delTotal * 1000) / 1000,
    recTotal: Math.round(recTotal * 1000) / 1000,
    prevBottle,
    bottleBalance,
    cashCollected: cash,
    specialDiscount: discount,
    grandTotal,
    currencyCode: pack.currency,
    numberLocale: 'en-PK',
    category: business?.category || category,
    thanks: 'Shukriya · Thank you',
    legend: 'Del = delivered · Rec = empty returned · BAL = bottles with customer',
  };
}

function estimateDailySheetHeightMm(model) {
  const lines = model?.lines?.length || 0;
  return Math.min(Math.max(52 + lines * 4.2 + 36, 72), 200);
}

/**
 * Monospace daily slip lines for perfect 58mm column alignment.
 * Improved layout (32 chars usable ≈ 54mm @ 8.5px courier):
 * PRODUCT------- DEL  REC   AMOUNT
 * 12 chars name + 5 del + 5 rec + 10 amount = 32 total
 */
export function formatWaterDailyLineHeader() {
  return `${pad('PRODUCT', 12)}${pad('DEL', 5, 'right')}${pad('REC', 5, 'right')}${pad('AMOUNT', 10, 'right')}`;
}

export function formatWaterDailyProductLine(line) {
  const name = pad(line.name || 'Item', 12);
  const del = pad(String(line.del ?? 0), 5, 'right');
  const rec = pad(String(line.rec ?? 0), 5, 'right');
  const amt = pad(
    (Number(line.amount) || 0).toFixed(0),
    10,
    'right'
  );
  return `${name}${del}${rec}${amt}`;
}

/**
 * Build exact-size 58mm jsPDF for one daily sale slip.
 */
export async function createWaterDailySalePdf(model) {
  const { default: jsPDF } = await import('jspdf');
  const d = model;
  const pageW = 58;
  const margin = 2.2;
  const contentW = pageW - margin * 2;

  const render = (pageH) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [pageW, pageH],
      orientation: 'portrait',
      compress: true,
    });
    let y = margin + 2;
    const write = (text, opts = {}) => {
      const { size = 7, bold = false, align = 'center' } = opts;
      doc.setFont('courier', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      const x = align === 'center' ? pageW / 2 : align === 'right' ? pageW - margin : margin;
      doc.text(String(text ?? ''), x, y, { align, maxWidth: contentW });
      y += size * 0.38 + 1.0;
    };
    const rule = () => {
      y += 0.5;
      doc.setDrawColor(140);
      doc.line(margin, y, pageW - margin, y);
      y += 2.0;
    };
    const pair = (left, right, size = 7) => {
      doc.setFont('courier', 'normal');
      doc.setFontSize(size);
      doc.text(String(left), margin, y, { maxWidth: contentW * 0.55 });
      doc.text(String(right), pageW - margin, y, { align: 'right' });
      y += 3.0;
    };

    write(d.businessName, { size: 9, bold: true });
    if (d.address) write(d.address, { size: 6 });
    if (d.phone) write(d.phone, { size: 6 });
    rule();
    
    write('DAILY SALE SUMMARY', { size: 8, bold: true });
    write(d.deliveryDate, { size: 7.5, bold: true });
    rule();
    
    // Customer section with better organization
    write(d.customerName, { size: 7.8, bold: true });
    const customerInfo = [];
    if (d.accountNo) customerInfo.push(`A/C: ${d.accountNo}`);
    if (d.townCode) customerInfo.push(`Town: ${d.townCode}`);
    if (customerInfo.length) write(customerInfo.join('  |  '), { size: 6.5 });
    
    const addressInfo = [];
    if (d.houseNo) addressInfo.push(`House: ${d.houseNo}`);
    if (d.floorFlat) addressInfo.push(d.floorFlat);
    if (d.routeLabel) addressInfo.push(d.routeLabel);
    if (addressInfo.length) write(addressInfo.join('  |  '), { size: 6.5 });
    rule();
    
    // Product section with improved header
    write(formatWaterDailyLineHeader(), { size: 6.5, bold: true, align: 'left' });
    y += 0.5;
    doc.setDrawColor(180);
    doc.line(margin, y, pageW - margin, y);
    y += 2.2;
    
    for (const line of d.lines || []) {
      write(formatWaterDailyProductLine(line), { size: 6.5, align: 'left' });
      if (Number(line.rate) > 0) {
        write(`  @ ${money(line.rate, d.currencyCode, d.numberLocale)} per ${line.unit || 'pcs'}`, {
          size: 5.8,
          align: 'left',
        });
        y -= 0.5; // Tighten spacing after rate line
      }
    }
    rule();
    
    // Summary section with better alignment
    pair('Delivered bottles', String(d.delTotal));
    pair('Received empties', String(d.recTotal));
    y += 0.8;
    doc.setDrawColor(200);
    doc.line(margin + 1, y, pageW - margin - 1, y);
    y += 2.5;
    pair('Previous BAL', String(d.prevBottle));
    pair('Current BAL', String(d.bottleBalance), 7.2);
    
    if (d.specialDiscount > 0) {
      y += 0.6;
      pair('Special discount', money(d.specialDiscount, d.currencyCode, d.numberLocale));
    }
    
    y += 1.2;
    pair('Cash collected', money(d.cashCollected, d.currencyCode, d.numberLocale), 7.2);
    
    y += 1.0;
    doc.setDrawColor(30);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 3.8;
    doc.setFont('courier', 'bold');
    doc.setFontSize(9.5);
    doc.text('TOTAL DUE', margin, y);
    doc.text(money(d.grandTotal, d.currencyCode, d.numberLocale), pageW - margin, y, {
      align: 'right',
    });
    y += 5;
    rule();
    write(d.thanks || 'Shukriya · Thank you', { size: 7.5, bold: true });
    y += 0.5;
    write(d.legend || '', { size: 5.8 });
    y += 0.5;
    return { doc, finalY: y };
  };

  const probeH = Math.max(estimateDailySheetHeightMm(d) + 30, 100);
  const { finalY } = render(probeH);
  const pageH = Math.min(Math.max(Math.ceil(finalY + margin + 3), 70), 220);
  const { doc } = render(pageH);
  try {
    doc.internal.pageSize.setWidth(pageW);
    doc.internal.pageSize.setHeight(pageH);
  } catch {
    /* ignore */
  }

  const slug = String(d.accountNo || d.houseNo || d.customerName || 'daily')
    .replace(/[^\w-]+/g, '-')
    .slice(0, 28);
  return {
    doc,
    pageW,
    pageH,
    filename: `water-daily-${d.deliveryDate || 'day'}-${slug}.pdf`,
  };
}

export function buildWaterDailySaleHtml(model) {
  const d = model;
  const pageH = estimateDailySheetHeightMm(d);
  const width = '54mm';
  const styles = `
  @page { size: 58mm ${pageH}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { width: 58mm; max-width: 58mm; }
  body {
    width: ${width}; max-width: ${width}; margin: 0 auto;
    padding: 2.8mm 2.2mm 4.5mm;
    font-family: ui-monospace, 'SF Mono', Menlo, 'Courier New', Consolas, monospace;
    font-size: 8.5px; line-height: 1.32; color: #111;
  }
  .c { text-align: center; }
  .b { font-weight: 700; }
  .t { font-size: 11px; margin-bottom: 0.8mm; letter-spacing: -0.02em; }
  .s { font-size: 7.8px; color: #444; line-height: 1.28; }
  hr { border: none; border-top: 1px dashed #999; margin: 1.8mm 0; }
  .hr-light { border-top: 1px dashed #ccc; margin: 1.2mm 0; }
  .grid { font-size: 7.8px; white-space: pre; letter-spacing: -0.01em; line-height: 1.38; text-align: left; }
  .grid .hdr { font-weight: 700; border-bottom: 1px solid #444; padding-bottom: 0.8mm; margin-bottom: 1mm; }
  .grid .line { padding: 0.4mm 0; }
  .grid .rate { font-size: 6.8px; color: #555; padding-left: 1mm; margin-top: -0.3mm; }
  .row { display: flex; justify-content: space-between; gap: 2mm; font-size: 8.2px; padding: 0.55mm 0; }
  .row-emphasized { font-weight: 700; font-size: 8.5px; }
  .section-divider { border-top: 1px dashed #ddd; margin: 1mm 0; }
  .tot { font-weight: 800; font-size: 10.5px; border-top: 1.5px solid #222; padding-top: 1.8mm; margin-top: 1.5mm; }
  .foot { margin-top: 2.5mm; text-align: center; font-size: 8.2px; line-height: 1.42; }
  .foot-legend { font-size: 6.8px; color: #555; margin-top: 0.8mm; }
  .info-line { font-size: 7.2px; color: #333; margin: 0.3mm 0; }
  `;
  const pair = (l, r, emphasized = false) =>
    `<div class="row${emphasized ? ' row-emphasized' : ''}"><span>${esc(l)}</span><span>${esc(r)}</span></div>`;
  
  // Build product lines with rate annotations
  const productLines = (d.lines || []).map(line => {
    const mainLine = esc(formatWaterDailyProductLine(line));
    const rateLine = Number(line.rate) > 0 
      ? `<div class="rate">@ ${esc(money(line.rate, d.currencyCode, d.numberLocale))} per ${esc(line.unit || 'pcs')}</div>`
      : '';
    return `<div class="line">${mainLine}${rateLine}</div>`;
  }).join('\n');
  
  // Build customer info sections
  const customerInfo = [];
  if (d.accountNo) customerInfo.push(`A/C: ${d.accountNo}`);
  if (d.townCode) customerInfo.push(`Town: ${d.townCode}`);
  const customerInfoLine = customerInfo.length 
    ? `<div class="info-line c">${esc(customerInfo.join('  |  '))}</div>` 
    : '';
  
  const addressInfo = [];
  if (d.houseNo) addressInfo.push(`House: ${d.houseNo}`);
  if (d.floorFlat) addressInfo.push(d.floorFlat);
  if (d.routeLabel) addressInfo.push(d.routeLabel);
  const addressInfoLine = addressInfo.length 
    ? `<div class="info-line c">${esc(addressInfo.join('  |  '))}</div>` 
    : '';
  
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Daily Sale</title><style>${styles}</style></head><body>
  <div class="c b t">${esc(d.businessName)}</div>
  ${d.address ? `<div class="c s">${esc(d.address)}</div>` : ''}
  ${d.phone ? `<div class="c s">${esc(d.phone)}</div>` : ''}
  <hr/>
  <div class="c b" style="font-size: 9px; margin-bottom: 0.5mm;">DAILY SALE SUMMARY</div>
  <div class="c b" style="font-size: 8.5px;">${esc(d.deliveryDate)}</div>
  <hr/>
  <div class="c b" style="font-size: 8.5px; margin-bottom: 0.5mm;">${esc(d.customerName)}</div>
  ${customerInfoLine}
  ${addressInfoLine}
  <hr/>
  <div class="grid">
    <div class="hdr">${esc(formatWaterDailyLineHeader())}</div>
    ${productLines}
  </div>
  <hr/>
  ${pair('Delivered bottles', String(d.delTotal))}
  ${pair('Received empties', String(d.recTotal))}
  <div class="section-divider"></div>
  ${pair('Previous BAL', String(d.prevBottle))}
  ${pair('Current BAL', String(d.bottleBalance), true)}
  ${d.specialDiscount > 0 ? `<div class="section-divider"></div>${pair('Special discount', money(d.specialDiscount, d.currencyCode, d.numberLocale))}` : ''}
  <div class="section-divider"></div>
  ${pair('Cash collected', money(d.cashCollected, d.currencyCode, d.numberLocale), true)}
  <div class="row tot"><span>TOTAL DUE</span><span>${esc(money(d.grandTotal, d.currencyCode, d.numberLocale))}</span></div>
  <hr/>
  <div class="foot">
    <div class="b">${esc(d.thanks)}</div>
    <div class="foot-legend">${esc(d.legend)}</div>
  </div>
</body></html>`;
}

/**
 * Print or download one daily sale slip.
 * @param {object} args
 * @param {'print'|'pdf'} [mode]
 */
export async function printWaterDailySaleBill(args, mode = 'print') {
  const model = buildWaterDailySalePrintModel(args);
  if (!model.lines.length && !(model.cashCollected > 0)) {
    return false;
  }
  if (mode === 'pdf') {
    try {
      const { doc, filename } = await createWaterDailySalePdf(model);
      doc.save(filename);
      return true;
    } catch (err) {
      console.error('printWaterDailySaleBill pdf', err);
      return printThermalReceiptHtml(buildWaterDailySaleHtml(model), { delayMs: 600 });
    }
  }
  try {
    const { doc, pageW, pageH } = await createWaterDailySalePdf(model);
    const ok = await printJsPdfDocument(doc, {
      delayMs: 450,
      pageW,
      pageH,
      title: `Water daily ${pageW}x${pageH}mm`,
    });
    if (ok) return true;
  } catch (err) {
    console.warn('[waterHisab] daily PDF print failed, HTML fallback', err);
  }
  return printThermalReceiptHtml(buildWaterDailySaleHtml(model), { delayMs: 500 });
}

/**
 * Multi-page 58mm: all daily customers with activity (print or Save-as-PDF).
 */
export async function printWaterDailySaleBulk(args, mode = 'pdf') {
  const { business, rows = [], products = [], deliveryDate = '', category } = args;
  const active = (rows || []).filter((row) => {
    const del = Object.values(row.qtyByProduct || {}).some((q) => Number(q) > 0);
    const rec = Object.values(row.recByProduct || {}).some((q) => Number(q) > 0);
    const cash = Number(row.cashCollected) > 0;
    return del || rec || cash;
  });
  if (!active.length) return false;

  if (active.length === 1) {
    return printWaterDailySaleBill(
      { business, row: active[0], products, deliveryDate, category },
      mode === 'print' ? 'print' : 'pdf'
    );
  }

  const models = active.map((row) =>
    buildWaterDailySalePrintModel({ business, row, products, deliveryDate, category })
  );

  // One HTML job with page breaks — keeps 58mm alignment for print + Save as PDF.
  const parts = models.map((m) => {
    const inner = buildWaterDailySaleHtml(m)
      .replace(/^[\s\S]*<body[^>]*>/i, '')
      .replace(/<\/body>[\s\S]*$/i, '');
    return `<section class="slip">${inner}</section>`;
  });
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Water daily bills ${esc(deliveryDate)}</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; }
  .slip {
    width: 58mm; max-width: 58mm; margin: 0 auto;
    page-break-after: always; break-after: page;
  }
  .slip:last-child { page-break-after: auto; break-after: auto; }
</style></head><body>${parts.join('\n')}</body></html>`;
  return printThermalReceiptHtml(html, { delayMs: 700 });
}

/**
 * Period (week/month) print model with water labels + account/cash/BAL extras.
 */
export function buildWaterPeriodPrintModel(args = {}) {
  const base = buildMilkHisabDayBreakdownPrintModel({
    ...args,
    billLocale: args.billLocale || 'en',
  });
  const { kind } = resolvePeriodMeta(args.period, args.periodLabel);
  const documentLabel =
    kind === 'week' ? 'Weekly Water Bill' : kind === 'day' ? 'Daily Water Bill' : 'Monthly Water Bill';

  return {
    ...base,
    documentLabel,
    daySection: 'Day delivery (Y/N)',
    totalSection: 'Product totals',
    totalLabel: 'TOTAL DUE',
    thanks: 'Shukriya · Thank you',
    legend: 'Y = delivered · N = no delivery · Empties on daily route',
    housePrefix: 'H',
    accountNo: args.accountNo || '',
    townCode: args.townCode || '',
    floorFlat: args.floorFlat || '',
    cashCollected: Number(args.cashCollected) || 0,
    specialDiscount: Number(args.specialDiscount) || 0,
    bottleBalance: args.bottleBalance != null ? Number(args.bottleBalance) : null,
    delTotal: Number(args.delTotal) || 0,
    recTotal: Number(args.recTotal) || 0,
  };
}

/**
 * Enhance milk PDF with water meta lines (account / cash / BAL).
 */
async function createWaterPeriodPdf(model) {
  // Prefer milk PDF then we cannot inject easily — build via HTML for extras when needed,
  // or extend milk model header via customerName string.
  const enriched = {
    ...model,
    customerName: [
      model.customerName,
      model.accountNo ? `A/C ${model.accountNo}` : '',
      model.townCode ? `T${model.townCode}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
    houseNo: [model.houseNo, model.floorFlat].filter(Boolean).join(' / '),
  };

  // Append cash/BAL into totals via legend when present
  const extraBits = [];
  if (enriched.delTotal > 0 || enriched.recTotal > 0) {
    extraBits.push(`Del ${enriched.delTotal} · Rec ${enriched.recTotal}`);
  }
  if (enriched.bottleBalance != null) extraBits.push(`BAL ${enriched.bottleBalance}`);
  if (enriched.cashCollected > 0) {
    extraBits.push(`Cash ${money(enriched.cashCollected, enriched.currencyCode, enriched.numberLocale)}`);
  }
  if (extraBits.length) {
    enriched.legend = `${enriched.legend} · ${extraBits.join(' · ')}`;
  }

  return createMilkHisabDayBreakdownPdf(enriched);
}

export async function printWaterPeriodBill(args, mode = 'print') {
  const model = buildWaterPeriodPrintModel(args);
  if (mode === 'pdf') {
    if (model.billLocale === 'ur') {
      return downloadMilkHisabDayBreakdownPdf(model);
    }
    try {
      const { doc, filename } = await createWaterPeriodPdf(model);
      doc.save(filename.replace('hisab-day', 'water-hisab'));
      return true;
    } catch (err) {
      console.error('printWaterPeriodBill pdf', err);
      return downloadMilkHisabDayBreakdownPdf(model);
    }
  }

  if (model.billLocale !== 'ur') {
    try {
      const { doc, pageW, pageH } = await createWaterPeriodPdf(model);
      const ok = await printJsPdfDocument(doc, {
        delayMs: 500,
        pageW,
        pageH,
        title: `Water hisab ${pageW}x${pageH}mm`,
      });
      if (ok) return true;
    } catch (err) {
      console.warn('[waterHisab] period PDF print failed', err);
    }
  }

  const html = buildMilkHisabDayBreakdownHtml(model);
  return printThermalReceiptHtml(html, {
    delayMs: model.billLocale === 'ur' ? 900 : 500,
  });
}

/**
 * Bulk week/month: one print job / PDF dialog for all customers.
 * @param {{ models: object[], periodLabel?: string, kind?: string, mode?: 'print'|'pdf' }} args
 */
export async function printWaterPeriodBulk({ models = [], periodLabel = '', kind = 'month', mode = 'pdf' }) {
  const list = (models || []).filter(Boolean);
  if (!list.length) return false;

  if (list.length === 1) {
    return printWaterPeriodBill(list[0], mode);
  }

  const parts = list.map((args) => {
    const model = buildWaterPeriodPrintModel(args);
    const enriched = {
      ...model,
      customerName: [
        model.customerName,
        model.accountNo ? `A/C ${model.accountNo}` : '',
      ]
        .filter(Boolean)
        .join(' · '),
      houseNo: [model.houseNo, model.floorFlat].filter(Boolean).join(' / '),
    };
    const inner = buildMilkHisabDayBreakdownHtml(enriched)
      .replace(/^[\s\S]*<body[^>]*>/i, '')
      .replace(/<\/body>[\s\S]*$/i, '');
    return `<section class="slip">${inner}</section>`;
  });

  const title =
    kind === 'week'
      ? `Weekly water bills ${periodLabel}`
      : `Monthly water bills ${periodLabel}`;

  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>${esc(title)}</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  body { margin: 0; padding: 0; }
  .slip {
    width: 58mm; max-width: 58mm; margin: 0 auto;
    page-break-after: always; break-after: page;
  }
  .slip:last-child { page-break-after: auto; }
</style></head><body>${parts.join('\n')}</body></html>`;

  return printThermalReceiptHtml(html, { delayMs: 800 });
}

export async function createWaterPeriodPdfBlob(args) {
  const model = buildWaterPeriodPrintModel({ ...args, billLocale: 'en' });
  const { doc, filename } = await createWaterPeriodPdf(model);
  return {
    blob: doc.output('blob'),
    filename: String(filename).replace('hisab-day', 'water-hisab'),
    model,
  };
}

/** Totals-only thermal (invoice / bills row) — water document labels. */
export function buildWaterThermalOptsFromRow({
  business,
  row,
  productColumns = [],
  period = '',
  periodLabel = '',
  category = 'water-delivery',
}) {
  const pack = getBusinessRegionalPack(business);
  const { kind, label } = resolvePeriodMeta(period, periodLabel);
  const documentLabel = kind === 'week' ? 'Weekly Water Bill' : 'Monthly Water Bill';
  const total = Math.round((Number(row?.amount) || 0) * 100) / 100;
  const qtyByProduct = row?.qtyByProduct || {};
  const meta = row?.productMeta || {};
  const lineItems = [];

  for (const col of productColumns) {
    const qty = Number(qtyByProduct[col.id]) || 0;
    if (qty <= 0) continue;
    const unitMeta = meta[col.id] || {};
    const unit = unitMeta.unit || col.unit || '';
    const name = unitMeta.name || col.name || 'Item';
    const unitPrice = Number(unitMeta.unitPrice) || (qty ? total / qty : total);
    lineItems.push({
      name: unit ? `${name} (${unit})` : name,
      quantity: qty,
      unitPrice,
      lineTotal: Math.round(qty * unitPrice * 100) / 100,
    });
  }

  if (!lineItems.length) {
    lineItems.push({
      name: label ? `Water route ${label}` : 'Water route hisab',
      quantity: 1,
      unitPrice: total,
      lineTotal: total,
    });
  }

  const customerBase = row?.customerName || 'Customer';
  const customerName = [
    customerBase,
    row?.accountNo ? `A/C ${row.accountNo}` : '',
    row?.houseNo ? `H ${row.houseNo}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    business,
    documentLabel,
    category: business?.category || category,
    currencyCode: pack.currency,
    paperSize: '58mm',
    sale: {
      invoice_number: row?.invoiceNumber || 'DRAFT',
      date: new Date(),
      customerName,
      paymentMethod: String(row?.paymentStatus || '').toLowerCase() === 'paid' ? 'cash' : 'credit',
    },
    lineItems,
  };
}

export async function printWaterThermalBillFromRow(args, mode = 'print') {
  return dispatchThermalReceipt(buildWaterThermalOptsFromRow(args), mode);
}

export async function printWaterThermalBill(args, mode = 'print') {
  const pack = getBusinessRegionalPack(args.business);
  const { kind, label } = resolvePeriodMeta(args.period, args.periodLabel);
  const invoice = args.invoice || {};
  const items = args.items || [];
  const documentLabel = kind === 'week' ? 'Weekly Water Bill' : 'Monthly Water Bill';
  const customerBase = invoice.customer_name || invoice.customerName || 'Customer';
  const customerName = args.houseNo ? `${customerBase} · H ${args.houseNo}` : customerBase;
  const lineItems = items.map((item) => {
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0);
    const lineTotal = Number(
      item.total_amount ?? item.lineTotal ?? Math.round(qty * unitPrice * 100) / 100
    );
    const unit = item.product_unit || item.unit || '';
    const name = item.name || item.product_name || 'Item';
    return {
      name: unit ? `${name} (${unit})` : name,
      quantity: qty,
      unitPrice,
      lineTotal,
    };
  });
  if (!lineItems.length) {
    const total = Number(invoice.grand_total || invoice.amount || 0);
    lineItems.push({
      name: label ? `Water route ${label}` : 'Water route hisab',
      quantity: 1,
      unitPrice: total,
      lineTotal: total,
    });
  }
  return dispatchThermalReceipt(
    {
      business: args.business,
      documentLabel,
      category: args.business?.category || args.category || 'water-delivery',
      currencyCode: pack.currency,
      paperSize: '58mm',
      sale: {
        invoice_number: invoice.invoice_number || invoice.invoiceNumber || 'DRAFT',
        date: invoice.date || invoice.created_at || new Date(),
        customerName,
        paymentMethod:
          invoice.payment_status === 'paid' ? invoice.payment_method || 'cash' : 'credit',
      },
      lineItems,
    },
    mode
  );
}

export {
  formatWaterHisabDayHeaderLine,
  formatMilkHisabDayLine as formatWaterHisabDayLine,
};
