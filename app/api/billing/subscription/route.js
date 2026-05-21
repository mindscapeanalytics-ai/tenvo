import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { getSubscription } from '@/lib/payments/stripe';

/**
 * GET /api/billing/subscription
 * Get current subscription details
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get business with subscription details
    const result = await pool.query(
      `SELECT 
        id,
        business_name,
        email,
        current_plan,
        subscription_status,
        subscription_start_date,
        subscription_end_date,
        trial_end_date,
        last_payment_date,
        billing_cycle,
        auto_renew,
        stripe_customer_id,
        stripe_subscription_id
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

    // Get Stripe subscription details if available
    let stripeSubscription = null;
    if (business.stripe_subscription_id) {
      stripeSubscription = await getSubscription(business.stripe_subscription_id);
    }

    // Get recent invoices
    const invoicesResult = await pool.query(
      `SELECT 
        id,
        invoice_number,
        amount_due,
        amount_paid,
        currency,
        status,
        period_start,
        period_end,
        paid_at,
        hosted_invoice_url,
        created_at
       FROM invoices 
       WHERE business_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [business.id]
    );

    // Get subscription history
    const historyResult = await pool.query(
      `SELECT 
        plan_tier,
        status,
        amount_paid,
        currency,
        billing_period_start,
        billing_period_end,
        created_at
       FROM subscription_history 
       WHERE business_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [business.id]
    );

    return NextResponse.json({
      subscription: {
        planTier: business.current_plan,
        status: business.subscription_status,
        isActive: business.subscription_status === 'active',
        isTrial: business.subscription_status === 'trialing',
        startDate: business.subscription_start_date,
        endDate: business.subscription_end_date,
        trialEndDate: business.trial_end_date,
        lastPaymentDate: business.last_payment_date,
        billingCycle: business.billing_cycle,
        autoRenew: business.auto_renew,
        stripeSubscriptionId: business.stripe_subscription_id,
        stripeDetails: stripeSubscription ? {
          currentPeriodStart: stripeSubscription.current_period_start,
          currentPeriodEnd: stripeSubscription.current_period_end,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        } : null,
      },
      invoices: invoicesResult.rows,
      history: historyResult.rows,
    });

  } catch (error) {
    console.error('[Get Subscription] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
