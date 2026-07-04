import { describe, expect, it } from 'vitest';
import { isStorefrontOrderNumberConflict } from '../storefrontOrderNumber.js';

describe('storefrontOrderNumber', () => {
  it('detects global order_number unique violations', () => {
    expect(
      isStorefrontOrderNumberConflict({
        code: '23505',
        constraint: 'storefront_orders_order_number_key',
      })
    ).toBe(true);
  });

  it('detects per-tenant composite order_number violations', () => {
    expect(
      isStorefrontOrderNumberConflict({
        code: '23505',
        constraint: 'storefront_orders_business_id_order_number_key',
      })
    ).toBe(true);
  });

  it('ignores unrelated unique violations', () => {
    expect(
      isStorefrontOrderNumberConflict({
        code: '23505',
        constraint: 'customers_email_key',
      })
    ).toBe(false);
  });

  it('ignores non-unique errors', () => {
    expect(isStorefrontOrderNumberConflict({ code: '23503' })).toBe(false);
  });
});
