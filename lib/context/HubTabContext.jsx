'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  normalizeDashboardTab,
  resolveDashboardTab,
} from '@/lib/config/tabs';
import {
  HUB_TAB_NAVIGATE_EVENT,
  navigateHubTab,
  prefetchHotHubTabsIdle,
} from '@/lib/utils/hubTabNavigation';

/**
 * @typedef {{
 *   activeTab: string,
 *   urlTab: string,
 *   domain: string,
 *   goToTab: (tab: string, opts?: {
 *     financeView?: string | null,
 *     inventoryFocus?: string | null,
 *     replace?: boolean,
 *   }) => { type: 'tab' | 'route', href: string, tab?: string, financeView?: string | null },
 * }} HubTabContextValue
 */

/** @type {import('react').Context<HubTabContextValue | null>} */
const HubTabContext = createContext(null);

function domainFromPathname(pathname) {
  const parts = String(pathname || '').split('/');
  return parts[2] || 'retail-shop';
}

/**
 * Single source of truth for hub ?tab= paint + highlight.
 * Lives above Sidebar / Header / DashboardClient so all surfaces stay in lockstep.
 */
export function HubTabProvider({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const domain = useMemo(() => domainFromPathname(pathname), [pathname]);
  const urlTab = useMemo(
    () => resolveDashboardTab(normalizeDashboardTab(searchParams.get('tab') || 'dashboard')),
    [searchParams]
  );

  const [optimisticTab, setOptimisticTab] = useState(/** @type {string | null} */ (null));
  const activeTab = optimisticTab ?? urlTab;

  useEffect(() => {
    const onNav = (e) => {
      const tab = e.detail?.tab;
      if (!tab) return;
      setOptimisticTab(resolveDashboardTab(normalizeDashboardTab(tab)));
    };
    window.addEventListener(HUB_TAB_NAVIGATE_EVENT, onNav);
    return () => window.removeEventListener(HUB_TAB_NAVIGATE_EVENT, onNav);
  }, []);

  useEffect(() => {
    if (optimisticTab == null || optimisticTab !== urlTab) return;
    queueMicrotask(() => setOptimisticTab(null));
  }, [optimisticTab, urlTab]);

  // Browser back/forward: drop optimistic so URL tab is authoritative.
  useEffect(() => {
    const onPopState = () => {
      setOptimisticTab(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Domain / path change (tenant switch): clear optimistic.
  useEffect(() => {
    queueMicrotask(() => setOptimisticTab(null));
  }, [pathname]);

  useEffect(() => {
    prefetchHotHubTabsIdle();
  }, []);

  useEffect(() => {
    prefetchHotHubTabsIdle({ immediate: true });
  }, [domain]);

  const goToTab = useCallback(
    (tab, opts = {}) => {
      const result = navigateHubTab({
        domain,
        tab,
        financeView: opts.financeView ?? null,
        inventoryFocus: opts.inventoryFocus ?? null,
        replace: Boolean(opts.replace),
      });
      if (result.type === 'route') {
        router.push(result.href, { scroll: false });
      }
      return result;
    },
    [domain, router]
  );

  const value = useMemo(
    () => ({
      activeTab,
      urlTab,
      domain,
      goToTab,
    }),
    [activeTab, urlTab, domain, goToTab]
  );

  return <HubTabContext.Provider value={value}>{children}</HubTabContext.Provider>;
}

/**
 * @returns {HubTabContextValue}
 */
export function useHubTab() {
  const ctx = useContext(HubTabContext);
  if (!ctx) {
    throw new Error('useHubTab must be used within HubTabProvider');
  }
  return ctx;
}

/**
 * Optional for chrome that may render outside the hub shell.
 * @returns {HubTabContextValue | null}
 */
export function useHubTabOptional() {
  return useContext(HubTabContext);
}
