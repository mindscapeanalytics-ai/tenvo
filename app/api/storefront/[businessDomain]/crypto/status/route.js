import { NextResponse } from 'next/server';
import { resolveStorefrontBusiness } from '@/lib/tenancy/resolveStorefrontBusiness';
import pool from '@/lib/db';
import { getPaymentStatus, isNowPaymentsConfigured } from '@/lib/payments/nowpayments';

export const dynamic = 'force-dynamic';

/**
 * GET /api/storefront/[businessDomain]/crypto/status?paymentId=&orderNumber=&email=
 */
export async function GET(request, { params }) {
  try {
    if (!isNowPaymentsConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Crypto payments not configured' },
        { status: 503 }
      );
    }

    const { businessDomain } = await params;
    const business = await resolveStorefrontBusiness(businessDomain);
    if (!business) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!paymentId && !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'paymentId or orderNumber is required' },
        { status: 400 }
      );
    }

    let resolvedPaymentId = paymentId;
    let orderPaymentStatus = null;

    if (orderNumber) {
      const client = await pool.connect();
      try {
        const res = await client.query(
          `SELECT payment_status, customer_email, metadata
           FROM storefront_orders
           WHERE business_id = $1::uuid AND order_number = $2
           LIMIT 1`,
          [business.id, orderNumber]
        );
        const row = res.rows[0];
        if (!row) {
          return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }
        if (email && String(row.customer_email || '').toLowerCase() !== email) {
          return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
        }
        orderPaymentStatus = row.payment_status;
        const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
        if (!resolvedPaymentId && meta.crypto?.payment_id) {
          resolvedPaymentId = String(meta.crypto.payment_id);
        }
      } finally {
        client.release();
      }
    }

    if (orderPaymentStatus === 'paid') {
      return NextResponse.json({
        success: true,
        paymentStatus: 'finished',
        orderPaymentStatus: 'paid',
        isCompleted: true,
      });
    }

    if (!resolvedPaymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment not found for this order' },
        { status: 404 }
      );
    }

    const data = await getPaymentStatus(resolvedPaymentId);
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    const status = String(data.paymentStatus || '').toLowerCase();
    const isCompleted = ['confirmed', 'finished', 'paid', 'complete'].includes(status);

    return NextResponse.json({
      success: true,
      paymentStatus: data.paymentStatus,
      paymentId: data.paymentId,
      payAddress: data.payAddress,
      payAmount: data.payAmount,
      actuallyPaid: data.actuallyPaid,
      payCurrency: data.payCurrency,
      orderPaymentStatus,
      isCompleted,
    });
  } catch (error) {
    console.error('[Storefront crypto status]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load payment status' },
      { status: 500 }
    );
  }
}
