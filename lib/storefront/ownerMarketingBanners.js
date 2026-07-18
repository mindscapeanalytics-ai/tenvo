/**
 * Resolve whether owner homepage marketing banners (`pageSections`) should render.
 * Defaults to true for all domains. Elevated verticals can hide them via
 * `settings.storefront.<vertical>.showMarketingBanners = false`.
 *
 * Placements themselves (`after-hero` | `mid-page` | `before-footer`) are always
 * available in MarketingSectionsEditor — this flag only gates public render.
 */
import { resolveDomainKey } from '../config/domainKeyAliases.js';

/** Canonical domain → settings.storefront key holding showMarketingBanners. */
const MARKETING_BANNER_SETTINGS_KEY = Object.freeze({
  'auto-parts': 'autoParts',
  'auto-workshop': 'autoParts',
  'marine-parts': 'marine',
  'vehicle-dealership': 'dealership',
  'auto-marketplace': 'marketplace',
  furniture: 'furniture',
  'restaurant-cafe': 'restaurant',
  pharmacy: 'pharmacy',
  'gym-fitness': 'fitness',
  supermarket: 'supermarket',
  'gems-jewellery': 'jewellery',
  'salon-spa': 'jewellery',
  'boutique-fashion': 'fashion',
  garments: 'fashion',
  'textile-wholesale': 'fashion',
  'leather-footwear': 'fashion',
});

/**
 * @param {string | null | undefined} category
 * @param {object} [settings] business settings (nested `storefront.*` or flat admin form)
 * @returns {boolean}
 */
export function resolveOwnerMarketingBannersEnabled(category, settings = {}) {
  const canonical = resolveDomainKey(category);
  const key = MARKETING_BANNER_SETTINGS_KEY[canonical];
  if (!key) return true;

  const nested = settings?.storefront?.[key];
  const flat = settings?.[key];
  const raw = (nested && typeof nested === 'object' ? nested : null)
    || (flat && typeof flat === 'object' ? flat : null)
    || {};
  return raw.showMarketingBanners !== false;
}
