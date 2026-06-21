import { NextResponse } from 'next/server';
import { verifyIPN, handleIPN } from '@/lib/payments/nowpayments';
import { applyCryptoSubscriptionFromIPN } from '@/lib/billing/cryptoSubscription';

/**
 * POST /api/webhooks/nowpayments — NOWPayments IPN callback.
 */
export async function POST(request) {
  try {
    const raw = await request.text();
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const signature =
      request.headers.get('x-nowpayments-sig') ||
      request.headers.get('X-NOWPAYMENTS-SIG') ||
      '';

    if (signature && !verifyIPN(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const summary = await handleIPN(payload);
    const applied = await applyCryptoSubscriptionFromIPN({
      orderId: summary.orderId || payload.order_id,
      paymentId: summary.paymentId || payload.payment_id,
      status: summary.status || payload.payment_status,
      amount: summary.amount ?? payload.actually_paid,
    });

    console.log('[NOWPayments IPN]', { summary, applied });

    return NextResponse.json({ received: true, applied });
  } catch (error) {
    console.error('[NOWPayments IPN] Error:', error);
    return NextResponse.json({ error: 'IPN handler failed' }, { status: 500 });
  }
}
