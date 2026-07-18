import { describe, it, expect } from 'vitest';
import { invoiceSchema, validateWithSchema } from '@/lib/validation/schemas';

describe('invoiceSchema tax aliases', () => {
  const base = {
    business_id: '11111111-1111-1111-1111-111111111111',
    date: '2026-07-18',
    items: [
      {
        name: 'Widget',
        quantity: 2,
        unit_price: 100,
        tax_percent: 18,
        tax_amount: 36,
      },
    ],
    subtotal: 200,
    discount_total: 0,
    grand_total: 236,
  };

  it('accepts total_tax and mirrors tax_total', () => {
    const result = validateWithSchema(invoiceSchema, { ...base, total_tax: 36 });
    expect(result.success).toBe(true);
    expect(result.data.total_tax).toBe(36);
    expect(result.data.tax_total).toBe(36);
  });

  it('accepts tax_total and mirrors total_tax', () => {
    const result = validateWithSchema(invoiceSchema, { ...base, tax_total: 36 });
    expect(result.success).toBe(true);
    expect(result.data.total_tax).toBe(36);
    expect(result.data.tax_total).toBe(36);
  });
});
