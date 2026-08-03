'use server';

import { prismaBase as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isPlatformLevel } from '@/lib/config/platform';
import { headers } from 'next/headers';
import { serializeDecimalsDeep } from '@/lib/utils/serializePrismaDecimals';

/**
 * Ensures the caller is a platform owner/admin.
 */
async function assertPlatformAdmin() {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    throw new Error('Not authenticated');
  }
  if (!session?.user || !isPlatformLevel(session.user)) {
    throw new Error('Unauthorized: Platform admin required');
  }
}

/**
 * Fetch all platform affiliates with referral details
 */
export async function getPlatformAffiliates() {
  try {
    await assertPlatformAdmin();

    // Raw SQL: always returns status column regardless of Prisma client cache
    const affiliates = await prisma.$queryRaw`
      SELECT id, name, email, referral_code, status, commission_rate,
             total_earnings, is_active, payout_details, created_at, updated_at
      FROM affiliates
      ORDER BY created_at DESC
    `;

    // Fetch all referrals in one query
    const affiliateIds = affiliates.map(a => a.id);
    let allReferrals = [];
    if (affiliateIds.length > 0) {
      allReferrals = await prisma.$queryRaw`
        SELECT id, affiliate_id, business_id, status, commission_earned, created_at, updated_at
        FROM referrals
        WHERE affiliate_id = ANY(${affiliateIds}::uuid[])
        ORDER BY created_at DESC
      `;
    }

    // Fetch business names in one batch
    const businessIds = [...new Set(allReferrals.map(r => r.business_id).filter(Boolean))];
    let businessMap = {};
    if (businessIds.length > 0) {
      const businesses = await prisma.businesses.findMany({
        where: { id: { in: businessIds } },
        select: { id: true, business_name: true, domain: true, plan_tier: true }
      });
      businessMap = Object.fromEntries(businesses.map(b => [b.id, b]));
    }

    // Group referrals by affiliate_id
    const referralsByAffiliate = {};
    for (const ref of allReferrals) {
      if (!referralsByAffiliate[ref.affiliate_id]) referralsByAffiliate[ref.affiliate_id] = [];
      referralsByAffiliate[ref.affiliate_id].push({
        ...ref,
        commission_earned: Number(ref.commission_earned),
        businesses: businessMap[ref.business_id] || null,
      });
    }

    // Build enriched affiliates with referral counts
    const enriched = affiliates.map(aff => ({
      ...aff,
      commission_rate: Number(aff.commission_rate),
      total_earnings: Number(aff.total_earnings),
      referrals: referralsByAffiliate[aff.id] || [],
      _count: { referrals: (referralsByAffiliate[aff.id] || []).length },
    }));

    return { success: true, data: enriched };
  } catch (error) {
    console.error('Error fetching platform affiliates:', error);
    return { success: false, error: error.message };
  }
}


/**
 * Approve or reject an affiliate
 */
export async function updateAffiliateStatusAction(id, action) {
  try {
    await assertPlatformAdmin();

    if (!id || !['approve', 'reject'].includes(action)) {
      throw new Error('Invalid arguments');
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Use raw SQL to bypass stale Prisma client cache that doesn't know status column yet
    await prisma.$executeRaw`
      UPDATE affiliates
      SET status = ${newStatus}, updated_at = now()
      WHERE id = ${id}::uuid
    `;

    return { success: true, data: { id, status: newStatus } };
  } catch (error) {
    console.error('Error updating affiliate status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a referral commission as paid and update affiliate total_earnings
 */
export async function markReferralPaidAction(referralId) {
  try {
    await assertPlatformAdmin();

    if (!referralId) {
      throw new Error('Referral ID is required');
    }

    // Get the referral first
    const referral = await prisma.referrals.findUnique({
      where: { id: referralId },
      select: { id: true, affiliate_id: true, commission_earned: true, status: true }
    });

    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.status === 'paid') {
      throw new Error('This commission has already been marked as paid');
    }

    // Mark referral as paid via raw SQL (bypasses stale Prisma client cache)
    await prisma.$executeRaw`
      UPDATE referrals SET status = 'paid', updated_at = now()
      WHERE id = ${referralId}::uuid
    `;

    // Recalculate total_earnings from all paid referrals
    const paidReferrals = await prisma.referrals.findMany({
      where: { affiliate_id: referral.affiliate_id, status: 'paid' },
      select: { commission_earned: true }
    });
    const alreadyPaidTotal = paidReferrals.reduce(
      (sum, r) => sum + Number(r.commission_earned), 0
    );
    // Add current referral amount (not yet reflected since we used raw SQL)
    const newTotal = alreadyPaidTotal + Number(referral.commission_earned);

    // Update total_earnings via raw SQL
    await prisma.$executeRaw`
      UPDATE affiliates SET total_earnings = ${newTotal}, updated_at = now()
      WHERE id = ${referral.affiliate_id}::uuid
    `;

    return { success: true, data: { id: referralId, status: 'paid' } };
  } catch (error) {
    console.error('Error marking referral as paid:', error);
    return { success: false, error: error.message };
  }
}
