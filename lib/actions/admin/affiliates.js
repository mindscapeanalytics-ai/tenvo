'use server';

import { prismaBase as prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isPlatformLevel } from '@/lib/config/platform';
import { headers } from 'next/headers';

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
 * Fetch all platform affiliates
 */
export async function getPlatformAffiliates() {
  try {
    await assertPlatformAdmin();

    const affiliates = await prisma.affiliates.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { referrals: true }
        }
      }
    });

    return { success: true, data: affiliates };
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

    return { success: true, data: updated };
  } catch (error) {
    console.error('Error updating affiliate status:', error);
    return { success: false, error: error.message };
  }
}
