import pool from '@/lib/db';
import { areAllLinesDigital } from '@/lib/storefront/digitalProducts';

const COMPLETED_STATUSES = new Set(['confirmed', 'finished', 'paid', 'complete']);

/**
 * Parse storefront crypto order id: store-{businessUuid}-{orderNumber}
 * @param {string | null | undefined} orderId
 */
export function parseStorefrontCryptoOrderId(orderId) {
  if (!orderId || !String(orderId).startsWith('store-')) return null;
  const rest = String(orderId).slice('store-'.length);
  const dash = rest.indexOf('-');
  if (dash <= 0) return null;
  const businessId = rest.slice(0, dash);
  const orderNumber = rest.slice(dash + 1);
  if (!/^[0-9a-f-]{36}$/i.test(businessId) || !orderNumber) return null;
  return { businessId, orderNumber };
}

export function buildStorefrontCryptoOrderId(businessId, orderNumber) {
  return `store-${businessId}-${orderNumber}`;
}

/**
 * Attach NOWPayments payment to a pending storefront order.
 */
export async function registerStorefrontCryptoPayment({
  businessId,
  orderNumber,
  paymentId,
  payCurrency,
  payAmount,
  payAddress,
}) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT id, metadata, payment_status, total_amount, currency
       FROM storefront_orders
       WHERE business_id = $1::uuid AND order_number = $2
       LIMIT 1`,
      [businessId, orderNumber]
    );
    if (!res.rows.length) return { registered: false, reason: 'order_not_found' };

    const row = res.rows[0];
    const meta =
      row.metadata && typeof row.metadata === 'object' ? { ...row.metadata } : {};

    await client.query(
      `UPDATE storefront_orders SET
        metadata = $1::jsonb,
        payment_status = 'awaiting_payment',
        updated_at = NOW()
       WHERE id = $2`,
      [
        JSON.stringify({
          ...meta,
          crypto: {
            provider: 'nowpayments',
            payment_id: paymentId,
            order_id: buildStorefrontCryptoOrderId(businessId, orderNumber),
            pay_currency: payCurrency,
            pay_amount: payAmount,
            pay_address: payAddress,
            status: 'waiting',
          },
        }),
        row.id,
      ]
    );

    return { registered: true, orderId: row.id };
  } finally {
    client.release();
  }
}

/**
 * Mark storefront order paid when NOWPayments IPN completes.
 */
export async function applyStorefrontCryptoFromIPN({ orderId, paymentId, status, amount }) {
  const parsed = parseStorefrontCryptoOrderId(orderId);
  if (!parsed) return { applied: false, reason: 'not_storefront_order' };

  const normalized = String(status || '').toLowerCase();
  if (!COMPLETED_STATUSES.has(normalized)) {
    return { applied: false, reason: 'not_completed', status: normalized };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      `SELECT id, order_number, payment_status, metadata, customer_email
       FROM storefront_orders
       WHERE business_id = $1::uuid AND order_number = $2
       FOR UPDATE`,
      [parsed.businessId, parsed.orderNumber]
    );
    if (!orderRes.rows.length) {
      await client.query('ROLLBACK');
      return { applied: false, reason: 'order_not_found' };
    }

    const order = orderRes.rows[0];
    if (order.payment_status === 'paid') {
      await client.query('ROLLBACK');
      return { applied: false, reason: 'already_paid', orderId: order.id };
    }

    const itemsRes = await client.query(
      `SELECT product_id FROM storefront_order_items WHERE order_id = $1`,
      [order.id]
    );
    const allDigital = await areAllLinesDigital(
      client,
      parsed.businessId,
      itemsRes.rows.map((r) => ({ productId: r.product_id }))
    );

    const meta =
      order.metadata && typeof order.metadata === 'object' ? { ...order.metadata } : {};
    const cryptoMeta = {
      ...(meta.crypto && typeof meta.crypto === 'object' ? meta.crypto : {}),
      provider: 'nowpayments',
      payment_id: paymentId,
      order_id: orderId,
      status: normalized,
      actually_paid: amount,
      paid_at: new Date().toISOString(),
    };

    await client.query(
      `UPDATE storefront_orders SET
        payment_status = 'paid',
        status = 'processing',
        fulfillment_status = $1,
        metadata = $2::jsonb,
        updated_at = NOW()
       WHERE id = $3`,
      [
        allDigital ? 'digital_delivered' : 'unfulfilled',
        JSON.stringify({
          ...meta,
          crypto: cryptoMeta,
          digital_delivery: allDigital
            ? {
                status: 'pending_fulfillment',
                note: 'Payment confirmed — deliver license/key via your fulfillment workflow.',
              }
            : meta.digital_delivery,
        }),
        order.id,
      ]
    );

    await client.query('COMMIT');
    return {
      applied: true,
      orderId: order.id,
      orderNumber: order.order_number,
      businessId: parsed.businessId,
      digital: allDigital,
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
