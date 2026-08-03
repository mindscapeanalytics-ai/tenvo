/**
 * Gate + helpers for Route Hisab offline mode.
 */
import { planHasFeatureWithPackaging } from '@/lib/subscription/effectivePlanAccess';
import { isMilkHisabRelevant } from '@/lib/storefront/milkShopHisab';

/**
 * @param {{
 *   category?: string | null,
 *   planTier?: string | null,
 *   settings?: object | null,
 * }} args
 */
export function isMilkHisabOfflineEnabled({ category, planTier, settings } = {}) {
  if (!isMilkHisabRelevant(category)) return false;
  if (!planHasFeatureWithPackaging(planTier || 'free', 'offline_pos_mode', settings)) {
    return false;
  }
  // Default ON when plan allows; owner can set settings.milkHisab.offlineEnabled = false
  const flag = settings?.milkHisab?.offlineEnabled;
  return flag !== false;
}

/**
 * True when a failure looks like connectivity / transport, not business validation.
 * @param {unknown} err
 * @param {string} [message]
 */
export function isMilkHisabNetworkFailure(err, message = '') {
  const msg = String(message || (err && err.message) || err || '').toLowerCase();
  if (!msg) return false;
  return (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('load failed') ||
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('offline') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504')
  );
}
