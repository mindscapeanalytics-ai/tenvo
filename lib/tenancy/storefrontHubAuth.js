import 'server-only';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { assertUserHasBusinessAccess } from '@/lib/tenancy/businessAccess';
import { actionFailure } from '@/lib/actions/_shared/result';

/**
 * Require authenticated hub user with access to the given business.
 * Use on storefront admin/dashboard server actions (not public checkout).
 */
export async function requireStorefrontHubAccess(businessId) {
  if (!businessId) {
    return { ok: false, response: actionFailure('INVALID_INPUT', 'Business ID is required') };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, response: actionFailure('UNAUTHORIZED', 'Sign in required') };
  }

  const allowed = await assertUserHasBusinessAccess({
    userId,
    businessId,
    sessionUser: session.user,
  });
  if (!allowed) {
    return { ok: false, response: actionFailure('FORBIDDEN', 'Access denied') };
  }

  return { ok: true, userId, session };
}
