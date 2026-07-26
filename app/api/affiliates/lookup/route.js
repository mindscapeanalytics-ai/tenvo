import { NextResponse } from 'next/server';
import { prismaBase as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Public partner lookup by email — canonical path for affiliate status tooling.
 * Mirrors /affiliates/status?email= and the legacy /api/debug/affiliates?email= shape.
 *
 * GET /api/affiliates/lookup?email=partner@example.com
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim() || '';

  if (!email) {
    return NextResponse.json(
      { found: false, affiliate: null, error: 'email query parameter is required', code: 'EMAIL_REQUIRED' },
      { status: 400 }
    );
  }

  try {
    const cleanEmail = email.toLowerCase();
    const rows = await prisma.$queryRaw`
      SELECT id, name, email, referral_code, status, commission_rate,
             total_earnings, is_active, created_at
      FROM affiliates
      WHERE LOWER(email) = ${cleanEmail}
      LIMIT 1
    `;

    if (!rows?.length) {
      return NextResponse.json({ found: false, affiliate: null });
    }

    const row = rows[0];
    return NextResponse.json({
      found: true,
      affiliate: {
        ...row,
        commission_rate: Number(row.commission_rate || 20),
        total_earnings: Number(row.total_earnings || 0),
      },
    });
  } catch (error) {
    console.error('[GET /api/affiliates/lookup]', error);
    return NextResponse.json(
      { found: false, affiliate: null, error: 'Lookup failed', code: 'AFFILIATE_LOOKUP_FAILED' },
      { status: 500 }
    );
  }
}
