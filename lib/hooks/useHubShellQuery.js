'use client';

import { useQuery } from '@tanstack/react-query';
import {
    hubShellQueryKey,
    sameTenantPlaceholderData,
} from '@/lib/dashboard/hubQueryKeys';
import {
    fetchHubShellQuery,
    readHubShellPlaceholder,
} from '@/lib/dashboard/hubShellQuery';

/**
 * Canonical hub shell bootstrap query (Overview KPIs + lean lists).
 * placeholderData: sessionStorage → same-tenant keep-previous.
 *
 * @param {{
 *   businessId?: string | null,
 *   dateFromISO: string,
 *   dateToISO: string,
 *   enabled?: boolean,
 * }} args
 */
export function useHubShellQuery({
    businessId,
    dateFromISO,
    dateToISO,
    enabled = true,
}) {
    return useQuery({
        queryKey: hubShellQueryKey(businessId, dateFromISO, dateToISO),
        queryFn: () =>
            fetchHubShellQuery({
                businessId,
                from: dateFromISO,
                to: dateToISO,
            }),
        enabled: Boolean(enabled && businessId && dateFromISO && dateToISO),
        staleTime: 45_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
        placeholderData: (previousData, previousQuery) => {
            const cached = readHubShellPlaceholder(businessId, dateFromISO, dateToISO);
            if (cached) return cached;
            return sameTenantPlaceholderData(previousData, previousQuery, businessId, 1);
        },
    });
}
