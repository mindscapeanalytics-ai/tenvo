import pool from '@/lib/db';
import { InventoryService } from '@/lib/services/InventoryService';

/**
 * FIFO-pick available serial numbers for a storefront sale when the product is serial-tracked.
 * Returns [] when the product has no available serials (simple / non-serial inventory).
 *
 * @param {import('pg').PoolClient} client
 * @param {string} businessId
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<string[]>}
 */
export async function allocateStorefrontSerialNumbers(client, businessId, productId, quantity) {
  const qty = Math.floor(Number(quantity));
  if (!Number.isFinite(qty) || qty <= 0) return [];

  const availableRes = await client.query(
    `SELECT serial_number
     FROM product_serials
     WHERE business_id = $1::uuid
       AND product_id = $2::uuid
       AND COALESCE(is_deleted, false) = false
       AND LOWER(COALESCE(status, '')) IN ('in_stock', 'available', 'reserved')
     ORDER BY COALESCE(created_at, updated_at) ASC NULLS LAST, id ASC
     LIMIT $3
     FOR UPDATE`,
    [businessId, productId, qty]
  );

  if (availableRes.rows.length === 0) return [];

  if (availableRes.rows.length < qty) {
    throw new Error(
      `Insufficient serial numbers available. Need ${qty}, have ${availableRes.rows.length}.`
    );
  }

  return availableRes.rows.map((row) => row.serial_number);
}

/**
 * Canonical storefront checkout stock decrement inside an open pg transaction.
 * Routes variant lines through InventoryService.removeVariantStock and
 * headline/location lines through removeStock with FIFO sellable locations.
 * Auto-allocates serials when the product has available serial inventory.
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

  const serialNumbers = await allocateStorefrontSerialNumbers(
    client,
    businessId,
    line.productId,
    qty
  );

  await InventoryService.removeStock(
    {
      business_id: businessId,
      product_id: line.productId,
      quantity: qty,
      reference_type: 'storefront_order',
      notes,
      fifo_sellable_locations: true,
      skip_accounting: true,
      serial_numbers: serialNumbers,
    },
    null,
    client
  );
}

/**
 * COD / already-settled methods commit inventory at order create.
 * Stripe / crypto (awaiting_payment) defer until payment confirms.
 * @param {string | null | undefined} paymentStatus
 */
export function shouldCommitStorefrontInventoryOnCreate(paymentStatus) {
  const status = String(paymentStatus || '')
    .trim()
    .toLowerCase();
  return status !== 'awaiting_payment';
}

/**
 * @param {unknown} metadata
 */
export function isStorefrontInventoryCommitted(metadata) {
  if (!metadata || typeof metadata !== 'object') return false;
  return metadata.inventory_committed === true;
}

/**
 * Decrement all lines for an order and mark metadata.inventory_committed.
 * Idempotent — safe to call from Stripe webhook, crypto IPN, and hub mark-paid.
 *
 * @param {import('pg').PoolClient} client
 * @param {string} businessId
 * @param {string | number} orderId
 * @returns {Promise<{ committed: boolean, alreadyCommitted?: boolean, skipped?: boolean, reason?: string }>}
 */
export async function commitStorefrontOrderInventoryIfPending(client, businessId, orderId) {
  const orderRes = await client.query(
    `SELECT id, order_number, payment_status, metadata
     FROM storefront_orders
     WHERE id = $1 AND business_id = $2::uuid
     FOR UPDATE`,
    [orderId, businessId]
  );

  if (!orderRes.rows.length) {
    return { committed: false, skipped: true, reason: 'order_not_found' };
  }

  const order = orderRes.rows[0];
  const meta =
    order.metadata && typeof order.metadata === 'object' && !Array.isArray(order.metadata)
      ? { ...order.metadata }
      : {};

  if (meta.inventory_committed === true) {
    return { committed: false, alreadyCommitted: true };
  }

  // Legacy orders created before deferred inventory always decremented at create.
  if (meta.inventory_deferred !== true && meta.inventory_committed !== false) {
    meta.inventory_committed = true;
    await client.query(
      `UPDATE storefront_orders
       SET metadata = $1::jsonb, updated_at = NOW()
       WHERE id = $2 AND business_id = $3::uuid`,
      [JSON.stringify(meta), orderId, businessId]
    );
    return { committed: false, alreadyCommitted: true, reason: 'legacy_assumed_committed' };
  }

  const itemsRes = await client.query(
    `SELECT product_id, variant_id, quantity, metadata
     FROM storefront_order_items
     WHERE order_id = $1 AND business_id = $2::uuid`,
    [orderId, businessId]
  );

  for (const row of itemsRes.rows) {
    const lineMeta =
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? row.metadata
        : {};
    const variantId = row.variant_id || lineMeta.variantId || null;
    await decrementStorefrontOrderLineStock(
      client,
      businessId,
      {
        productId: row.product_id,
        quantity: row.quantity,
        isVariant: Boolean(variantId),
        variantId,
      },
      { orderId: order.id, orderNumber: order.order_number }
    );
  }

  meta.inventory_committed = true;
  meta.inventory_deferred = false;
  meta.inventory_committed_at = new Date().toISOString();
  delete meta.inventory_commit_error;

  await client.query(
    `UPDATE storefront_orders
     SET metadata = $1::jsonb, updated_at = NOW()
     WHERE id = $2 AND business_id = $3::uuid`,
    [JSON.stringify(meta), orderId, businessId]
  );

  return { committed: true };
}

/**
 * Best-effort inventory commit after prepaid payment succeeds.
 * Payment stays paid even if stock fails — merchants see inventory_commit_error.
 *
 * @param {string} businessId
 * @param {string | number} orderId
 */
export async function commitStorefrontOrderInventoryAfterPayment(businessId, orderId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    try {
      const result = await commitStorefrontOrderInventoryIfPending(client, businessId, orderId);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      const flagClient = await pool.connect();
      try {
        const orderRes = await flagClient.query(
          `SELECT metadata FROM storefront_orders
           WHERE id = $1 AND business_id = $2::uuid`,
          [orderId, businessId]
        );
        if (orderRes.rows[0]) {
          const meta =
            orderRes.rows[0].metadata && typeof orderRes.rows[0].metadata === 'object'
              ? { ...orderRes.rows[0].metadata }
              : {};
          meta.inventory_commit_error = String(err?.message || err);
          meta.inventory_commit_failed_at = new Date().toISOString();
          await flagClient.query(
            `UPDATE storefront_orders
             SET metadata = $1::jsonb, fulfillment_status = 'inventory_hold', updated_at = NOW()
             WHERE id = $2 AND business_id = $3::uuid`,
            [JSON.stringify(meta), orderId, businessId]
          );
        }
      } finally {
        flagClient.release();
      }
      console.error(
        '[commitStorefrontOrderInventoryAfterPayment]',
        businessId,
        orderId,
        err?.message || err
      );
      return { committed: false, skipped: true, reason: 'commit_failed', error: err?.message };
    }
  } finally {
    client.release();
  }
}
