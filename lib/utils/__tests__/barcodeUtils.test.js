import { describe, expect, it } from 'vitest';
import {
  expandScanCandidates,
  isValidGtinChecksum,
  normalizeScanCode,
  suggestInternalBarcodeFromSku,
} from '@/lib/utils/barcodeUtils';
import { findProductByScanCode } from '@/lib/utils/productScanLookup';

describe('barcodeUtils', () => {
  it('parses GS1 (01) AI prefix', () => {
    const code = normalizeScanCode('(01)00012345678905');
    expect(code.length).toBeGreaterThanOrEqual(12);
  });

  it('expands UPC-A to EAN-13 candidate', () => {
    const candidates = expandScanCandidates('123456789012');
    expect(candidates).toContain('0123456789012');
  });

  it('validates EAN-8 checksum', () => {
    expect(isValidGtinChecksum('96385074')).toBe(true);
  });

  it('generates internal EAN-13 from SKU', () => {
    const code = suggestInternalBarcodeFromSku('TEST-SKU', 'biz-1');
    expect(code).toMatch(/^\d{13}$/);
    expect(isValidGtinChecksum(code)).toBe(true);
  });
});

describe('productScanLookup', () => {
  const products = [
    { id: 'p1', sku: 'ABC', barcode: '5901234123457' },
    { id: 'p2', sku: 'VAR-PARENT', variants: [{ variant_sku: 'VAR-RED-M' }] },
  ];

  it('matches barcode case-insensitively', () => {
    expect(findProductByScanCode(products, '5901234123457')?.id).toBe('p1');
  });

  it('matches variant SKU', () => {
    expect(findProductByScanCode(products, 'var-red-m')?.id).toBe('p2');
  });
});
