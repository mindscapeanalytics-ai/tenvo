import { NextResponse } from 'next/server';
import { isNowPaymentsConfigured, SUPPORTED_CRYPTO } from '@/lib/payments/nowpayments';

export const dynamic = 'force-dynamic';

/**
 * GET /api/billing/crypto/config
 * Public capability flags for billing UI (no secrets).
 */
export async function GET() {
  return NextResponse.json({
    configured: isNowPaymentsConfigured(),
    currencies: SUPPORTED_CRYPTO,
    webhookPath: '/api/webhooks/nowpayments',
  });
}
