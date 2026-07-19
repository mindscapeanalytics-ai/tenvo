import { describe, expect, it } from 'bun:test';
import {
  scopeProductsToBusiness,
  isForeignTenantProduct,
  normalizeBusinessId,
} from '../inventoryTenancy.js';

describe('inventoryTenancy', () => {
  const marbles = 'biz-marbles';
  const rollInn = 'biz-roll-inn';

  it('normalizes business ids', () => {
    expect(normalizeBusinessId(null)).toBe('');
    expect(normalizeBusinessId('  abc  ')).toBe('abc');
  });

  it('scopes products to the active business', () => {
    const rows = [
      { id: '1', business_id: marbles, name: 'Tile A' },
      { id: '2', business_id: rollInn, name: 'Burger' },
      { id: '3', name: 'No bid' },
    ];
    expect(scopeProductsToBusiness(rows, rollInn).map((p) => p.id)).toEqual(['2', '3']);
    expect(scopeProductsToBusiness(rows, marbles).map((p) => p.id)).toEqual(['1', '3']);
  });

  it('detects foreign tenant products', () => {
    expect(isForeignTenantProduct({ business_id: marbles }, rollInn)).toBe(true);
    expect(isForeignTenantProduct({ business_id: rollInn }, rollInn)).toBe(false);
    expect(isForeignTenantProduct({ businessId: marbles }, rollInn)).toBe(true);
    expect(isForeignTenantProduct({}, rollInn)).toBe(false);
  });
});
