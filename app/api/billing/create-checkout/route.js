import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createCheckoutSession, getPriceIdForPlan } from '@/lib/payments/stripe';
import { auth } from '@/lib/auth';

/**
 * POST /api/billing/create-checkout
 * Create a Stripe checkout session for plan upgrade
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planTier, currency = 'pkr', returnUrl } = body;

    if (!planTier) {
      return NextResponse.json(
        { error: 'Plan tier is required' },
        { status: 400 }
      );
    }

    // Get business details
    const businessResult = await pool.query(
      `SELECT id, business_name, email, stripe_customer_id, current_plan
       FROM businesses 
       WHERE owner_id = $1 
       LIMIT 1`,
      [session.user.id]
    );

    if (businessResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const business = businessResult.rows[0];

    // Get Stripe price ID
    const priceId = getPriceIdForPlan(planTier, currency);
    
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for plan: ${planTier}` },
        { status: 400 }
      );
    }

    // Create or get Stripe customer
    let customerId = business.stripe_customer_id;
    
    if (!customerId) {
      const { createCustomer } = await import('@/lib/payments/stripe');
      const customerResult = await createCustomer({
        email: business.email,
        name: business.business_name,
        metadata: {
          businessId: business.id,
          businessName: business.business_name,
        },
      });
      
      if (customerResult.skipped) {
        return NextResponse.json(
          { error: 'Payment provider not configured' },
          { status: 503 }
        );
      }
      
      customerId = customerResult.id;
      
      // Save Stripe customer ID
      await pool.query(
        `UPDATE businesses SET stripe_customer_id = $1 WHERE id = $2`,
        [customerId, business.id]
      );
    }

    // Create checkout session
    const successUrl = `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/business/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`;

    const checkoutResult = await createCheckoutSession({
      customerId,
      priceId,
      successUrl,
      cancelUrl,
      metadata: {
        businessId: business.id,
        planTier,
        currency,
      },
    });

    if (checkoutResult.skipped) {
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutResult.url,
      sessionId: checkoutResult.id,
    });

  } catch (error) {
    console.error('[Create Checkout] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
