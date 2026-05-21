import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createBillingPortalSession } from '@/lib/payments/stripe';
import { auth } from '@/lib/auth';

/**
 * POST /api/billing/portal
 * Create Stripe billing portal session
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

    const body = await request.json().catch(() => ({}));
    const { returnUrl } = body;

    // Get business
    const result = await pool.query(
      `SELECT stripe_customer_id 
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

    const { stripe_customer_id: customerId } = result.rows[0];

    if (!customerId) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe to a plan first.' },
        { status: 400 }
      );
    }

    const returnUrlFull = returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/business/settings/billing`;

    const portalResult = await createBillingPortalSession({
      customerId,
      returnUrl: returnUrlFull,
    });

    if (portalResult.skipped) {
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      portalUrl: portalResult.url,
    });

  } catch (error) {
    console.error('[Billing Portal] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
