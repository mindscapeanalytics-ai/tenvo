'use client';

import { useLayoutEffect, useRef } from 'react';
import { useData } from '@/lib/context/DataContext';

/**
 * Apply RSC-fetched hub shell before paint so Easy/Advanced Overview
 * does not skeleton on cold login (Zoho/Busy-style contentful first paint).
 */
export function HubShellHydrator({ initialHubShell }) {
  const { hydrateHubShellFromServer } = useData();
  const appliedKeyRef = useRef(null);

  useLayoutEffect(() => {
    if (!initialHubShell?.businessId || !initialHubShell?.payload) return;
    if (typeof hydrateHubShellFromServer !== 'function') return;

    const key = `${initialHubShell.businessId}|${initialHubShell.dateFrom}|${initialHubShell.dateTo}`;
    if (appliedKeyRef.current === key) return;
    appliedKeyRef.current = key;

    hydrateHubShellFromServer(initialHubShell.payload, {
      businessId: initialHubShell.businessId,
      dateFrom: initialHubShell.dateFrom,
      dateTo: initialHubShell.dateTo,
    });
  }, [initialHubShell, hydrateHubShellFromServer]);

  return null;
}

export default HubShellHydrator;
