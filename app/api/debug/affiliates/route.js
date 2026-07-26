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
 * Affiliate lookup API (legacy path kept for email bookmark / tooling compatibility).
 *
 * GET ?email=partner@example.com → single-partner lookup (same shape as before)
 * GET (no email) → platform-admin only full list (no longer public)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const emailRaw = searchParams.get('email');
  const email = typeof emailRaw === 'string' ? emailRaw.trim() : '';

  try {
    // ── Public / partner: lookup by email (as before) ───────────────────────
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

    // ── Full list: platform admins only (was previously open — closed for security) ─
    const session = await getServerSession();
    if (!session?.user || !isPlatformLevel(session.user)) {
      return NextResponse.json(
        {
          error: 'Email is required. Use ?email= to look up a partner, or sign in as a platform admin to list all.',
          code: 'EMAIL_REQUIRED',
        },
        { status: 400 }
      );
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
