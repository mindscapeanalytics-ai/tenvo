/**
 * Country-aware market layer, brands, payments, tax compliance per country + vertical.
 * Pakistan is the MVP default; AE, US, CN are scale targets.
 */
import { getBrandCategoryForDomain } from './domainBrandMap.js';
import { getMarketProfile, SUPPORTED_MARKET_ISO } from './marketProfiles.js';
import { getPakistanBrands } from './brandCatalogs/pakistan.js';
import { getUaeBrands } from './brandCatalogs/uae.js';
import { getUnitedStatesBrands } from './brandCatalogs/unitedStates.js';
import { getChinaBrands } from './brandCatalogs/china.js';

const BRAND_RESOLVERS = {
  PK: getPakistanBrands,
  AE: getUaeBrands,
  US: getUnitedStatesBrands,
  CN: getChinaBrands,
  SA: getUaeBrands,
};

const MARKET_ISO_ALIASES = {
  PK: 'PK',
  PAKISTAN: 'PK',
  AE: 'AE',
  UAE: 'AE',
  'UNITED ARAB EMIRATES': 'AE',
  US: 'US',
  USA: 'US',
  'UNITED STATES': 'US',
  CN: 'CN',
  CHINA: 'CN',
  SA: 'SA',
  'SAUDI ARABIA': 'SA',
  GB: 'US',
  UK: 'US',
  CA: 'US',
  AU: 'US',
  IN: 'PK',
  DE: 'US',
  FR: 'US',
  NL: 'US',
  IE: 'US',
  ES: 'US',
  IT: 'US',
  AT: 'US',
  BE: 'US',
  CH: 'US',
  PT: 'US',
  PL: 'US',
  SE: 'US',
  NO: 'US',
  DK: 'US',
  FI: 'US',
};

/**
 * @param {string} [countryIso]
 * @returns {keyof typeof BRAND_RESOLVERS}
 */
export function resolveMarketCountryIso(countryIso) {
  const raw = String(countryIso || 'PK').trim().toUpperCase();
  if (raw in BRAND_RESOLVERS) return raw;
  const aliased = MARKET_ISO_ALIASES[raw];
  if (aliased && aliased in BRAND_RESOLVERS) return aliased;
  return 'PK';
}

/**
 * @param {string} countryIso
 * @param {string} domainKey
 * @param {string} [categoryOverride]
 * @returns {string[]}
 */
export function getBrandsForMarket(countryIso, domainKey, categoryOverride = null) {
  const marketIso = resolveMarketCountryIso(countryIso);
  const category = categoryOverride || getBrandCategoryForDomain(domainKey);
  const resolver = BRAND_RESOLVERS[marketIso] || getPakistanBrands;
  return dedupeBrands(resolver(category));
}

/**
 * Merge domain-specific popularBrands (when set) with market catalog.
 * @param {string} countryIso
 * @param {string} domainKey
 * @param {{ popularBrands?: string[] }} [domainOverrides]
 */
export function getBrandsForMarketWithOverrides(countryIso, domainKey, domainOverrides = {}) {
  const marketBrands = getBrandsForMarket(countryIso, domainKey);
  const popular = domainOverrides?.popularBrands;
  if (Array.isArray(popular) && popular.length > 0) {
    return dedupeBrands([...popular, ...marketBrands]);
  }
  return marketBrands;
}

/**
 * Market features for a domain, payments, tax, languages, seasons.
 * Preserves vertical-specific overrides (PSQCA, bottle cycle, delivery areas, etc.).
 * @param {string} countryIso
 * @param {string} domainKey
 * @param {{ popularBrands?: string[], seasonalPricing?: boolean, marketLocations?: string[], taxCompliance?: string[] }} [domainOverrides]
 */
export function getMarketFeatures(countryIso, domainKey, domainOverrides = {}) {
  const marketIso = resolveMarketCountryIso(countryIso);
  const profile = getMarketProfile(marketIso);
  const overrides =
    domainOverrides && typeof domainOverrides === 'object' ? domainOverrides : {};

  const domainTax = Array.isArray(overrides.taxCompliance) ? overrides.taxCompliance : [];
  const taxCompliance = dedupeStrings([...(profile.taxCompliance || []), ...domainTax]);

  /** Keys owned by the market profile merge (not re-spread as opaque extras). */
  const consumed = new Set([
    'paymentGateways',
    'taxCompliance',
    'languages',
    'seasonalPricing',
    'marketLocations',
    'popularBrands',
    'localBrands',
    'countryCode',
    'brandCategory',
    'launchTier',
  ]);

  /** @type {Record<string, unknown>} */
  const domainExtras = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (consumed.has(key) || value === undefined) continue;
    domainExtras[key] = value;
  }

  return {
    countryCode: marketIso,
    paymentGateways: profile.paymentGateways,
    taxCompliance,
    languages: profile.languages,
    seasonalPricing: overrides.seasonalPricing ?? profile.seasonalPricing,
    marketLocations:
      marketIso === 'PK' && Array.isArray(overrides.marketLocations)
        ? overrides.marketLocations
        : [],
    localBrands: true,
    popularBrands: getBrandsForMarketWithOverrides(marketIso, domainKey, overrides),
    brandCategory: getBrandCategoryForDomain(domainKey),
    launchTier: profile.launchTier,
    ...domainExtras,
  };
}

/** @param {string[]} values */
function dedupeStrings(values) {
  const seen = new Set();
  const out = [];
  for (const raw of values) {
    const key = String(raw || '').trim();
    if (!key || seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    out.push(key);
  }
  return out;
}

/** @param {string[]} brands */
function dedupeBrands(brands) {
  return dedupeStrings(brands);
}

/** Sample brand placeholders for product forms */
export function getBrandPlaceholderExamples(countryIso, domainKey) {
  const brands = getBrandsForMarket(countryIso, domainKey);
  if (brands.length >= 2) return `${brands[0]}, ${brands[1]}`;
  if (brands.length === 1) return brands[0];
  return 'Brand name';
}

export function listSupportedMarketCountries() {
  return [...SUPPORTED_MARKET_ISO];
}

export {
  getBrandCategoryForDomain,
  DOMAIN_BRAND_CATEGORY,
} from './domainBrandMap.js';
export { getMarketProfile, MARKET_PROFILES, SUPPORTED_MARKET_ISO } from './marketProfiles.js';
