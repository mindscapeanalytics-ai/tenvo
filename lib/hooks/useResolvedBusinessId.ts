'use client';

import { useBusiness } from '@/lib/context/BusinessContext';

/**
 * Resolve the active hub tenant id from an optional prop or BusinessContext.
 * Props often use `business?.id`, which is undefined until context hydrates —
 * analytics/portlets must wait on this id rather than treating empty charts as “no data”.
 *
 * @param {string | null | undefined} businessId
 * @returns {string | undefined}
 */
export function useResolvedBusinessId(businessId?: string | null): string | undefined {
  const { business } = useBusiness() as { business?: { id?: string } | null };
  const fromProp = typeof businessId === 'string' ? businessId.trim() : '';
  const fromContext = typeof business?.id === 'string' ? business.id.trim() : '';
  return fromProp || fromContext || undefined;
}
