import { describe, expect, test } from 'bun:test';
import { resolveInventoryEffectiveStock } from '@/lib/utils/inventoryEffectiveStock';
import {
  countLowStockProducts,
  resolveInvoiceOpenBalance,
  resolveProductStock,
  resolveSafetyStock,
} from '@/lib/dashboard/easyDashboardHelpers';

describe('resolveInventoryEffectiveStock', () => {
  test('sums location quantities when stock_locations exist', () => {
    const stock = resolveInventoryEffectiveStock({
      stock: 100,
      stock_locations: [{ quantity: 20 }, { quantity: 30 }],
    });
    expect(stock).toBe(50);
  });

  test('ignores location sum when variants exist (storefront/checkout parity)', () => {
    const stock = resolveInventoryEffectiveStock({
      stock: 1,
      stock_locations: [{ quantity: 99, state: 'sellable' }],
      variants: [{ stock: 3 }, { stock: 2 }],
    });
    expect(stock).toBe(5);
  });

  test('counts only sellable location rows (skips reserved/quarantine)', () => {
    const stock = resolveInventoryEffectiveStock({
      stock: 100,
      stock_locations: [
        { quantity: 20, state: 'sellable' },
        { quantity: 40, state: 'reserved' },
        { quantity: 5, state: 'quarantine' },
      ],
    });
    expect(stock).toBe(20);
  });

  test('falls back to headline when only non-sellable location rows exist', () => {
    const stock = resolveInventoryEffectiveStock({
      stock: 15,
      stock_locations: [{ quantity: 40, state: 'reserved' }],
    });
    expect(stock).toBe(15);
  });

  test('accepts product_stock_locations alias', () => {
    const stock = resolveInventoryEffectiveStock({
      stock: 0,
      product_stock_locations: [
        { quantity: 12, state: 'sellable' },
        { quantity: 3, state: 'quarantine' },
      ],
    });
    expect(stock).toBe(12);
  });

  test('uses headline stock when no locations, batches, or variants', () => {
    expect(resolveInventoryEffectiveStock({ stock: 42 })).toBe(42);
  });

  test('prefers single meaningful batch quantity over headline', () => {
    const stock = resolveInventoryEffectiveStock({
      stock: 10,
      batches: [{ batch_number: 'B1', quantity: 25, reserved_quantity: 0 }],
    });
    expect(stock).toBe(25);
  });

  test('uses max of headline and batch sum for multiple batches', () => {
    const stock = resolveInventoryEffectiveStock({
      stock: 5,
      batches: [
        { batch_number: 'B1', quantity: 10, reserved_quantity: 0 },
        { batch_number: 'B2', quantity: 8, reserved_quantity: 0 },
      ],
    });
    expect(stock).toBe(18);
  });
});

describe('resolveSafetyStock / low-stock parity', () => {
  test('defaults to 10 when thresholds are unset or zero (matches analytics SQL)', () => {
    expect(resolveSafetyStock({})).toBe(10);
    expect(resolveSafetyStock({ min_stock_level: 0, min_stock: 0, reorder_point: 0 })).toBe(10);
  });

  test('prefers reorder_point then min_stock_level then min_stock', () => {
    expect(resolveSafetyStock({ reorder_point: 8, min_stock_level: 3, min_stock: 1 })).toBe(8);
    expect(resolveSafetyStock({ min_stock_level: 3, min_stock: 1 })).toBe(3);
    expect(resolveSafetyStock({ min_stock: 2 })).toBe(2);
  });

  test('countLowStockProducts uses display_stock and shared safety threshold', () => {
    const products = [
      { display_stock: 2, reorder_point: 5 },
      { display_stock: 20, min_stock_level: 5 },
      { stock: 1, stock_locations: [{ quantity: 1, state: 'sellable' }], min_stock: 10 },
    ];
    expect(countLowStockProducts(products)).toBe(2);
    expect(resolveProductStock(products[0])).toBe(2);
  });
});

describe('resolveInvoiceOpenBalance', () => {
  test('prefers balance over grand_total for partial payments', () => {
    expect(
      resolveInvoiceOpenBalance({ status: 'partially_paid', grand_total: 1000, balance: 250 })
    ).toBe(250);
  });

  test('returns 0 for paid / cancelled / draft', () => {
    expect(resolveInvoiceOpenBalance({ status: 'paid', grand_total: 100 })).toBe(0);
    expect(resolveInvoiceOpenBalance({ status: 'cancelled', grand_total: 100 })).toBe(0);
  });

  test('falls back to grand_total when balance missing', () => {
    expect(resolveInvoiceOpenBalance({ status: 'sent', grand_total: 420 })).toBe(420);
  });
});
