import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { resolveStorefrontBusiness } from '@/lib/tenancy/resolveStorefrontBusiness';
import {
  STOREFRONT_COD_METHOD,
  loadStorefrontPaymentContext,
  resolveEligibleStorefrontPaymentMethods,
} from '@/lib/storefront/storefrontPaymentEligibility';

/**
 * GET /api/storefront/[businessDomain]/payment-methods
 * Public checkout — eligible payment methods for this store (COD default).
 */
export async function GET(_request, { params }) {
  const { businessDomain } = await params;
  const business = await resolveStorefrontBusiness(businessDomain);

  if (!business) {
    return NextResponse.json(
      { success: false, error: 'Business not found' },
      { status: 404 }
    );
  }

  const client = await pool.connect();

  try {
    let context;
    try {
      context = await loadStorefrontPaymentContext(client, business.id);
    } catch (tableErr) {
      if (tableErr.code === '42P01' || tableErr.message?.includes('business_payment_methods')) {
        return NextResponse.json({
          success: true,
          methods: [{ ...STOREFRONT_COD_METHOD }],
        });
      }
      throw tableErr;
    }

    const methods = resolveEligibleStorefrontPaymentMethods(context);
    return NextResponse.json({ success: true, methods });
  } catch (error) {
    // Fail closed — do not fake COD success (matches POST orders payment gate / cart sync).
    // Missing-table soft COD remains only in the 42P01 branch above.
    console.error('[payment-methods] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Payment methods are temporarily unavailable. Please try again.',
        retryable: true,
      },
      { status: 503 }
    );
  } finally {
    client.release();
  }
}
