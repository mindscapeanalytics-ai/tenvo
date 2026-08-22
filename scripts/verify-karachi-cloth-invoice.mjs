#!/usr/bin/env node

/**
 * Verification Script for Karachi Cloth Market Pakistan Textile Wholesale Invoice Form
 * Run: bun scripts/verify-karachi-cloth-invoice.mjs
 */

import assert from 'node:assert/strict';
import { resolveTextileLineQty, autoFillTextileLineOnUnitChange } from '../lib/utils/invoiceHelpers.js';
import { normalizePdfLineItem } from '../lib/pdf/invoiceFormat.js';
import { buildInvoicePDFDoc } from '../lib/pdf/invoicePdfCore.js';

console.log('\n🔍 VERIFYING KARACHI CLOTH MARKET INVOICE FORM & CALCULATIONS\n');

// 1. Direct Decimal Meter Sales
const meterItem = { quantity: 17.75, unit: 'meter', rate: 420 };
const meterConv = resolveTextileLineQty(meterItem);
assert.equal(meterConv.displayQty, 17.75);
assert.equal(meterConv.displayUnit, 'Meter');
assert.equal(meterConv.totalMeters, 17.75);
assert.equal(meterConv.conversionNote, '17.75 Meters');
console.log('✅ Decimal meter quantity resolved:', meterConv);

// 2. Thaan Roll Breakdown Calculation
const thaanItem = { quantity: 3, unit: 'thaan', thaan_breakdown: '38.5, 41, 40', rate: 350 };
const thaanConv = resolveTextileLineQty(thaanItem);
assert.equal(thaanConv.displayQty, 3);
assert.equal(thaanConv.displayUnit, 'Thaan');
assert.equal(thaanConv.totalMeters, 119.5);
assert.equal(thaanConv.conversionNote, '3 Thaan (38.5m, 41m, 40m) = 119.5m');
console.log('✅ Thaan roll breakdown resolved:', thaanConv);

// 3. Suit Cutting Calculation
const suitItem = { quantity: 10, unit: 'suit', suit_cutting: 4.25, rate: 500 };
const suitConv = resolveTextileLineQty(suitItem);
assert.equal(suitConv.displayQty, 10);
assert.equal(suitConv.displayUnit, 'Suit');
assert.equal(suitConv.totalMeters, 42.5);
assert.equal(suitConv.conversionNote, '10 Suits × 4.25m/suit = 42.5m');
console.log('✅ Suit cutting calculation resolved:', suitConv);

// 4. Gaz / Yard Conversion
const gazItem = { quantity: 100, unit: 'gaz', rate: 300 };
const gazConv = resolveTextileLineQty(gazItem);
assert.equal(gazConv.displayQty, 100);
assert.equal(gazConv.displayUnit, 'Gaz');
assert.equal(gazConv.totalMeters, 91.44);
console.log('✅ Gaz / Yard conversion resolved:', gazConv);

// 5. Unit change auto-fill
const unitFill = autoFillTextileLineOnUnitChange({ rate: 400 }, { price: 400, domain_data: { thaanlength: 40 } }, 'thaan');
assert.equal(unitFill.thaan_length, 40);
assert.equal(unitFill.rate, 16000);
assert.equal(unitFill._rate_basis, 'per_thaan');
console.log('✅ Unit change auto-fill resolved:', unitFill);

// 6. PDF Line Item Normalization for Textile
const pdfLine = normalizePdfLineItem({
  name: 'Cotton Latha 4000',
  article_no: 'GA-101',
  design_no: 'D-505',
  fabric_type: 'Cotton',
  color_shade: 'Navy Blue',
  quantity: 3,
  unit: 'thaan',
  thaan_length: 40,
  rate: 16000,
  amount: 48000,
});
assert.equal(pdfLine.unit, 'Thaan (120m)');
assert.ok(pdfLine.description.includes('Art: GA-101'));
assert.ok(pdfLine.description.includes('Des: D-505'));
assert.ok(pdfLine.description.includes('Fabric: Cotton'));
console.log('✅ PDF Line Item normalized with textile specs:', pdfLine);

// 7. PDF Document Generation with Bilti & Broker Details
const mockDoc = {
  invoiceNumber: 'INV-TXT-001',
  date: '2026-08-22',
  category: 'textile-wholesale',
  customer: { name: 'Karachi Cloth Traders', ntn: '1234567-8', address: 'Jama Cloth Market, Karachi' },
  items: [pdfLine],
  totals: { subtotal: 48000, total: 48000 },
  business: { name: 'Karachi Textile Mills', phone: '03001234567' },
  biltiDetails: {
    transportName: 'Faisalabad Express Goods',
    biltiNo: 'B-48920',
    destinationCity: 'Faisalabad',
    baleCount: '3',
    freightStatus: 'To Pay',
  },
  brokerDetails: {
    brokerName: 'Haji Usman Broker',
    brokerCommission: '1%',
  },
};

const pdfDoc = buildInvoicePDFDoc(mockDoc, true);
assert.ok(pdfDoc, 'PDF document created successfully');
console.log('✅ PDF document generated with Bilti & Broker details cleanly!');

console.log('\n🎉 ALL KARACHI CLOTH MARKET INVOICE VERIFICATION CHECKS PASSED!\n');
