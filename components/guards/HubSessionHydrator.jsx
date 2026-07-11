'use client';

import { useLayoutEffect, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

/**
 * Apply a server-validated session hint on hub routes so AuthContext / tenant
 * sync do not wait on authClient.useSession() after the layout already
 * called getServerSession().
 *
 * Uses useLayoutEffect so hydration lands before browser paint.
 * Client session remains source of truth once Better Auth finishes revalidating.
 *
 * Note: toHubSessionHint lives in lib/utils/hubSessionHint.js (server-safe).
 */
export function HubSessionHydrator({ initialSession, children }) {
  const { hydrateFromServer } = useAuth();
  const appliedKeyRef = useRef(null);

  useLayoutEffect(() => {
    const userId = initialSession?.user?.id;
    if (!userId || typeof hydrateFromServer !== 'function') return;
    if (appliedKeyRef.current === userId) return;
    appliedKeyRef.current = userId;
    hydrateFromServer(initialSession);
  }, [initialSession, hydrateFromServer]);

  return children ?? null;
}

export default HubSessionHydrator;
