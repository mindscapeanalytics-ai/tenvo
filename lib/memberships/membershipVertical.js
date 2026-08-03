import { resolveDomainKey } from '@/lib/config/domainKeyAliases';

/**
 * Canonical vertical keys that use the shared membership enrollment engine.
 * Aliases (salon, spa, beauty-salon, spa-wellness) resolve to salon-spa via domainKeyAliases.
 * sports-club / yoga-studio are reserved for future domain rows; they match only exact keys.
 *
 * To add a vertical: append the canonical key here, extend membershipProductDetection.js,
 * membershipIntelligence.js playbooks, and optionally settings.storefront.{vertical}.
 */
export const MEMBERSHIP_VERTICAL_KEYS = Object.freeze([
  'gym-fitness',
  'salon-spa',
  'dental-clinic',
  'hotel-guesthouse',
  'sports-club',
  'yoga-studio',
]);

const MEMBERSHIP_VERTICAL_SET = new Set(MEMBERSHIP_VERTICAL_KEYS);

/**
 * @param {string | null | undefined} category
 */
export function resolveMembershipVerticalKey(category) {
  const raw = String(category || '').trim().toLowerCase();
  if (!raw) return null;
  const key = resolveDomainKey(raw);
  if (MEMBERSHIP_VERTICAL_SET.has(key)) return key;
  // Exact reserved keys that are not (yet) domain aliases
  if (MEMBERSHIP_VERTICAL_SET.has(raw)) return raw;
  return null;
}

/**
 * @param {string | null | undefined} category
 */
export function isMembershipVertical(category) {
  return Boolean(resolveMembershipVerticalKey(category));
}

/**
 * Merge tenant settings with vertical defaults.
 * @param {{ category?: string; settings?: Record<string, unknown> | null }} business
 */
export function getMembershipConfig(business) {
  const verticalKey = resolveMembershipVerticalKey(business?.category);
  const raw =
    business?.settings &&
    typeof business.settings === 'object' &&
    !Array.isArray(business.settings)
      ? /** @type {Record<string, unknown>} */ (business.settings)
      : {};
  const storefront =
    raw.storefront && typeof raw.storefront === 'object' ? raw.storefront : {};
  const memberships =
    raw.memberships && typeof raw.memberships === 'object' ? raw.memberships : {};

  return {
    verticalKey,
    enabled: Boolean(verticalKey),
    renewalGraceDays: Number(memberships.renewalGraceDays ?? 7),
    autoPauseOnFailedPayment: memberships.autoPauseOnFailedPayment !== false,
    freezeMaxDays: Number(memberships.freezeMaxDays ?? 30),
    defaultAutoRenew: memberships.defaultAutoRenew !== false,
    storefront,
  };
}
