import { describe, expect, it } from 'vitest';

/**
 * Mirrors PosVoidPanel field resolution against getRecentPosTransactionsForRefundAction shape.
 */
function resolveTxNumber(tx) {
  return tx?.transactionNumber || tx?.transaction_number || '';
}

function resolveTxTotal(tx) {
  const n = Number(tx?.totalAmount ?? tx?.total_amount);
  return Number.isFinite(n) ? n : 0;
}

function resolveTxDate(tx) {
  const raw = tx?.createdAt || tx?.created_at;
  if (!raw) return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

describe('POS refunds/voids recent-tx field mapping', () => {
  it('reads camelCase payload from getRecentPosTransactionsForRefundAction', () => {
    const tx = {
      id: '1',
      transactionNumber: 'POS-0001',
      totalAmount: 42.5,
      createdAt: '2026-07-18T10:00:00.000Z',
    };
    expect(resolveTxNumber(tx)).toBe('POS-0001');
    expect(resolveTxTotal(tx)).toBe(42.5);
    expect(resolveTxDate(tx)).toBeInstanceOf(Date);
  });

  it('does not produce NaN / Invalid Date on missing fields', () => {
    const tx = { id: '2' };
    expect(resolveTxNumber(tx)).toBe('');
    expect(resolveTxTotal(tx)).toBe(0);
    expect(resolveTxDate(tx)).toBeNull();
  });

  it('accepts snake_case aliases', () => {
    const tx = {
      transaction_number: 'POS-0002',
      total_amount: '19.99',
      created_at: '2026-01-01T00:00:00.000Z',
    };
    expect(resolveTxNumber(tx)).toBe('POS-0002');
    expect(resolveTxTotal(tx)).toBe(19.99);
    expect(resolveTxDate(tx)?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});
