/**
 * Retail Simple Dashboard — quick-entry action catalog + access gating.
 * Mirrors Sidebar / TabGuard rules so tiles never open dead tabs.
 */

import { Milk, Wallet, ShoppingCart, UserPlus, Package, Truck, ClipboardList, MessageSquareQuote, FileText } from 'lucide-react';
import { isMilkHisabRelevant } from '@/lib/storefront/milkShopHisab';
import { isPosRelevant } from '@/lib/config/domains';

/** @typedef {{ visible?: boolean, locked?: boolean, requiredPlan?: string | null }} NavAccess */
/** @typedef {(key: string) => NavAccess} CanNav */
/** @typedef {(feature: string) => boolean} PlanCan */

/**
 * @typedef {object} RetailSimpleAction
 * @property {string} id
 * @property {string} label
 * @property {string} hint
 * @property {import('lucide-react').LucideIcon} icon
 * @property {string} tile
 * @property {string} iconWrap
 */

const TILE = {
  sky: { tile: 'bg-sky-600 text-white', iconWrap: 'bg-white/20 text-white' },
  rose: { tile: 'bg-rose-600 text-white', iconWrap: 'bg-white/20 text-white' },
  emerald: { tile: 'bg-emerald-600 text-white', iconWrap: 'bg-white/20 text-white' },
  violet: { tile: 'bg-violet-600 text-white', iconWrap: 'bg-white/20 text-white' },
  amber: { tile: 'bg-amber-500 text-white', iconWrap: 'bg-white/20 text-white' },
  teal: { tile: 'bg-teal-600 text-white', iconWrap: 'bg-white/20 text-white' },
  indigo: { tile: 'bg-indigo-600 text-white', iconWrap: 'bg-white/20 text-white' },
  orange: { tile: 'bg-orange-500 text-white', iconWrap: 'bg-white/20 text-white' },
};

/**
 * @param {NavAccess | undefined} access
 * @returns {boolean}
 */
export function isNavActionAvailable(access) {
  if (!access) return false;
  return access.visible !== false && access.locked !== true;
}

/**
 * Build gated quick-entry tiles for Retail Simple home.
 * Hides tiles the role/plan/domain cannot use (no toast dead-ends on primary CTAs).
 *
 * @param {object} opts
 * @param {string} opts.category
 * @param {Record<string, unknown> | null | undefined} [opts.domainKnowledge]
 * @param {CanNav} [opts.canNav]
 * @param {PlanCan} [opts.planCan]
 * @returns {RetailSimpleAction[]}
 */
export function buildRetailSimpleActions({ category, domainKnowledge, canNav, planCan }) {
  const milkRelevant = isMilkHisabRelevant(category);
  const posRelevant = isPosRelevant(category, domainKnowledge);
  const nav = typeof canNav === 'function' ? canNav : () => ({ visible: true, locked: false });
  const plan = typeof planCan === 'function' ? planCan : () => true;

  /** @type {RetailSimpleAction[]} */
  const actions = [];

  if (milkRelevant && isNavActionAvailable(nav('route-hisab'))) {
    actions.push({
      id: 'route-hisab',
      label: 'Milk Record',
      hint: 'Daily route entry',
      icon: Milk,
      ...TILE.sky,
    });
  } else if (isNavActionAvailable(nav('invoices'))) {
    actions.push({
      id: 'new-invoice',
      label: 'New Sale',
      hint: 'Quick invoice',
      icon: FileText,
      ...TILE.sky,
    });
  }

  if (plan('expense_tracking') && isNavActionAvailable(nav('expenses'))) {
    actions.push({
      id: 'log-expense',
      label: 'Record Expense',
      hint: 'Log shop costs',
      icon: Wallet,
      ...TILE.rose,
    });
  }

  if (posRelevant && isNavActionAvailable(nav('pos'))) {
    actions.push({
      id: 'pos',
      label: 'POS',
      hint: 'Open checkout',
      icon: ShoppingCart,
      ...TILE.emerald,
    });
  }

  if (isNavActionAvailable(nav('customers'))) {
    actions.push({
      id: 'add-customer',
      label: 'Add Customer',
      hint: 'New client profile',
      icon: UserPlus,
      ...TILE.violet,
    });
  }

  if (isNavActionAvailable(nav('inventory'))) {
    actions.push({
      id: 'add-product',
      label: 'New Product',
      hint: 'Add to inventory',
      icon: Package,
      ...TILE.amber,
    });
  }

  if (isNavActionAvailable(nav('vendors'))) {
    actions.push({
      id: 'new-vendor',
      label: 'New Vendor',
      hint: 'Supplier profile',
      icon: Truck,
      ...TILE.teal,
    });
  }

  if (isNavActionAvailable(nav('purchases'))) {
    actions.push({
      id: 'new-purchase',
      label: 'Purchase Order',
      hint: 'Stock replenish',
      icon: ClipboardList,
      ...TILE.indigo,
    });
  }

  if (isNavActionAvailable(nav('inquiries'))) {
    actions.push({
      id: 'inquiries',
      label: 'Customer Inquiry',
      hint: 'Messages & leads',
      icon: MessageSquareQuote,
      ...TILE.orange,
    });
  }

  return actions;
}

/**
 * Resolve online (storefront) sales amount from hub dashboard metrics.
 * Prefer channel revenue from getDashboardKPIs (dashboard.view) — not ops/ai_analytics.
 *
 * @param {Record<string, unknown> | null | undefined} dashboardMetrics
 * @returns {number}
 */
export function resolveOnlineSalesAmount(dashboardMetrics) {
  if (!dashboardMetrics || typeof dashboardMetrics !== 'object') return 0;
  const channels = dashboardMetrics.channels;
  if (channels && typeof channels === 'object') {
    const n = Number(/** @type {Record<string, unknown>} */ (channels).storefront);
    if (Number.isFinite(n)) return n;
  }
  const revenue = dashboardMetrics.revenue;
  if (revenue && typeof revenue === 'object') {
    const n = Number(/** @type {Record<string, unknown>} */ (revenue).storefront);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/**
 * @param {Record<string, unknown> | null | undefined} dashboardMetrics
 * @returns {number}
 */
export function resolveOnlineOrderCount(dashboardMetrics) {
  if (!dashboardMetrics || typeof dashboardMetrics !== 'object') return 0;
  const orders = dashboardMetrics.orders;
  if (!orders || typeof orders !== 'object') return 0;
  return Number(/** @type {Record<string, unknown>} */ (orders).storefront || 0) || 0;
}
