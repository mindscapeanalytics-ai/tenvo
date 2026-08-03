import { describe, it, expect } from 'vitest';
import {
  normalizePaymentType,
  isReceiptType,
  paymentTypeFilterValues,
  PAYMENT_TYPES,
} from '../paymentTypes.js';

describe('paymentTypes', () => {
  it('normalizes canonical and legacy cashbook types', () => {
    expect(normalizePaymentType('receipt')).toBe(PAYMENT_TYPES.RECEIPT);
    expect(normalizePaymentType('payment')).toBe(PAYMENT_TYPES.PAYMENT);
    expect(normalizePaymentType('in')).toBe(PAYMENT_TYPES.RECEIPT);
    expect(normalizePaymentType('out')).toBe(PAYMENT_TYPES.PAYMENT);
    expect(normalizePaymentType('received')).toBe(PAYMENT_TYPES.RECEIPT);
    expect(normalizePaymentType('bogus')).toBeUndefined();
  });

  it('detects receipts including legacy in', () => {
    expect(isReceiptType('in')).toBe(true);
    expect(isReceiptType('receipt')).toBe(true);
    expect(isReceiptType('out')).toBe(false);
  });

  it('filter values include legacy aliases for pre-migration rows', () => {
    expect(paymentTypeFilterValues('receipt')).toEqual(
      expect.arrayContaining(['receipt', 'received', 'in'])
    );
    expect(paymentTypeFilterValues('payment')).toEqual(
      expect.arrayContaining(['payment', 'paid', 'out'])
    );
  });
});
