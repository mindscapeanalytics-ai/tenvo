import { describe, expect, it, beforeEach } from 'bun:test';
import {
  setPendingInventoryFocus,
  consumePendingInventoryFocus,
  setPendingExcelMode,
  consumePendingExcelMode,
  inventoryFocusModeToStockFilter,
} from '../hubNavigationIntent.js';

describe('hubNavigationIntent', () => {
  beforeEach(() => {
    consumePendingInventoryFocus();
    consumePendingExcelMode();
  });

  it('stores and consumes inventory focus modes', () => {
    setPendingInventoryFocus('out-of-stock');
    expect(consumePendingInventoryFocus()).toBe('out-of-stock');
    expect(consumePendingInventoryFocus()).toBeNull();
  });

  it('maps focus modes to stock filters', () => {
    expect(inventoryFocusModeToStockFilter('low-stock')).toBe('low');
    expect(inventoryFocusModeToStockFilter('out-of-stock')).toBe('out');
    expect(inventoryFocusModeToStockFilter('expiring-stock')).toBe('expiring');
  });

  it('stores and consumes pending excel / bulk entry mode', () => {
    setPendingExcelMode();
    expect(consumePendingExcelMode()).toBe(true);
    expect(consumePendingExcelMode()).toBe(false);
  });
});
