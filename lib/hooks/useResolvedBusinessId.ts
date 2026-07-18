'use client';

import { useBusiness } from '@/lib/context/BusinessContext';

/**
 * Normalize a business UUID/string id from props or context.
 * @param {unknown} value
 * @returns {string | undefined}
 */
export function normalizeBusinessId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

/**
 * Resolve the active hub tenant id from an optional prop or BusinessContext.
 *
 * Why this exists:
 * - Hub parents often pass `business?.id`, which is `undefined` during context hydrate.
 * - Leaf components must not treat “id not ready” as “no data” or skip mutations forever.
 * - Prefer one resolved id per render tree (`DashboardTabs` → children) to avoid prop/context drift.
 *
 * @param {string | null | undefined} businessId
 * @returns {string | undefined}
 */
export function useResolvedBusinessId(businessId?: string | null): string | undefined {
  const { business } = useBusiness() as { business?: { id?: string } | null };
  return normalizeBusinessId(businessId) || normalizeBusinessId(business?.id);
}
