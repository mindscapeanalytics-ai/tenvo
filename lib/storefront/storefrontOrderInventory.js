import { InventoryService } from '@/lib/services/InventoryService';

/**
 * Canonical storefront checkout stock decrement inside an open pg transaction.
 * Routes variant lines through InventoryService.removeVariantStock and
 * headline/location lines through removeStock with FIFO sellable locations.
 *
 * @param {import('pg').PoolClient} client
 * @param {string} businessId
 * @param {{ productId: string, quantity: number, isVariant?: boolean, variantId?: string | null }} line
 * @param {{ orderId?: string | number, orderNumber?: string }} orderRef
 */
export async function decrementStorefrontOrderLineStock(client, businessId, line, orderRef = {}) {
  const qty = Number(line.quantity);
  if (!Number.isFinite(qty) || qty <= 0) return;

  const { orderId = null, orderNumber = null } = orderRef;
  const notes = orderNumber ? `Storefront sale - Order ${orderNumber}` : 'Storefront sale';
  const domainData = {
    storefront_order_id: orderId,
    storefront_order_number: orderNumber,
  };

  if (line.isVariant && line.variantId) {
    await InventoryService.removeVariantStock(
      {
        business_id: businessId,
        product_id: line.productId,
        variant_id: line.variantId,
        quantity: qty,
        reference_type: 'storefront_order',
        notes,
        domain_data: domainData,
      },
      null,
      client
    );
    return;
  }

  await InventoryService.removeStock(
    {
      business_id: businessId,
      product_id: line.productId,
      quantity: qty,
      reference_type: 'storefront_order',
      notes,
      fifo_sellable_locations: true,
      skip_accounting: true,
    },
    null,
    client
  );
}
