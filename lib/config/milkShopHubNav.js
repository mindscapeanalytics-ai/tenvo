/**
 * Milk-shop hub navigation relevance — domain chrome only.
 * Plan/feature locks still come from `getNavItemAccess` + packaging.
 *
 * Neighborhood doodh shops should never see restaurant / gym / warehouse / HR chrome,
 * even on Business or Enterprise tiers without the milk-commerce SKU.
 */

import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { getMilkShopLeanFeatureStrip } from '@/lib/config/domainPackageFeatures';
import { isMilkShopStore } from '@/lib/storefront/milkShopStorefront';
import { getPackagingFromSettings } from '@/lib/subscription/effectivePlanAccess';
import { mergePackagingIntoBusinessSettings } from '@/lib/utils/businessPackagingSettings';

/**
 * Nav keys always hidden for milk-shop (aliases resolve via isMilkShopStore).
 * Keep Daily Route (route-hisab), POS, inventory, finance, storefront, reports plan-gated as usual.
 */
export const MILK_SHOP_HIDDEN_NAV_KEYS = Object.freeze([
  'restaurant',
  'kds',
  'memberships',
  'loyalty',
  'crm',
  'campaigns',
  'promotions',
  'warehouses',
  'manufacturing',
  'bom',
  'serials',
  'payroll',
  'attendance',
  'shifts',
  'approvals',
]);

const HIDDEN = new Set(MILK_SHOP_HIDDEN_NAV_KEYS);

/**
 * @param {string | null | undefined} category
 */
export function isMilkShopHubCategory(category) {
  return isMilkShopStore(category) || resolveDomainKey(category) === 'milk-shop';
}

/**
 * @param {string} navKey
 * @param {string | null | undefined} category
 * @returns {boolean} true when the item may appear (still subject to plan/RBAC)
 */
export function isMilkShopHubNavAllowed(navKey, category) {
  if (!isMilkShopHubCategory(category)) return true;
  return !HIDDEN.has(String(navKey || ''));
}

/**
 * Runtime lean packaging for milk-shop: strip clutter features, keep owner true overrides.
 * @param {unknown} settings
 * @param {string | null | undefined} category
 */
export function mergeMilkShopLeanNavSettings(settings, category) {
  if (!isMilkShopHubCategory(category)) return settings;
  const strip = getMilkShopLeanFeatureStrip();
  const existing = getPackagingFromSettings(settings)?.feature_overrides || {};
  const { nextSettings } = mergePackagingIntoBusinessSettings(
    settings && typeof settings === 'object' ? /** @type {Record<string, unknown>} */ (settings) : {},
    {
      mode: 'custom',
      featureOverrides: {
        ...strip,
        ...existing,
      },
    }
  );
  return nextSettings;
}

/**
 * Expected milk-shop hub capabilities by plan tier (domain-relevant only).
 * Used by verify scripts — not a second runtime gate.
 *
 * @typedef {'core' | 'starter' | 'professional' | 'business' | 'enterprise'} MilkShopPlanBand
 *
 * @type {Record<MilkShopPlanBand, { visible: string[], lockedOrHidden: string[] }>}
 */
export const MILK_SHOP_PLAN_NAV_MATRIX = Object.freeze({
  core: {
    visible: [
      'dashboard',
      'invoices',
      'customers',
      'route-hisab',
      'inventory',
      'purchases',
      'vendors',
      'orders',
      'view-storefront',
      'store-settings',
      'settings',
    ],
    lockedOrHidden: ['pos', 'batches', 'loyalty', 'payroll', 'campaigns', 'restaurant'],
  },
  starter: {
    visible: [
      'dashboard',
      'invoices',
      'customers',
      'route-hisab',
      'pos',
      'refunds',
      'inventory',
      'purchases',
      'vendors',
      'orders',
      'finance',
      'payments',
      'gst',
      'view-storefront',
      'store-settings',
      'settings',
    ],
    lockedOrHidden: ['batches', 'loyalty', 'payroll', 'campaigns', 'restaurant', 'memberships', 'warehouses'],
  },
  professional: {
    visible: [
      'dashboard',
      'invoices',
      'customers',
      'route-hisab',
      'pos',
      'refunds',
      'inventory',
      'batches',
      'purchases',
      'vendors',
      'orders',
      'sales',
      'finance',
      'payments',
      'gst',
      'reports',
      'view-storefront',
      'store-settings',
      'settings',
    ],
    lockedOrHidden: ['loyalty', 'payroll', 'campaigns', 'restaurant', 'memberships', 'warehouses', 'manufacturing'],
  },
  business: {
    visible: [
      'dashboard',
      'invoices',
      'customers',
      'route-hisab',
      'pos',
      'refunds',
      'inventory',
      'batches',
      'purchases',
      'vendors',
      'orders',
      'sales',
      'finance',
      'payments',
      'gst',
      'reports',
      'view-storefront',
      'store-settings',
      'settings',
    ],
    lockedOrHidden: ['loyalty', 'payroll', 'campaigns', 'restaurant', 'memberships', 'warehouses'],
  },
  enterprise: {
    visible: [
      'dashboard',
      'invoices',
      'customers',
      'route-hisab',
      'pos',
      'refunds',
      'inventory',
      'batches',
      'purchases',
      'vendors',
      'orders',
      'sales',
      'finance',
      'payments',
      'gst',
      'reports',
      'view-storefront',
      'store-settings',
      'settings',
    ],
    lockedOrHidden: ['loyalty', 'payroll', 'campaigns', 'restaurant', 'memberships', 'warehouses', 'manufacturing'],
  },
});
