import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cancelSubscription } from '@/lib/payments/stripe';
import { auth } from '@/lib/auth';

/**
 * POST /api/billing/cancel
 * Cancel subscription
 */
export async function POST(request) {
  const client = await pool.connect();

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { atPeriodEnd = true } = body;

    // Get business
    const result = await client.query(
      `SELECT id, stripe_subscription_id, subscription_status 
       FROM businesses 
       WHERE owner_id = $1 
       LIMIT 1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const business = result.rows[0];

    if (!business.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    // Cancel in Stripe
    const cancelResult = await cancelSubscription(
      business.stripe_subscription_id,
      { cancelAtPeriodEnd: atPeriodEnd }
    );

    if (cancelResult.skipped) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 503 }
      );
    }

    // Update business record
    if (atPeriodEnd) {
      await client.query(
        `UPDATE businesses 
         SET subscription_status = 'cancellation_scheduled',
             auto_renew = false,
             updated_at = NOW()
         WHERE id = $1`,
        [business.id]
      );
    } else {
      await client.query(
        `UPDATE businesses 
         SET subscription_status = 'cancelled',
             current_plan = 'free',
             stripe_subscription_id = NULL,
             auto_renew = false,
             updated_at = NOW()
         WHERE id = $1`,
        [business.id]
      );
    }

    // Log cancellation
    await client.query(
      `INSERT INTO subscription_history 
       (business_id, plan_tier, stripe_subscription_id, status, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        business.id,
        'current', // Will be updated by webhook
        business.stripe_subscription_id,
        atPeriodEnd ? 'cancellation_scheduled' : 'cancelled',
        JSON.stringify({ atPeriodEnd, cancelledBy: session.user.id }),
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      cancelled: true,
      atPeriodEnd,
      message: atPeriodEnd 
        ? 'Subscription will be cancelled at the end of your billing period'
        : 'Subscription cancelled immediately',
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Cancel Subscription] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
