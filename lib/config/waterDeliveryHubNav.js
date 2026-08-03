/**
 * Water-delivery hub navigation — lean chrome for rider / bottled-water operators.
 * Mirrors milk-shop lean strip so restaurant / gym / warehouse chrome stays hidden.
 */

import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { getWaterDeliveryLeanFeatureStrip } from '@/lib/config/domainPackageFeatures';
import { isWaterDeliveryStore } from '@/lib/storefront/waterShopHisab';
import { getPackagingFromSettings } from '@/lib/subscription/effectivePlanAccess';
import { mergePackagingIntoBusinessSettings } from '@/lib/utils/businessPackagingSettings';

export const WATER_DELIVERY_HIDDEN_NAV_KEYS = Object.freeze([
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
  'pos',
  'storefront',
  'online_store',
  'financial_hub',
  'accounting',
  'general_ledger',
]);

const HIDDEN = new Set(WATER_DELIVERY_HIDDEN_NAV_KEYS);

/**
 * @param {string | null | undefined} category
 */
export function isWaterDeliveryHubCategory(category) {
  return isWaterDeliveryStore(category) || resolveDomainKey(category) === 'water-delivery';
}

/**
 * @param {string} navKey
 * @param {string | null | undefined} category
 */
export function isWaterDeliveryHubNavAllowed(navKey, category) {
  if (!isWaterDeliveryHubCategory(category)) return true;
  return !HIDDEN.has(String(navKey || ''));
}

/**
 * @param {unknown} settings
 * @param {string | null | undefined} category
 */
export function mergeWaterDeliveryLeanNavSettings(settings, category) {
  if (!isWaterDeliveryHubCategory(category)) return settings;
  const strip = getWaterDeliveryLeanFeatureStrip();
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
