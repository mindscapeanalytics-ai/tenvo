import 'server-only';

import { AsyncLocalStorage } from 'node:async_hooks';
import { withBusinessContext } from '@/lib/prisma/tenantExtension';

/**
 * Server-only trusted auth bypass for nested reads after a parent already ran withGuard.
 *
 * Never accept a client-supplied `skipAuth` flag on exported server actions — attackers can
 * invoke those actions directly. Only `runWithTrustedAuthBypass` (called from guarded parents
 * like hub shell bootstrap) activates this ALS flag.
 *
 * Also nests `withBusinessContext` so Prisma `db` auto-scoping is active for the same span.
 */

/** @type {AsyncLocalStorage<{ active: true; businessId: string } | undefined>} */
const trustedAuthAls = new AsyncLocalStorage();

/**
 * @returns {boolean}
 */
export function isTrustedAuthBypassActive() {
  return trustedAuthAls.getStore()?.active === true;
}

/**
 * @returns {string | null}
 */
export function getTrustedAuthBypassBusinessId() {
  return trustedAuthAls.getStore()?.businessId ?? null;
}

/**
 * Run nested hub reads without re-running membership SQL.
 * Parent must have already authorized `businessId` via withGuard / withApiAuth.
 *
 * @template T
 * @param {string} businessId
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export function runWithTrustedAuthBypass(businessId, fn) {
  if (!businessId || typeof businessId !== 'string') {
    throw new Error('runWithTrustedAuthBypass: businessId is required');
  }
  return withBusinessContext(businessId, () =>
    trustedAuthAls.run({ active: true, businessId }, fn)
  );
}
