/**
 * Hub tab navigation — Zoho/Busy-style instant paint.
 *
 * Primary nav used to `router.push(?tab=)` which soft-navigates the force-dynamic
 * `/business/[category]` segment and gated panel paint on `useSearchParams`.
 * This module keeps URL shareable while flipping the active panel in the same tick:
 *   1. Dispatch `switch-tab` so DashboardClient can set optimisticTab immediately
 *   2. Sync `?tab=` via `history.pushState` (no RSC / no loading.js remount)
 *
 * Real route changes (`/admin`, external store, domain switch) still use the router.
 */

import {
  normalizeDashboardTab,
  resolveDashboardTab,
  resolveFinanceViewForTab,
} from '@/lib/config/tabs';

export const HUB_TAB_NAVIGATE_EVENT = 'switch-tab';

/**
 * @param {string} domain Business domain handle (URL segment)
 * @param {string} tab Raw or canonical tab id
 * @param {{ financeView?: string | null }} [opts]
 * @returns {{ href: string, tab: string, financeView: string | null }}
 */
export function buildHubTabHref(domain, tab, opts = {}) {
  const handle = String(domain || 'retail-shop').trim() || 'retail-shop';
  const raw = String(tab || 'dashboard').trim().toLowerCase();
  const financeView =
    opts.financeView != null && String(opts.financeView).trim()
      ? String(opts.financeView).trim().toLowerCase()
      : resolveFinanceViewForTab(raw);
  const targetTab = resolveDashboardTab(normalizeDashboardTab(raw));
  const path = `/business/${encodeURIComponent(handle)}`;
  const qs = new URLSearchParams();
  if (targetTab !== 'dashboard') qs.set('tab', targetTab);
  if (financeView) qs.set('financeView', financeView);
  const q = qs.toString();
  return {
    href: q ? `${path}?${q}` : path,
    tab: targetTab,
    financeView: financeView || null,
  };
}

/**
 * Write hub tab query into the address bar without a Next soft-navigation.
 * Next 14.1+ / 16: `useSearchParams` updates from pushState/replaceState.
 *
 * @param {string} href Absolute path + query (same origin)
 * @param {{ replace?: boolean }} [opts]
 */
export function syncHubTabUrl(href, opts = {}) {
  if (typeof window === 'undefined') return;
  const next = String(href || '').trim();
  if (!next) return;
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === next) return;
  const method = opts.replace ? 'replaceState' : 'pushState';
  window.history[method](window.history.state, '', next);
}

/**
 * Navigate to a hub tab with instant panel paint + shallow URL sync.
 *
 * @param {{
 *   domain: string,
 *   tab: string,
 *   financeView?: string | null,
 *   inventoryFocus?: string | null,
 *   replace?: boolean,
 *   skipEvent?: boolean,
 * }} args
 * @returns {{ type: 'tab' | 'route', href: string, tab?: string, financeView?: string | null }}
 */
export function navigateHubTab({
  domain,
  tab,
  financeView = null,
  inventoryFocus = null,
  replace = false,
  skipEvent = false,
}) {
  const raw = String(tab || 'dashboard').trim().toLowerCase();
  if (raw === 'platform-admin') {
    return { type: 'route', href: '/admin' };
  }

  const built = buildHubTabHref(domain, raw, { financeView });
  if (!skipEvent && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(HUB_TAB_NAVIGATE_EVENT, {
        detail: {
          tab: built.tab,
          financeView: built.financeView,
          inventoryFocus: inventoryFocus || null,
          shallow: true,
        },
      })
    );
  }
  syncHubTabUrl(built.href, { replace });
  return { type: 'tab', href: built.href, tab: built.tab, financeView: built.financeView };
}

/**
 * Prefetch hot hub tab JS chunks on idle/hover (first visit only pays download).
 * Keep paths aligned with DashboardTabs lazyHubTab loaders.
 */
const HOT_TAB_PREFETCHERS = {
  inventory: () => import('@/app/business/[category]/components/tabs/InventoryTab'),
  invoices: () => import('@/app/business/[category]/components/islands/InvoiceList.client'),
  customers: () => import('@/app/business/[category]/components/tabs/CustomersTab'),
  purchases: () => import('@/components/PurchaseOrderManager'),
  sales: () => import('@/components/SalesManager'),
  finance: () => import('@/components/finance/FinanceHub'),
  reports: () => import('@/components/reports/ReportBuilder'),
  /** Overview chunk — DomainDashboard */
  dashboard: () => import('@/app/business/[category]/components/tabs/DomainDashboard'),
};

/** @type {Set<string>} */
const prefetchedTabs = new Set();

/**
 * @param {string} tab
 */
export function prefetchHubTabChunk(tab) {
  const key = resolveDashboardTab(normalizeDashboardTab(tab));
  if (prefetchedTabs.has(key)) return;
  const loader = HOT_TAB_PREFETCHERS[key];
  if (!loader) return;
  prefetchedTabs.add(key);
  void loader().catch(() => {
    prefetchedTabs.delete(key);
  });
}
