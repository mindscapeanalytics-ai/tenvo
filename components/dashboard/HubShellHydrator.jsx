'use client';

import { useLayoutEffect, useRef } from 'react';
import { useData } from '@/lib/context/DataContext';
import { useBusiness } from '@/lib/context/BusinessContext';

/**
 * Apply RSC-fetched hub shell before paint so Easy/Advanced Overview
 * does not skeleton on cold login (Zoho/Busy-style contentful first paint).
 * Never apply a shell for a different tenant than the live BusinessContext.
 */
export function HubShellHydrator({ initialHubShell }) {
  const { hydrateHubShellFromServer } = useData();
  const { business } = useBusiness();
  const appliedKeyRef = useRef(null);

  useLayoutEffect(() => {
    if (!initialHubShell?.businessId || !initialHubShell?.payload) return;
    if (typeof hydrateHubShellFromServer !== 'function') return;

    // BusinessContext may resolve after first paint — allow hydrate only when
    // unresolved, or when ids match. Never paint Marbles into Roll Inn.
    const liveId = business?.id ? String(business.id) : '';
    const shellId = String(initialHubShell.businessId);
    if (liveId && liveId !== shellId) {
      // Allow retry once BusinessContext catches up to this page's shop.
      appliedKeyRef.current = null;
      return;
    }

    const key = `${initialHubShell.businessId}|${initialHubShell.dateFrom}|${initialHubShell.dateTo}`;
    if (appliedKeyRef.current === key) return;
    appliedKeyRef.current = key;

    hydrateHubShellFromServer(initialHubShell.payload, {
      businessId: initialHubShell.businessId,
      dateFrom: initialHubShell.dateFrom,
      dateTo: initialHubShell.dateTo,
    });
  }, [initialHubShell, hydrateHubShellFromServer, business?.id]);

  return null;
}

export default HubShellHydrator;
