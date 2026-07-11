/**
 * Vertical-aware packaging applied at registration so domain knowledge
 * (batch / multi-warehouse / manufacturing) is not blocked by starter plan defaults,
 * and suite packages do not force manufacturing onto pure traders (textile-wholesale).
 *
 * Zoho/Busy least privilege: only exact PLAN_FEATURE_TOGGLE_KEYS from the vertical
 * allow-list are written — never invent or pass through unknown feature keys.
 */

import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { PLAN_FEATURE_TOGGLE_KEYS } from '@/lib/config/plans';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { mergePackagingIntoBusinessSettings } from '@/lib/utils/businessPackagingSettings';

const ALLOWED_FEATURE_KEYS = new Set(PLAN_FEATURE_TOGGLE_KEYS);

/**
 * @param {Record<string, boolean>} overrides
 * @returns {Record<string, boolean>}
 */
function pickAllowedFeatureOverrides(overrides) {
  /** @type {Record<string, boolean>} */
  const next = {};
  for (const [key, value] of Object.entries(overrides || {})) {
    if (!ALLOWED_FEATURE_KEYS.has(key)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[registrationVerticalPackaging] unknown feature key ignored: ${key}`);
      }
      continue;
    }
    next[key] = Boolean(value);
  }
  return next;
}

/**
 * @param {string | null | undefined} domainKey
 * @returns {Record<string, boolean>}
 */
export function getRegistrationVerticalFeatureOverrides(domainKey) {
  const canonical = resolveDomainKey(domainKey);
  if (!canonical) return {};

  const knowledge = getDomainKnowledge(canonical);
  if (!knowledge) return {};

  /** @type {Record<string, boolean>} */
  const overrides = {};

  if (knowledge.batchTrackingEnabled) overrides.batch_tracking = true;
  if (knowledge.multiLocationEnabled) overrides.multi_warehouse = true;
  if (knowledge.serialTrackingEnabled) overrides.serial_tracking = true;

  if (knowledge.manufacturingEnabled === true) overrides.manufacturing = true;
  if (knowledge.manufacturingEnabled === false) overrides.manufacturing = false;

  // Jama Cloth traders: challans + price lists are day-one wholesale ops.
  if (canonical === 'textile-wholesale') {
    overrides.delivery_challans = true;
    overrides.price_lists = true;
  }

  return pickAllowedFeatureOverrides(overrides);
}

/**
 * Merge vertical feature overrides into a registration settings patch.
 * Preserves existing package packaging keys; vertical flags win on conflict.
 *
 * @param {Record<string, unknown> | null | undefined} settingsPatch
 * @param {string | null | undefined} domainKey
 * @returns {Record<string, unknown>}
 */
export function applyRegistrationVerticalPackaging(settingsPatch, domainKey) {
  const verticalOverrides = getRegistrationVerticalFeatureOverrides(domainKey);
  if (!Object.keys(verticalOverrides).length) {
    return settingsPatch && typeof settingsPatch === 'object' ? { ...settingsPatch } : {};
  }

  const prev =
    settingsPatch && typeof settingsPatch === 'object' && !Array.isArray(settingsPatch)
      ? { ...settingsPatch }
      : {};
  const prevOverrides =
    prev.packaging &&
    typeof prev.packaging === 'object' &&
    prev.packaging.feature_overrides &&
    typeof prev.packaging.feature_overrides === 'object'
      ? { ...prev.packaging.feature_overrides }
      : {};

  const { nextSettings } = mergePackagingIntoBusinessSettings(prev, {
    mode: 'custom',
    featureOverrides: {
      ...pickAllowedFeatureOverrides(prevOverrides),
      ...verticalOverrides,
    },
  });

  return nextSettings;
}
