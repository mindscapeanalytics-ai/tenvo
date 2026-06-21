/**
 * 58mm thermal receipt HTML (browser print — no ESC/POS).
 */

function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function money(amount, currencyCode = 'PKR') {
  const n = Number(amount) || 0;
  return `${currencyCode} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * @param {object} opts
 * @param {object} opts.business
 * @param {string} [opts.documentLabel] - e.g. Receipt, Tax Invoice
 * @param {string} [opts.category]
 * @param {object} opts.sale
 * @param {Array<{ name: string; quantity: number; unitPrice?: number; lineTotal?: number; sku?: string }>} opts.lineItems
 * @param {string} [opts.currencyCode]
 */
export function buildThermalReceiptHtml({
  business = {},
  documentLabel = 'Receipt',
  category = '',
  sale = {},
  lineItems = [],
  currencyCode = 'PKR',
}) {
  const settings =
    business?.settings && typeof business.settings === 'object'
      ? business.settings
      : {};
  const tax = settings?.tax || settings?.compliance || {};

  const lines = [];
  const push = (text, className = '') => lines.push({ text, className });

  push(business?.business_name || business?.name || 'Tenvo Business', 'center bold title');
  if (business?.address) push(business.address, 'center small');
  const taxLine = [tax.ntn && `NTN: ${tax.ntn}`, tax.srn && `SRN: ${tax.srn}`].filter(Boolean).join(' · ');
  if (taxLine) push(taxLine, 'center small');
  if (business?.phone) push(business.phone, 'center small');

  push('─'.repeat(32), 'divider');
  push(documentLabel.toUpperCase(), 'center bold');
  if (category) push(category.replace(/-/g, ' '), 'center small muted');

  const ref =
    sale.invoice_number ||
    sale.transaction_number ||
    sale.saleNumber ||
    sale.invoiceNumber ||
    '—';
  push(`Ref: ${ref}`, 'row');
  push(`Date: ${new Date(sale.date || Date.now()).toLocaleString()}`, 'row');
  if (sale.customerName) push(`Customer: ${sale.customerName}`, 'row');
  const payMethod = (sale.paymentMethod || sale.payment_method || 'cash').toString().toUpperCase();
  push(`Payment: ${payMethod}`, 'row');

  push('─'.repeat(32), 'divider');
  push('ITEM                QTY    AMT', 'header');
  push('─'.repeat(32), 'divider');

  for (const item of lineItems) {
    const name = (item.name || 'Item').slice(0, 18).padEnd(18);
    const qty = String(item.quantity ?? 1).padStart(3);
    const amt = money(item.lineTotal ?? (item.unitPrice || 0) * (item.quantity || 1), '').replace(currencyCode, '').trim();
    push(`${name} ${qty} ${amt}`, 'mono');
    if (item.sku) push(`  ${item.sku}`, 'small muted');
  }

  push('─'.repeat(32), 'divider');

  if (sale.subtotal != null) {
    push(`Subtotal: ${money(sale.subtotal, currencyCode)}`, 'row right');
  }
  if (sale.taxAmount > 0) {
    push(`Tax: ${money(sale.taxAmount, currencyCode)}`, 'row right');
  }
  if (sale.discountAmount > 0) {
    push(`Discount: -${money(sale.discountAmount, currencyCode)}`, 'row right');
  }

  push(`TOTAL: ${money(sale.total, currencyCode)}`, 'total');
  if (sale.amountTendered != null && sale.changeDue != null) {
    push(`Tendered: ${money(sale.amountTendered, currencyCode)}`, 'row right');
    push(`Change: ${money(sale.changeDue, currencyCode)}`, 'row right');
  }

  push('─'.repeat(32), 'divider');
  push('Thank you for your business!', 'center');
  push('Powered by Tenvo', 'center small muted');

  const body = lines
    .map((line) => {
      const cls = line.className ? ` class="${line.className}"` : '';
      if (line.className === 'divider') {
        return `<div${cls}>${esc(line.text)}</div>`;
      }
      return `<div${cls}>${esc(line.text)}</div>`;
    })
    .join('\n');

  return `<!doctype html>
<html><head><meta charset="utf-8"/><title>${esc(documentLabel)}</title>
<style>
  @page { size: 58mm auto; margin: 2mm; }
  * { box-sizing: border-box; }
  body {
    width: 54mm;
    max-width: 54mm;
    margin: 0 auto;
    padding: 2mm 1mm 4mm;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    line-height: 1.35;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: 700; }
  .title { font-size: 11px; }
  .small { font-size: 9px; }
  .muted { color: #555; }
  .header { font-weight: 700; font-size: 9px; }
  .total { font-weight: 800; font-size: 12px; text-align: right; margin-top: 2mm; }
  .divider { letter-spacing: -1px; overflow: hidden; white-space: nowrap; }
  .mono { white-space: pre; font-size: 9px; }
</style></head><body>${body}</body></html>`;
}

/** Open thermal receipt in print dialog (client only). */
export function printThermalReceiptHtml(html) {
  if (typeof window === 'undefined') return false;
  const win = window.open('', '_blank', 'width=320,height=720');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  return true;
}
