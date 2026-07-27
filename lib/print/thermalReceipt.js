/**
 * Thermal receipt (58mm / 80mm) — PDF MediaBox print (exact paper size) + HTML fallback.
 */

import { getBusinessRegionalPack } from '@/lib/utils/businessRegionalContext';
import { getDomainConfig } from '@/lib/config/domains';
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { CASH_DRAWER_KICK_SEQUENCE } from '@/lib/utils/posCashDrawer';
import { resolvePosSettings } from '@/lib/config/posSettings';

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

function moneyNum(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lineAmount(item) {
  const qty = Number(item.quantity) || 1;
  const unit = Number(item.unitPrice) || 0;
  if (item.lineTotal != null && Number.isFinite(Number(item.lineTotal))) {
    return Number(item.lineTotal);
  }
  return Math.round(unit * qty * 100) / 100;
}

/** @returns {object} Normalized receipt payload */
export function normalizeReceiptData({
  business = {},
  documentLabel = 'Receipt',
  category = '',
  sale = {},
  lineItems = [],
  currencyCode,
}) {
  const pack = getBusinessRegionalPack(business);
  const settings =
    business?.settings && typeof business.settings === 'object'
      ? business.settings
      : {};
  const tax = settings?.tax || settings?.compliance || {};
  const posSettings = resolvePosSettings(business);

  const resolvedCurrency = currencyCode || pack.currency || 'PKR';
  const taxId = business?.ntn || tax.ntn || tax.tax_id;
  const taxLineParts = [];
  if (taxId) taxLineParts.push(`${pack.taxIdLabel}: ${taxId}`);
  if (pack.countryIso === 'PK' && tax.srn) taxLineParts.push(`SRN: ${tax.srn}`);

  const ref =
    sale.invoice_number ||
    sale.transaction_number ||
    sale.saleNumber ||
    sale.invoiceNumber ||
    (sale.isDraft ? 'DRAFT' : 'N/A');

  const rows = (lineItems || []).map((item) => ({
    name: item.name || 'Item',
    sku: item.sku || null,
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitPrice) || 0,
    amount: lineAmount(item),
  }));

  const computedSubtotal = rows.reduce(
    (s, r) => s + r.unitPrice * r.quantity,
    0
  );
  const subtotal = sale.subtotal != null ? Number(sale.subtotal) : computedSubtotal;
  const taxAmount = Number(sale.taxAmount ?? sale.tax_amount ?? 0);
  const discountAmount = Number(sale.discountAmount ?? sale.discount_amount ?? 0);
  const total =
    sale.total != null
      ? Number(sale.total)
      : Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;

  const domain = getDomainConfig(resolveDomainKey(category) || category) || {};
  const categoryLabel =
    domain?.label_overrides?.invoice
    || domain?.name
    || (category ? String(category).replace(/-/g, ' ') : '');

  const receiptFooter = String(posSettings.receiptFooter || '').trim();

  return {
    businessName: business?.business_name || business?.name || 'Store',
    address: business?.address || '',
    phone: business?.phone || '',
    taxLine: taxLineParts.join(' · '),
    documentLabel: String(documentLabel || 'Receipt'),
    categoryLabel,
    receiptFooter,
    paperSize: posSettings.paperSize === '80mm' ? '80mm' : '58mm',
    currencyCode: resolvedCurrency,
    taxLabel: pack.taxLabel || 'Tax',
    locale: pack.locale || 'en',
    ref,
    date: new Date(sale.date || Date.now()).toLocaleString(pack.locale || undefined),
    customerName: sale.customerName || sale.customer_name || null,
    paymentMethod: String(sale.paymentMethod || sale.payment_method || 'cash').toUpperCase(),
    rows,
    subtotal,
    taxAmount,
    discountAmount,
    total,
    amountTendered:
      sale.amountTendered != null && sale.amountTendered !== ''
        ? Number(sale.amountTendered)
        : null,
    changeDue: sale.changeDue != null ? Number(sale.changeDue) : null,
    isDraft: Boolean(sale.isDraft),
  };
}

export function buildReceiptFilename(data, ext = 'pdf') {
  const slug = String(data.ref || 'receipt')
    .replace(/[^\w-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
  return `${slug || 'receipt'}.${ext}`;
}

function estimateReceiptPageHeightMm(rowCount = 0, hasFooter = false) {
  let h = 52 + Math.max(0, Number(rowCount) || 0) * 9 + 32;
  if (hasFooter) h += 8;
  return Math.min(Math.max(Math.ceil(h), 60), 320);
}

function getReceiptStyles(paperSize = '58mm', pageHeightMm = 120) {
  const width = paperSize === '80mm' ? '76mm' : '54mm';
  const pageH = Math.min(Math.max(Number(pageHeightMm) || 120, 50), 320);
  return `
  @page { size: ${paperSize} ${pageH}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html {
    width: ${paperSize};
    max-width: ${paperSize};
    height: ${pageH}mm;
  }
  body {
    width: ${width};
    max-width: ${width};
    margin: 0 auto;
    padding: 3mm 2.5mm 5mm;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 9px;
    line-height: 1.4;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    html, body {
      width: ${width} !important;
      max-width: ${width} !important;
    }
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .title { font-size: 11px; margin-bottom: 1mm; }
  .small { font-size: 8px; color: #444; }
  .muted { color: #666; }
  .meta { margin: 2mm 0; }
  .meta-row { display: flex; justify-content: space-between; gap: 2mm; font-size: 8.5px; }
  .meta-row span:first-child { color: #555; flex-shrink: 0; }
  .meta-row span:last-child { text-align: right; word-break: break-word; }
  hr {
    border: none;
    border-top: 1px dashed #999;
    margin: 2.5mm 0;
  }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .items thead th {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    padding: 1mm 0 1.5mm;
    border-bottom: 1px solid #333;
  }
  .items th.col-item, .items td.col-item { text-align: left; width: 58%; }
  .items th.col-qty, .items td.col-qty { text-align: right; width: 14%; }
  .items th.col-amt, .items td.col-amt { text-align: right; width: 28%; }
  .items tbody td {
    vertical-align: top;
    padding: 1.5mm 0;
    font-size: 8.5px;
    border-bottom: 1px dotted #ddd;
  }
  .items tbody tr:last-child td { border-bottom: none; }
  .item-name { font-weight: 600; line-height: 1.25; word-wrap: break-word; }
  .item-sku { font-size: 7.5px; color: #666; margin-top: 0.5mm; }
  .totals { margin-top: 2mm; font-size: 8.5px; }
  .totals td { padding: 0.8mm 0; vertical-align: top; }
  .totals td.label { text-align: left; color: #444; width: 55%; }
  .totals td.value { text-align: right; width: 45%; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .totals tr.grand td { font-weight: 800; font-size: 11px; padding-top: 2mm; border-top: 1px solid #333; }
  .totals tr.grand td.value { color: #111; }
  .footer { margin-top: 3mm; text-align: center; font-size: 8.5px; }
  .footer .thanks { font-weight: 600; margin-bottom: 1mm; }
  .footer .custom { margin-top: 1.5mm; white-space: pre-wrap; word-break: break-word; }
`;
}

/**
 * @param {object} opts — same as normalizeReceiptData
 */
export function buildThermalReceiptHtml(opts) {
  const d = normalizeReceiptData(opts);
  const paperSize =
    opts.paperSize === '80mm' || opts.paperSize === '58mm'
      ? opts.paperSize
      : d.paperSize || '58mm';

  const itemRows = d.rows
    .map(
      (row) => `
    <tr>
      <td class="col-item">
        <div class="item-name">${esc(row.name)}</div>
        ${row.sku ? `<div class="item-sku">${esc(row.sku)}</div>` : ''}
      </td>
      <td class="col-qty">${esc(String(row.quantity))}</td>
      <td class="col-amt">${esc(moneyNum(row.amount))}</td>
    </tr>`
    )
    .join('');

  const totalRows = [
    d.subtotal != null
      ? `<tr><td class="label">Subtotal</td><td class="value">${esc(money(d.subtotal, d.currencyCode, d.locale))}</td></tr>`
      : '',
    d.taxAmount > 0
      ? `<tr><td class="label">${esc(d.taxLabel)}</td><td class="value">${esc(money(d.taxAmount, d.currencyCode, d.locale))}</td></tr>`
      : '',
    d.discountAmount > 0
      ? `<tr><td class="label">Discount</td><td class="value">-${esc(money(d.discountAmount, d.currencyCode, d.locale))}</td></tr>`
      : '',
    `<tr class="grand"><td class="label">TOTAL</td><td class="value">${esc(money(d.total, d.currencyCode, d.locale))}</td></tr>`,
    d.amountTendered != null
      ? `<tr><td class="label">Tendered</td><td class="value">${esc(money(d.amountTendered, d.currencyCode, d.locale))}</td></tr>`
      : '',
    d.changeDue != null && d.changeDue >= 0
      ? `<tr><td class="label">Change</td><td class="value">${esc(money(d.changeDue, d.currencyCode, d.locale))}</td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const metaRows = [
    ['Ref', d.ref],
    ['Date', d.date],
    d.customerName ? ['Customer', d.customerName] : null,
    ['Payment', d.paymentMethod],
  ]
    .filter(Boolean)
    .map(
      ([label, value]) =>
        `<div class="meta-row"><span>${esc(label)}</span><span>${esc(value)}</span></div>`
    )
    .join('');

  const pageHeightMm = estimateReceiptPageHeightMm(d.rows.length, Boolean(d.receiptFooter));

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>${esc(d.documentLabel)}</title>
<style>${getReceiptStyles(paperSize, pageHeightMm)}</style>
</head><body>
  ${opts.kickCashDrawer ? `<div aria-hidden="true" style="font-size:1px;line-height:0;color:#fff;height:0;overflow:hidden">${CASH_DRAWER_KICK_SEQUENCE}</div>` : ''}
  <div class="center bold title">${esc(d.businessName)}</div>
  ${d.address ? `<div class="center small">${esc(d.address)}</div>` : ''}
  ${d.taxLine ? `<div class="center small">${esc(d.taxLine)}</div>` : ''}
  ${d.phone ? `<div class="center small">${esc(d.phone)}</div>` : ''}
  <hr/>
  <div class="center bold">${esc(d.documentLabel.toUpperCase())}</div>
  ${d.categoryLabel ? `<div class="center small muted">${esc(d.categoryLabel)}</div>` : ''}
  <div class="meta">${metaRows}</div>
  <hr/>
  <table class="items">
    <thead>
      <tr>
        <th class="col-item">Item</th>
        <th class="col-qty">Qty</th>
        <th class="col-amt">Amt</th>
      </tr>
    </thead>
    <tbody>${itemRows || '<tr><td colspan="3" class="center muted">No items</td></tr>'}</tbody>
  </table>
  <hr/>
  <table class="totals"><tbody>${totalRows}</tbody></table>
  <hr/>
  <div class="footer">
    <div class="thanks">Thank you for your business!</div>
    ${d.receiptFooter ? `<div class="custom small">${esc(d.receiptFooter)}</div>` : ''}
    <div class="small muted">Powered by Tenvo</div>
  </div>
</body></html>`;
}

const PRINT_FRAME_ID = 'tenvo-receipt-print-frame';
const PDF_PRINT_FRAME_ID = 'tenvo-receipt-pdf-print-frame';

/** Print via hidden iframe — no pop-up blocker.
 * @param {string} html
 * @param {{ delayMs?: number }} [opts]
 */
export function printThermalReceiptHtml(html, opts = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  let iframe = document.getElementById(PRINT_FRAME_ID);
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = PRINT_FRAME_ID;
    iframe.setAttribute('title', 'Receipt print');
    // Ensure iframe is rendered (not 0x0) but invisible so the browser doesn't skip it.
    iframe.style.cssText =
      'position:absolute;width:1px;height:1px;top:-9999px;left:-9999px;border:0;opacity:0;pointer-events:none;z-index:-9999;';
    document.body.appendChild(iframe);
  }

  const win = iframe.contentWindow;
  if (!win) return false;

  const doc = win.document;
  doc.open();
  doc.write(html);
  doc.close();

  const delayMs = Math.max(200, Number(opts.delayMs) || 280);

  const triggerPrint = () => {
    try {
      win.focus();
      win.print();
    } catch {
      /* ignore */
    }
  };

  // Wait long enough for styles (and optional webfonts) to parse and render
  if (win.document.readyState === 'complete') {
    setTimeout(triggerPrint, delayMs);
  } else {
    iframe.onload = () => setTimeout(triggerPrint, delayMs);
  }

  return true;
}

/**
 * Render receipt content onto a jsPDF instance of fixed width/height (mm).
 * @returns {{ doc: import('jspdf').jsPDF, finalY: number }}
 */
function renderThermalReceiptOntoPdf(jsPDF, autoTable, d, pageW, pageH) {
  const margin = 2;
  const contentW = pageW - margin * 2;

  const doc = new jsPDF({
    unit: 'mm',
    format: [pageW, pageH],
    orientation: 'portrait',
    compress: true,
  });

  let y = margin + 2;

  const line = (text, opts2 = {}) => {
    const { size = 7, style = 'normal', align = 'left', bold = false } = opts2;
    doc.setFont('courier', bold ? 'bold' : style);
    doc.setFontSize(size);
    const x = align === 'center' ? pageW / 2 : align === 'right' ? pageW - margin : margin;
    doc.text(String(text), x, y, { align, maxWidth: contentW });
    y += size * 0.42 + 1.2;
  };

  line(d.businessName, { size: 10, align: 'center', bold: true });
  if (d.address) line(d.address, { size: 7, align: 'center' });
  if (d.taxLine) line(d.taxLine, { size: 7, align: 'center' });
  if (d.phone) line(d.phone, { size: 7, align: 'center' });

  y += 1;
  doc.setDrawColor(160);
  doc.line(margin, y, pageW - margin, y);
  y += 3.5;

  line(d.documentLabel.toUpperCase(), { size: 9, align: 'center', bold: true });
  if (d.categoryLabel) line(d.categoryLabel, { size: 7, align: 'center' });

  y += 0.5;
  for (const [label, value] of [
    ['Ref', d.ref],
    ['Date', d.date],
    ...(d.customerName ? [['Customer', d.customerName]] : []),
    ['Payment', d.paymentMethod],
  ]) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text(`${label}:`, margin, y);
    doc.text(String(value), pageW - margin, y, { align: 'right', maxWidth: contentW * 0.62 });
    y += 3.2;
  }

  y += 1;
  doc.line(margin, y, pageW - margin, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth: contentW,
    head: [['Item', 'Qty', 'Amt']],
    body: d.rows.map((row) => [
      row.sku ? `${row.name}\n${row.sku}` : row.name,
      String(row.quantity),
      moneyNum(row.amount),
    ]),
    theme: 'plain',
    styles: {
      font: 'courier',
      fontSize: 7,
      cellPadding: 0.7,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fontStyle: 'bold',
      fillColor: false,
      textColor: 20,
      lineWidth: { bottom: 0.15 },
      lineColor: [0, 0, 0],
    },
    bodyStyles: { fillColor: false, textColor: 20 },
    columnStyles: {
      0: { cellWidth: contentW * 0.56, halign: 'left' },
      1: { cellWidth: contentW * 0.14, halign: 'right' },
      2: { cellWidth: contentW * 0.3, halign: 'right' },
    },
  });

  y = doc.lastAutoTable.finalY + 3;
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  for (const [label, value] of [
    ['Subtotal', money(d.subtotal, d.currencyCode, d.locale)],
    ...(d.taxAmount > 0 ? [[d.taxLabel, money(d.taxAmount, d.currencyCode, d.locale)]] : []),
    ...(d.discountAmount > 0 ? [['Discount', `-${money(d.discountAmount, d.currencyCode, d.locale)}`]] : []),
    ['TOTAL', money(d.total, d.currencyCode, d.locale)],
    ...(d.amountTendered != null ? [['Tendered', money(d.amountTendered, d.currencyCode, d.locale)]] : []),
    ...(d.changeDue != null && d.changeDue >= 0 ? [['Change', money(d.changeDue, d.currencyCode, d.locale)]] : []),
  ]) {
    const isGrand = label === 'TOTAL';
    doc.setFont('courier', isGrand ? 'bold' : 'normal');
    doc.setFontSize(isGrand ? 9 : 7.5);
    doc.text(label, margin, y);
    doc.text(String(value), pageW - margin, y, { align: 'right' });
    y += isGrand ? 5 : 3.5;
  }

  y += 2;
  doc.line(margin, y, pageW - margin, y);
  y += 4;
  line('Thank you for your business!', { size: 8, align: 'center', bold: true });
  if (d.receiptFooter) line(d.receiptFooter, { size: 7, align: 'center' });
  line('Powered by Tenvo', { size: 7, align: 'center' });

  return { doc, finalY: y };
}

/**
 * Build a jsPDF document sized exactly to thermal paper (58mm or 80mm).
 * Two-pass layout so MediaBox height matches content (no Letter/A4 leftover).
 * @param {object} opts
 * @returns {Promise<{ doc: import('jspdf').jsPDF, data: ReturnType<typeof normalizeReceiptData>, pageW: number, pageH: number }>}
 */
export async function createThermalReceiptPdf(opts = {}) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const d = normalizeReceiptData(opts);
  const paperSize =
    opts.paperSize === '80mm' || opts.paperSize === '58mm'
      ? opts.paperSize
      : d.paperSize || '58mm';
  const pageW = paperSize === '80mm' ? 80 : 58;
  const margin = 2;

  // Pass 1: tall canvas to measure content end
  const probeH = Math.max(estimateReceiptPageHeightMm(d.rows.length, Boolean(d.receiptFooter)) + 40, 200);
  const { finalY } = renderThermalReceiptOntoPdf(jsPDF, autoTable, d, pageW, probeH);
  const pageH = Math.min(Math.max(Math.ceil(finalY + margin + 3), 50), 320);

  // Pass 2: exact MediaBox for the print dialog / thermal driver
  const { doc } = renderThermalReceiptOntoPdf(jsPDF, autoTable, d, pageW, pageH);
  try {
    doc.internal.pageSize.setWidth(pageW);
    doc.internal.pageSize.setHeight(pageH);
  } catch {
    /* older jspdf */
  }

  return { doc, data: d, pageW, pageH };
}

/**
 * Print an existing jsPDF document via blob iframe (exact MediaBox).
 * @param {import('jspdf').jsPDF} doc
 * @param {{ delayMs?: number, title?: string, pageW?: number, pageH?: number, autoPrint?: boolean }} [printOpts]
 */
export async function printJsPdfDocument(doc, printOpts = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !doc) return false;

  if (printOpts.autoPrint !== false) {
    try {
      doc.autoPrint({ variant: 'non-conform' });
    } catch {
      try {
        doc.autoPrint();
      } catch {
        /* ignore */
      }
    }
  }

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  let iframe = document.getElementById(PDF_PRINT_FRAME_ID);
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = PDF_PRINT_FRAME_ID;
    iframe.setAttribute('title', printOpts.title || 'Thermal PDF print');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:absolute;width:1px;height:1px;top:-9999px;left:-9999px;border:0;opacity:0;pointer-events:none;z-index:-9999;';
    document.body.appendChild(iframe);
  }

  const delayMs = Math.max(400, Number(printOpts.delayMs) || 500);
  const pageW = printOpts.pageW;
  const pageH = printOpts.pageH;

  return await new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      setTimeout(() => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          /* ignore */
        }
      }, 60_000);
      resolve(ok);
    };

    const triggerPrint = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) {
          finish(false);
          return;
        }
        win.focus();
        win.print();
        finish(true);
      } catch {
        finish(false);
      }
    };

    iframe.onload = () => setTimeout(triggerPrint, delayMs);
    iframe.onerror = () => finish(false);
    if (pageW && pageH) {
      iframe.setAttribute('title', printOpts.title || `Receipt ${pageW}x${pageH}mm`);
    }
    iframe.src = url;

    setTimeout(() => {
      if (settled) return;
      triggerPrint();
    }, delayMs + 1400);
  });
}

/**
 * Print a thermal PDF at its native MediaBox size (58mm/80mm).
 * Uses jsPDF autoPrint + blob iframe so Chrome/Edge use the PDF page size
 * instead of Letter/A4 from HTML @page.
 * @param {object} opts
 * @param {{ delayMs?: number }} [printOpts]
 */
export async function printThermalReceiptPdf(opts = {}, printOpts = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const { doc, pageW, pageH } = await createThermalReceiptPdf(opts);
  return printJsPdfDocument(doc, {
    delayMs: printOpts.delayMs,
    pageW,
    pageH,
    title: `Receipt ${pageW}x${pageH}mm`,
  });
}

/** Direct PDF download (58mm thermal layout). */
export async function downloadThermalReceiptPdf(opts) {
  try {
    const { doc, data } = await createThermalReceiptPdf(opts);
    doc.save(buildReceiptFilename(data, 'pdf'));
    return true;
  } catch (err) {
    console.error('downloadThermalReceiptPdf', err);
    return false;
  }
}

/**
 * @param {object} opts — receipt build options
 * @param {'print'|'pdf'} [mode='print']
 */
export async function dispatchThermalReceipt(opts, mode = 'print') {
  try {
    if (mode === 'pdf') {
      if (typeof window === 'undefined') return false;
      return await downloadThermalReceiptPdf(opts);
    }
    // Enterprise till path: exact-size PDF MediaBox (avoids Letter/A4 HTML @page bugs).
    // ESC/POS drawer kick cannot ride inside a PDF — use printer-driver "open on print"
    // or Cash tools → Open drawer (short labeled slip). Fall back to HTML if PDF fails.
    try {
      const ok = await printThermalReceiptPdf(opts, {
        delayMs: opts.printDelayMs != null ? opts.printDelayMs : 500,
      });
      if (ok) return true;
    } catch (pdfErr) {
      console.warn('[thermalReceipt] PDF print failed, falling back to HTML', pdfErr);
    }

    const html = buildThermalReceiptHtml(opts);
    return printThermalReceiptHtml(html, {
      delayMs: opts.printDelayMs != null ? opts.printDelayMs : 320,
    });
  } catch (err) {
    console.error('dispatchThermalReceipt', err);
    return false;
  }
}

