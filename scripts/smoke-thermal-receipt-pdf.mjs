/**
 * Smoke: thermal PDF MediaBox is exact 58mm width with content-fit height.
 */
import { createThermalReceiptPdf, buildThermalReceiptHtml } from '../lib/print/thermalReceipt.js';

const opts = {
  business: {
    business_name: 'Test Mart',
    settings: { pos: { paperSize: '58mm', receiptFooter: 'Come again' } },
  },
  documentLabel: 'Receipt',
  category: 'supermarket',
  currencyCode: 'PKR',
  sale: {
    transaction_number: 'POS-1001',
    subtotal: 150,
    taxAmount: 0,
    discountAmount: 0,
    total: 150,
    paymentMethod: 'cash',
  },
  lineItems: [
    { name: 'Milk 1L', sku: 'MLK-1', quantity: 2, unitPrice: 50, lineTotal: 100 },
    { name: 'Bread', quantity: 1, unitPrice: 50, lineTotal: 50 },
  ],
  paperSize: '58mm',
};

const { pageW, pageH, doc } = await createThermalReceiptPdf(opts);
const html = buildThermalReceiptHtml(opts);
const okPage = pageW === 58 && pageH >= 50 && pageH <= 320;
const okHtml = html.includes('size: 58mm') && html.includes('mm; margin: 0');
const bytes = doc.output('arraybuffer').byteLength;

console.log(JSON.stringify({ pageW, pageH, okPage, okHtml, pdfBytes: bytes }));
if (!okPage || !okHtml || bytes < 500) {
  console.error('thermal PDF smoke failed');
  process.exit(1);
}
console.log('thermal PDF smoke passed');
