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
  pos: () => import('@/components/pos/PosTerminal'),
  settings: () => import('@/components/SettingsManager'),
  'store-settings': () => import('@/components/StoreSettingsManager'),
  orders: () => import('@/components/orders/OrdersManager'),
  campaigns: () => import('@/components/crm/CampaignsManager'),
  memberships: () => import('@/components/crm/MembershipManager'),
};

const IDLE_PREFETCH_ORDER = [
  'inventory',
  'invoices',
  'finance',
  'customers',
  'sales',
  'purchases',
  'reports',
  'pos',
  'orders',
  'settings',
  'store-settings',
];

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

/**
 * Warm hot-tab chunks after first paint (requestIdleCallback / timeout fallback).
 */
export function prefetchHotHubTabsIdle() {
  if (typeof window === 'undefined') return;
  const run = () => {
    for (const tab of IDLE_PREFETCH_ORDER) {
      prefetchHubTabChunk(tab);
    }
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 2500 });
  } else {
    window.setTimeout(run, 800);
  }
}

/**
 * If `actionUrl` is an in-hub `?tab=` link for the current business path, shallow-navigate.
 * Otherwise return null so callers can `router.push`.
 * @param {string} actionUrl
 * @returns {{ tab: string, financeView: string | null, domain: string } | null}
 */
export function parseHubTabActionUrl(actionUrl) {
  if (!actionUrl || typeof window === 'undefined') return null;
  try {
    const url = new URL(actionUrl, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const parts = url.pathname.split('/');
    if (parts[1] !== 'business' || !parts[2]) return null;
    // Only same domain handle (avoid cross-tenant shallow jump).
    const currentHandle = window.location.pathname.split('/')[2];
    if (currentHandle && currentHandle !== parts[2]) return null;
    // Nested routes like /business/x/manufacturing are full navigations.
    if (parts.length > 3 && parts[3]) return null;
    const tab = url.searchParams.get('tab') || 'dashboard';
    const financeView = url.searchParams.get('financeView');
    return { tab, financeView: financeView || null, domain: parts[2] };
  } catch {
    return null;
  }
}

/**
 * Resolve hub domain handle from the current path (or fallback).
 * @param {string} [fallback]
 */
export function resolveHubDomainHandle(fallback = 'retail-shop') {
  if (typeof window === 'undefined') return fallback;
  const parts = window.location.pathname.split('/');
  if (parts[1] === 'business' && parts[2]) return parts[2];
  return fallback;
}

/**
 * Navigate using the domain already in the address bar (alerts, palette, in-tab links).
 * @param {string} tab
 * @param {{ financeView?: string | null, inventoryFocus?: string | null, replace?: boolean, domain?: string }} [opts]
 */
export function navigateHubTabFromLocation(tab, opts = {}) {
  return navigateHubTab({
    domain: opts.domain || resolveHubDomainHandle(),
    tab,
    financeView: opts.financeView ?? null,
    inventoryFocus: opts.inventoryFocus ?? null,
    replace: Boolean(opts.replace),
  });
}

/**
 * Prefer shallow hub tab nav for same-tenant notification / deep links.
 * @param {string} actionUrl
 * @returns {boolean} true if handled shallowly
 */
export function tryNavigateHubActionUrl(actionUrl) {
  const parsed = parseHubTabActionUrl(actionUrl);
  if (!parsed) return false;
  navigateHubTab({
    domain: parsed.domain,
    tab: parsed.tab,
    financeView: parsed.financeView,
  });
  return true;
}
