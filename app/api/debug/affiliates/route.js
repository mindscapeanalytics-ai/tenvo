import { NextResponse } from 'next/server';
import { prismaBase as prisma } from '@/lib/db';
import { getServerSession } from '@/lib/auth/rbac';
import { isPlatformLevel } from '@/lib/config/platform';

export const dynamic = 'force-dynamic';

function serializeAffiliate(row) {
  if (!row) return null;
  return {
    ...row,
    commission_rate:
      row.commission_rate != null ? Number(row.commission_rate) : undefined,
    total_earnings: Number(row.total_earnings || 0),
  };
}

/**
 * Legacy affiliate tooling path — platform admins only (no public email PII).
 *
 * Prefer GET /api/affiliates/lookup for authenticated partner self-lookup.
 *
 * GET ?email=partner@example.com → single-partner lookup
 * GET (no email) → full list
 */
export async function GET(request) {
  const session = await getServerSession();
  if (!session?.user || !isPlatformLevel(session.user)) {
    return NextResponse.json(
      { error: 'Platform administrator access required', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const emailRaw = searchParams.get('email');
  const email = typeof emailRaw === 'string' ? emailRaw.trim() : '';

  try {
    if (email) {
      const cleanEmail = email.toLowerCase();
      const rows = await prisma.$queryRaw`
        SELECT id, name, email, referral_code, status, commission_rate,
               total_earnings, is_active, created_at
        FROM affiliates
        WHERE LOWER(email) = ${cleanEmail}
        LIMIT 1
      `;

      const affiliate = rows[0] ? serializeAffiliate(rows[0]) : null;
      return NextResponse.json({
        found: Boolean(affiliate),
        affiliate,
      });
    }

    const rows = await prisma.$queryRaw`
      SELECT id, name, email, referral_code, status, is_active, total_earnings, created_at
      FROM affiliates
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      affiliates: rows.map((r) => serializeAffiliate(r)),
    });
  } catch (error) {
    console.error('[GET /api/debug/affiliates]', error);
    return NextResponse.json(
      { error: 'Failed to look up affiliate', code: 'AFFILIATE_LOOKUP_FAILED' },
      { status: 500 }
    );
  }
}
