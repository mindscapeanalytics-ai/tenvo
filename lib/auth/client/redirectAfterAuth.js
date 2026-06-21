'use client';

import { businessAPI } from '@/lib/api/business';
import notify, { TOAST_IDS } from '@/lib/utils/appToast';

function resolveOnboardingRegisterPath() {
  if (typeof window === 'undefined') return '/register';
  try {
    const savedStep = localStorage.getItem('tenvo_registration_step');
    if (savedStep === '3') return '/register?step=3';
    if (savedStep === '2') return '/register?step=2';
  } catch {
    /* ignore */
  }
  return '/register';
}

/**
 * After Better Auth session is established (password, OTP, or OAuth),
 * route the user to their workspace or onboarding.
 *
 * @param {import('next/navigation').AppRouterInstance} router
 * @param {{ id: string; name?: string | null; email?: string | null }} user
 */
export async function redirectAfterAuth(router, user) {
  if (!user?.id) return;

  const firstName =
    (typeof user.name === 'string' && user.name.trim().split(/\s+/)[0]) ||
    (typeof user.email === 'string' && user.email.split('@')[0]) ||
    'there';

  try {
    const businesses = await businessAPI.getByUserId(user.id);

    if (!businesses?.length) {
      notify.success('Signed in. Let’s finish setting up your business.', { id: TOAST_IDS.AUTH_WELCOME });
      router.replace(resolveOnboardingRegisterPath());
      return;
    }

    notify.success(`Welcome back, ${firstName}!`, { id: TOAST_IDS.AUTH_WELCOME });

    if (businesses.length === 1) {
      const d = String(businesses[0].domain || '').trim().toLowerCase();
      router.replace(`/business/${encodeURIComponent(d)}`);
      return;
    }

    router.replace('/multi-business');
  } catch (e) {
    console.error('[redirectAfterAuth]', e);
    router.replace(resolveOnboardingRegisterPath());
  }
}
