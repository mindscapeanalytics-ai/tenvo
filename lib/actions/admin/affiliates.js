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

    const affiliates = await prisma.affiliates.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        referrals: {
          orderBy: { created_at: 'desc' },
          include: {
            businesses: { select: { business_name: true, domain: true, plan_tier: true } }
          }
        },
        _count: {
          select: { referrals: true }
        }
      }
    });

    return { success: true, data: serializeDecimalsDeep(affiliates) };
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

    const updated = await prisma.affiliates.update({
      where: { id },
      data: { status: newStatus }
    });

    return { success: true, data: serializeDecimalsDeep(updated) };
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

    // Mark the referral as paid
    const updatedReferral = await prisma.referrals.update({
      where: { id: referralId },
      data: { status: 'paid' }
    });

    // Update the affiliate's total_earnings by summing all paid referrals
    const paidReferrals = await prisma.referrals.findMany({
      where: { affiliate_id: referral.affiliate_id, status: 'paid' },
      select: { commission_earned: true }
    });

    const newTotal = paidReferrals.reduce(
      (sum, r) => sum + Number(r.commission_earned),
      0
    );

    await prisma.affiliates.update({
      where: { id: referral.affiliate_id },
      data: { total_earnings: newTotal }
    });

    return { success: true, data: serializeDecimalsDeep(updatedReferral) };
  } catch (error) {
    console.error('Error marking referral as paid:', error);
    return { success: false, error: error.message };
  }
}
