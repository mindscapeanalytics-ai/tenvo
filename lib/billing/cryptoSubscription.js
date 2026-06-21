import pool from '@/lib/db';
import { prismaBase } from '@/lib/db';
import { TRIAL_CONFIG } from '@/lib/config/platform';
import { resolvePlanTier } from '@/lib/config/plans';

const COMPLETED_STATUSES = new Set(['confirmed', 'finished', 'paid', 'complete']);

/**
 * Persist pending crypto checkout for IPN reconciliation.
 */
export async function registerPendingCryptoCheckout({
  businessId,
  orderId,
  paymentId,
  planTier = null,
  amountMinor = null,
  currency = 'usd',
}) {
  await prismaBase.subscription_history.create({
    data: {
      business_id: businessId,
      plan_tier: planTier ? resolvePlanTier(planTier) : null,
      status: 'crypto_pending',
      stripe_subscription_id: paymentId ? String(paymentId) : null,
      amount_minor: amountMinor,
      currency: currency?.toUpperCase?.() || 'USD',
      metadata: {
        provider: 'nowpayments',
        order_id: orderId,
        payment_id: paymentId,
        plan_tier: planTier,
      },
    },
  });
}

async function findPendingCrypto({ orderId, paymentId }) {
  const rows = await prismaBase.subscription_history.findMany({
    where: { status: 'crypto_pending' },
    orderBy: { created_at: 'desc' },
    take: 50,
  });
  return rows.find((row) => {
    const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
    if (orderId && meta.order_id === orderId) return true;
    if (paymentId && String(row.stripe_subscription_id) === String(paymentId)) return true;
    if (paymentId && String(meta.payment_id) === String(paymentId)) return true;
    return false;
  });
}

/**
 * Apply completed NOWPayments IPN to business subscription.
 */
export async function applyCryptoSubscriptionFromIPN({ orderId, paymentId, status, amount }) {
  if (!orderId && !paymentId) return { applied: false, reason: 'missing_ids' };

  const normalized = String(status || '').toLowerCase();
  if (!COMPLETED_STATUSES.has(normalized)) {
    return { applied: false, reason: 'not_completed', status: normalized };
  }

  const pending = await findPendingCrypto({ orderId, paymentId });

  let businessId = pending?.business_id;
  let planTier = pending?.plan_tier || pending?.metadata?.plan_tier;

  if (!businessId && orderId?.startsWith('tenvo-')) {
    const rest = orderId.slice('tenvo-'.length);
    const lastDash = rest.lastIndexOf('-');
    if (lastDash > 0) {
      const maybeBiz = rest.slice(0, lastDash);
      if (/^[0-9a-f-]{36}$/i.test(maybeBiz)) businessId = maybeBiz;
    }
  }

  if (!businessId) return { applied: false, reason: 'business_not_found' };

  const extendDays = Number(TRIAL_CONFIG?.durationDays) > 0 ? TRIAL_CONFIG.durationDays : 30;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bizRes = await client.query(
      `SELECT plan_expires_at, plan_tier FROM businesses WHERE id = $1 FOR UPDATE`,
      [businessId]
    );
    if (!bizRes.rows.length) {
      await client.query('ROLLBACK');
      return { applied: false, reason: 'business_missing' };
    }

    const row = bizRes.rows[0];
    const from = new Date();
    const current = row.plan_expires_at ? new Date(row.plan_expires_at) : null;
    if (current && current > from) from.setTime(current.getTime());

    const newExpires = new Date(from);
    newExpires.setDate(newExpires.getDate() + extendDays);

    const tier = planTier ? resolvePlanTier(planTier) : resolvePlanTier(row.plan_tier || 'starter');

    await client.query(
      `UPDATE businesses SET
        plan_tier = $1,
        plan_expires_at = $2,
        stripe_subscription_status = 'crypto_active',
        manual_payment_active = true,
        updated_at = NOW()
      WHERE id = $3`,
      [tier, newExpires, businessId]
    );

    if (pending) {
      await client.query(
        `UPDATE subscription_history SET status = 'crypto_paid', effective_at = NOW()
         WHERE id = $1`,
        [pending.id]
      );
    } else {
      await client.query(
        `INSERT INTO subscription_history (business_id, plan_tier, status, amount_minor, currency, metadata)
         VALUES ($1, $2, 'crypto_paid', $3, $4, $5)`,
        [
          businessId,
          tier,
          amount != null ? Math.round(Number(amount) * 100) : null,
          'USD',
          JSON.stringify({ provider: 'nowpayments', order_id: orderId, payment_id: paymentId }),
        ]
      );
    }

    await client.query('COMMIT');
    return { applied: true, businessId, planTier: tier, plan_expires_at: newExpires };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
