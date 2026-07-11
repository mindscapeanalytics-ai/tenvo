'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useBusiness } from '@/lib/context/BusinessContext';
import { useData } from '@/lib/context/DataContext';
import {
    hasValidOptimisticShell,
    readOptimisticBusinessShell,
    shellMatchesDomain,
} from '@/lib/utils/businessClientCache';

function resolveBusinessDomainFromPath(pathname) {
    const parts = (pathname || '').split('/');
    return parts[1] === 'business' ? parts[2] || null : null;
}

/**
 * Single source of truth for Enterprise Hub readiness.
 * - hubReady: auth + business context resolved (server-validated)
 * - navReady: hubReady OR valid optimistic/live shell (instant sidebar)
 * - contentReady: hubReady + initial shell data bootstrap complete
 * - workspaceBlocking: block main workspace only when no tenant context at all
 *
 * Progressive paint (Zoho/Busy/Odoo-style): once a tenant shell exists
 * (cache or live), chrome + tabs render immediately; widgets skeleton.
 */
export function useHubReady() {
    const pathname = usePathname();
    const { loading: authLoading, serverHydrated, user: authUser } = useAuth();
    const {
        isLoading: businessLoading,
        isRevalidating,
        business,
        role,
        isPlatformOwner,
    } = useBusiness();
    const { isShellReady, isDataLoaded, loadingModules } = useData();

    const domainFromPath = resolveBusinessDomainFromPath(pathname);

    // Sync localStorage read on the client (no post-paint hydration delay).
    const cachedOptimisticShell = useMemo(() => {
        if (typeof window === 'undefined') return { business: null, role: null };
        return readOptimisticBusinessShell(domainFromPath);
    }, [domainFromPath, business?.id, role]);

    const hasCachedOptimisticShell = hasValidOptimisticShell(
        cachedOptimisticShell.business,
        cachedOptimisticShell.role,
        domainFromPath
    );

    const hasRole = isPlatformOwner || role != null;
    const hasLiveShell =
        Boolean(business?.id) &&
        hasRole &&
        shellMatchesDomain(business, domainFromPath);

    const hasOptimisticShell = hasCachedOptimisticShell || hasLiveShell;
    const optimisticShell = hasLiveShell
        ? { business, role: role ?? (isPlatformOwner ? 'owner' : null) }
        : cachedOptimisticShell;

    const authBlocking = authLoading && !serverHydrated && !authUser;
    const businessSettled = !businessLoading || isRevalidating;
    const hubReady = !authBlocking && businessSettled && !!business?.id && hasRole;

    const navReady =
        hubReady ||
        hasLiveShell ||
        (hasCachedOptimisticShell &&
            !!cachedOptimisticShell.business?.id &&
            !!cachedOptimisticShell.role);

    const hasWorkspaceContext = Boolean(business?.id) || hasCachedOptimisticShell;
    const workspaceBlocking =
        !hasWorkspaceContext && (authBlocking || (businessLoading && !isRevalidating));

    const contentReady = hubReady && isShellReady;

    return {
        authLoading: authBlocking,
        businessLoading,
        hubReady,
        navReady,
        hasOptimisticShell,
        workspaceBlocking,
        contentReady,
        isFullDataLoaded: isDataLoaded,
        loadingModules,
        isRevalidating,
        optimisticShell,
    };
}
