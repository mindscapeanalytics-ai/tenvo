/**
 * Invoice PDF + form format checks.
 * Run: bun run verify:invoice-pdf
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CONTENT_WIDTH,
  parseHexColorToRgb,
  resolveInvoiceBrandColor,
  resolveInvoiceDocumentTitle,
  formatPdfPaymentMethod,
  formatPdfProvinceLabel,
  normalizePdfLineItem,
} from '../lib/pdf/invoiceFormat.js';

const root = process.cwd();
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const colSum = 10 + 68 + 14 + 16 + 30 + 16 + 28;
assert.equal(colSum, CONTENT_WIDTH, `PDF column widths must sum to CONTENT_WIDTH (${CONTENT_WIDTH}), got ${colSum}`);

assert.deepEqual(parseHexColorToRgb('#8B1538'), [139, 21, 56]);
assert.deepEqual(parseHexColorToRgb('#abc'), [170, 187, 204]);
assert.deepEqual(
  resolveInvoiceBrandColor({ settings: { brand: { primaryColor: '#0d9488' } } }),
  [13, 148, 136]
);
assert.deepEqual(
  resolveInvoiceBrandColor({}, { brand: { primaryColor: '#111827' } }),
  [17, 24, 39]
);

assert.equal(
  resolveInvoiceDocumentTitle({ category: 'ceramics-tiles', invoiceType: 'retail' }),
  'SALES INVOICE'
);
assert.equal(
  resolveInvoiceDocumentTitle({ category: 'pharmacy', invoiceType: 'retail' }),
  'SALES BILL'
);
assert.equal(
  resolveInvoiceDocumentTitle({ category: 'retail-shop', invoiceType: 'tax', isPakistaniDomain: true }),
  'TAX INVOICE'
);
assert.equal(
  resolveInvoiceDocumentTitle({ category: 'unknown-vertical', invoiceType: 'retail' }),
  'SALES INVOICE'
);
assert.equal(
  resolveInvoiceDocumentTitle({ category: 'garments', invoiceType: 'export' }),
  'EXPORT INVOICE'
);

assert.equal(formatPdfPaymentMethod('cod'), 'Cash on Delivery');
assert.equal(formatPdfPaymentMethod('bank_transfer'), 'Bank Transfer');
assert.equal(formatPdfProvinceLabel('punjab'), 'Punjab');
assert.equal(formatPdfProvinceLabel('kp'), 'Khyber Pakhtunkhwa');

const line = normalizePdfLineItem({
  name: 'Marble',
  quantity: 2,
  unit: 'sqft',
  rate: 450,
  amount: 900,
  taxPercent: 0,
});
assert.equal(line.unit, 'sqft');
assert.equal(line.amount, 900);

const core = read('lib/pdf/invoicePdfCore.js');
assert.ok(core.includes('tableWidth: CONTENT_WIDTH'), 'PDF table uses full content width');
assert.ok(core.includes('resolveInvoiceBrandColor'), 'PDF uses tenant brand color');
assert.ok(core.includes('formatPdfPaymentMethod'), 'PDF formats payment method labels');

const builder = read('components/EnhancedInvoiceBuilder.jsx');
assert.ok(builder.includes("invoiceType: 'retail'"), 'Invoice form defaults to retail/sales');
assert.ok(builder.includes('domainInvoiceLabel'), 'Document type uses domain sales label');
assert.ok(builder.includes('Unit</th>'), 'Line table includes Unit column');

const api = read('lib/api/invoice.js');
assert.ok(
  api.includes('payment_method: invoiceData.payment_method || invoiceData.paymentMethod'),
  'API maps paymentMethod'
);
assert.ok(api.includes('invoice_type:'), 'API persists invoice_type in tax_details');

console.log('verify-invoice-pdf-format: ok');
