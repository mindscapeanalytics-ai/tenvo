/**
 * Retail Simple Dashboard — quick-entry action catalog + access gating.
 * Always returns the wireframe 8 tiles; locks unavailable ones (plan/role/domain)
 * so the home stays fully featured without dead-end clicks.
 */

import { Milk, Droplets, Wallet, ShoppingCart, UserPlus, Package, Truck, ClipboardList, MessageSquareQuote, FileText } from 'lucide-react';
import { isMilkHisabRelevant } from '@/lib/storefront/milkShopHisab';
import { isWaterHisabRelevant } from '@/lib/storefront/waterShopHisab';
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
 * @property {'available' | 'locked'} status
 * @property {string | null} [requiredPlan]
 * @property {string | null} [lockReason]
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

const LOCKED_TILE = {
  tile: 'bg-neutral-200 text-neutral-500',
  iconWrap: 'bg-white/70 text-neutral-400',
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
 * @param {NavAccess | undefined} access
 * @param {string} fallbackReason
 * @returns {{ status: 'available' | 'locked', requiredPlan: string | null, lockReason: string | null }}
 */
function resolveAccessState(access, fallbackReason = 'Not available on this plan or role') {
  if (isNavActionAvailable(access)) {
    return { status: 'available', requiredPlan: null, lockReason: null };
  }
  return {
    status: 'locked',
    requiredPlan: access?.requiredPlan || null,
    lockReason: access?.locked
      ? (access.requiredPlan ? `Requires ${access.requiredPlan} plan` : fallbackReason)
      : fallbackReason,
  };
}

/**
 * Build the full Retail Simple 8-tile grid (wireframe order).
 * Locked tiles stay visible so the home never looks feature-stripped.
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
  const waterRelevant = isWaterHisabRelevant(category);
  const posRelevant = isPosRelevant(category, domainKnowledge);
  const nav = typeof canNav === 'function' ? canNav : () => ({ visible: true, locked: false });
  const plan = typeof planCan === 'function' ? planCan : () => true;

  const milkOrSale = waterRelevant
    ? {
        id: 'route-hisab',
        label: 'Water Route',
        hint: 'Daily rider sheet',
        icon: Droplets,
        ...TILE.sky,
        ...resolveAccessState(nav('route-hisab'), 'Daily Route not available for this role'),
      }
    : milkRelevant
    ? {
        id: 'route-hisab',
        label: 'Milk Record',
        hint: 'Daily route entry',
        icon: Milk,
        ...TILE.sky,
        ...resolveAccessState(nav('route-hisab'), 'Route Hisab not available for this role'),
      }
    : {
        id: 'new-invoice',
        label: 'New Sale',
        hint: 'Quick invoice',
        icon: FileText,
        ...TILE.sky,
        ...resolveAccessState(nav('invoices'), 'Sales not available for this role'),
      };

  const expenseAccess = plan('expense_tracking')
    ? resolveAccessState(nav('expenses'), 'Expense tracking not available')
    : {
        status: /** @type {'locked'} */ ('locked'),
        requiredPlan: 'starter',
        lockReason: 'Requires expense tracking on your plan',
      };

  const posAccess = !posRelevant
    ? {
        status: /** @type {'locked'} */ ('locked'),
        requiredPlan: null,
        lockReason: 'POS is not used for this business type',
      }
    : resolveAccessState(nav('pos'), 'POS not available on this plan or role');

  /** @type {RetailSimpleAction[]} */
  const actions = [
    milkOrSale,
    {
      id: 'log-expense',
      label: 'Record Expense',
      hint: 'Log shop costs',
      icon: Wallet,
      ...(expenseAccess.status === 'available' ? TILE.rose : LOCKED_TILE),
      ...expenseAccess,
    },
    {
      id: 'pos',
      label: 'POS',
      hint: 'Open checkout',
      icon: ShoppingCart,
      ...(posAccess.status === 'available' ? TILE.emerald : LOCKED_TILE),
      ...posAccess,
    },
    {
      id: 'add-customer',
      label: 'Add Customer',
      hint: 'New client profile',
      icon: UserPlus,
      ...(() => {
        const access = resolveAccessState(nav('customers'), 'Customers not available for this role');
        return { ...(access.status === 'available' ? TILE.violet : LOCKED_TILE), ...access };
      })(),
    },
    {
      id: 'add-product',
      label: 'New Product',
      hint: 'Add to inventory',
      icon: Package,
      ...(() => {
        const access = resolveAccessState(nav('inventory'), 'Inventory not available for this role');
        return { ...(access.status === 'available' ? TILE.amber : LOCKED_TILE), ...access };
      })(),
    },
    {
      id: 'new-vendor',
      label: 'New Vendor',
      hint: 'Supplier profile',
      icon: Truck,
      ...(() => {
        const access = resolveAccessState(nav('vendors'), 'Vendors not available for this role');
        return { ...(access.status === 'available' ? TILE.teal : LOCKED_TILE), ...access };
      })(),
    },
    {
      id: 'new-purchase',
      label: 'Purchase Order',
      hint: 'Stock replenish',
      icon: ClipboardList,
      ...(() => {
        const access = resolveAccessState(nav('purchases'), 'Purchases not available for this role');
        return { ...(access.status === 'available' ? TILE.indigo : LOCKED_TILE), ...access };
      })(),
    },
    {
      id: 'inquiries',
      label: 'Customer Inquiry',
      hint: 'Messages & leads',
      icon: MessageSquareQuote,
      ...(() => {
        const access = resolveAccessState(nav('inquiries'), 'Storefront inquiries not available on this plan');
        return { ...(access.status === 'available' ? TILE.orange : LOCKED_TILE), ...access };
      })(),
    },
  ];

  // When milk shops also need New Sale, keep it as a bonus secondary action id list
  // (rendered separately by the dashboard). Primary wireframe stays 8 tiles.
  return actions;
}

/**
 * Extra Easy-mode tools that Retail home should still expose (never drop).
 * @param {object} opts
 * @param {string} opts.category
 * @param {CanNav} [opts.canNav]
 * @returns {Array<{ id: string, label: string, hint: string }>}
 */
export function buildRetailSimpleSecondaryActions({ category, canNav }) {
  const milkRelevant = isMilkHisabRelevant(category);
  const waterRelevant = isWaterHisabRelevant(category);
  const nav = typeof canNav === 'function' ? canNav : () => ({ visible: true, locked: false });
  /** @type {Array<{ id: string, label: string, hint: string }>} */
  const extras = [];

  if ((milkRelevant || waterRelevant) && isNavActionAvailable(nav('invoices'))) {
    extras.push({ id: 'new-invoice', label: 'New Invoice', hint: 'Credit / retail sale' });
  }
  if (isNavActionAvailable(nav('inventory'))) {
    extras.push({ id: 'inventory', label: 'Review Inventory', hint: 'Stock & low alerts' });
    extras.push({ id: 'excel-mode', label: 'Excel entry', hint: 'Bulk spreadsheet' });
  }
  if (isNavActionAvailable(nav('reports'))) {
    extras.push({ id: 'reports', label: 'Reports', hint: 'Analytics' });
  }
  if (isNavActionAvailable(nav('finance'))) {
    extras.push({ id: 'finance', label: 'Money', hint: 'Finance hub' });
  }
  if (isNavActionAvailable(nav('orders'))) {
    extras.push({ id: 'orders', label: 'Online Orders', hint: 'Storefront' });
  }
  return extras;
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
