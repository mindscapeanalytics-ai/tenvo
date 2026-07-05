import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/services/InventoryService', () => ({
  InventoryService: {
    removeStock: vi.fn().mockResolvedValue({ success: true }),
    removeVariantStock: vi.fn().mockResolvedValue({ success: true, movementId: 'mv-1' }),
  },
}));

import { InventoryService } from '@/lib/services/InventoryService';
import { decrementStorefrontOrderLineStock } from '@/lib/storefront/storefrontOrderInventory';

describe('storefrontOrderInventory', () => {
  const client = { query: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes variant lines through removeVariantStock', async () => {
    await decrementStorefrontOrderLineStock(
      client,
      'biz-1',
      {
        productId: 'prod-1',
        quantity: 2,
        isVariant: true,
        variantId: 'var-1',
      },
      { orderId: 'ord-1', orderNumber: 'ORD-20260705-1' }
    );

    expect(InventoryService.removeVariantStock).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: 'biz-1',
        product_id: 'prod-1',
        variant_id: 'var-1',
        quantity: 2,
        reference_type: 'storefront_order',
      }),
      null,
      client
    );
    expect(InventoryService.removeStock).not.toHaveBeenCalled();
  });

  it('routes headline lines through removeStock with FIFO locations', async () => {
    await decrementStorefrontOrderLineStock(
      client,
      'biz-1',
      {
        productId: 'prod-2',
        quantity: 1,
        isVariant: false,
        variantId: null,
      },
      { orderNumber: 'ORD-20260705-2' }
    );

    expect(InventoryService.removeStock).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: 'biz-1',
        product_id: 'prod-2',
        quantity: 1,
        fifo_sellable_locations: true,
        skip_accounting: true,
        reference_type: 'storefront_order',
      }),
      null,
      client
    );
    expect(InventoryService.removeVariantStock).not.toHaveBeenCalled();
  });

  it('ignores non-positive quantities', async () => {
    await decrementStorefrontOrderLineStock(client, 'biz-1', { productId: 'p', quantity: 0 }, {});
    expect(InventoryService.removeStock).not.toHaveBeenCalled();
    expect(InventoryService.removeVariantStock).not.toHaveBeenCalled();
  });
});
