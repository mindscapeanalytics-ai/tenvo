import { prismaBase as prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

// Debug endpoint - REMOVE IN PRODUCTION
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    // List all affiliates raw
    const rows = await prisma.$queryRaw`SELECT id, name, email, referral_code, status, is_active, total_earnings FROM affiliates ORDER BY created_at DESC`;
    return NextResponse.json({ affiliates: rows.map(r => ({...r, total_earnings: Number(r.total_earnings)})) });
  }

  const rows = await prisma.$queryRaw`
    SELECT id, name, email, referral_code, status, commission_rate, total_earnings, is_active, created_at
    FROM affiliates WHERE LOWER(email) = ${email.toLowerCase().trim()} LIMIT 1
  `;
  return NextResponse.json({ found: rows.length > 0, affiliate: rows[0] || null });
}
