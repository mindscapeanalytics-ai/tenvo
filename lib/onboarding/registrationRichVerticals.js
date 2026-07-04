/**
 * Verticals that ship a market-ready product catalog on registration (not data-lab only).
 * Other domains receive category shells from setupTemplate; owners add inventory in hub.
 */
import { resolveDomainKey } from '../config/domainKeyAliases.js';
import { hasRichCatalog } from '../dataLab/richProductCatalog.js';

/** @type {ReadonlySet<string>} */
export const REGISTRATION_RICH_CATALOG_VERTICALS = new Set([
  'vehicle-dealership',
  'auto-parts',
  'gym-fitness',
]);

/** Grocery / FMCG / supermarket-family verticals — Naheed–DSM archive catalog on signup. */
/** @type {ReadonlySet<string>} */
export const SUPERMARKET_REGISTRATION_VERTICALS = new Set([
  'supermarket',
  'fmcg',
  'dairy-farm',
  'poultry-farm',
  'livestock-cattle',
]);

/**
 * @param {string} domainKey
 */
export function isSupermarketRegistrationVertical(domainKey) {
  const canonical = resolveDomainKey(domainKey);
  return SUPERMARKET_REGISTRATION_VERTICALS.has(canonical);
}

/**
 * Pakistan clothing / textile verticals — local + imported starter catalog on registration.
 * @type {ReadonlySet<string>}
 */
export const PK_CLOTHING_REGISTRATION_VERTICALS = new Set([
  'garments',
  'boutique-fashion',
  'textile-wholesale',
  'textile-mill',
]);

/**
 * @param {string} domainKey
 * @param {string} [countryIso]
 */
export function shouldSeedRichCatalogOnRegistration(domainKey, countryIso = 'PK') {
  const canonical = resolveDomainKey(domainKey);
  const iso = String(countryIso || 'PK').trim().toUpperCase();
  if (REGISTRATION_RICH_CATALOG_VERTICALS.has(canonical) && hasRichCatalog(canonical)) {
    return true;
  }
  if (SUPERMARKET_REGISTRATION_VERTICALS.has(canonical) && hasRichCatalog(canonical)) {
    return true;
  }
  if (iso === 'PK' && PK_CLOTHING_REGISTRATION_VERTICALS.has(canonical) && hasRichCatalog(canonical)) {
    return true;
  }
  return false;
}
