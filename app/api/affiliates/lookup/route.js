import { NextResponse } from 'next/server';
import { prismaBase as prisma } from '@/lib/db';
import { getServerSession } from '@/lib/auth/rbac';
import { isPlatformLevel } from '@/lib/config/platform';

export const dynamic = 'force-dynamic';

/**
 * Partner / admin affiliate lookup by email.
 *
 * Requires a signed-in session. Platform admins see financial fields
 * (commission_rate, total_earnings). Matching session email sees the same
 * for their own partner row. Other callers get 403.
 *
 * GET /api/affiliates/lookup?email=partner@example.com
 */
export async function GET(request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json(
      { found: false, affiliate: null, error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

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
    const sessionEmail = String(session.user.email || '').trim().toLowerCase();
    const isAdmin = isPlatformLevel(session.user);
    const isSelf = Boolean(sessionEmail) && sessionEmail === cleanEmail;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        {
          found: false,
          affiliate: null,
          error: 'Forbidden: look up your own partner email, or sign in as a platform admin',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

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
        id: row.id,
        name: row.name,
        email: row.email,
        referral_code: row.referral_code,
        status: row.status,
        is_active: row.is_active,
        created_at: row.created_at,
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
