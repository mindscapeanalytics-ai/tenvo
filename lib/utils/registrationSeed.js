/**
 * Country- and domain-aware registration seeding — templates, tax, brands.
 */
import { getDomainKnowledge } from '../domainKnowledge.js';
import { getRegionalStandards } from './regionalHelpers.ts';
import { getBrandsForMarket } from '../regionalMarket/index.js';

const KNOWN_PRODUCT_COLUMNS = new Set([
  'name', 'description', 'business_id', 'stock', 'price', 'cost_price',
  'tax_percent', 'sku', 'barcode', 'category', 'brand', 'unit',
  'min_stock_level', 'reorder_point', 'location', 'batch_number',
  'expiry_date', 'manufacturing_date', 'hsn_code', 'is_active', 'image_url',
]);

/**
 * @param {{ businessId: string, domainKey: string, countryIso: string }} params
 */
export function buildRegistrationSeedPayload({ businessId, domainKey, countryIso }) {
  const iso = String(countryIso || 'PK').trim().toUpperCase();
  const standards = getRegionalStandards(iso);
  const knowledge = getDomainKnowledge(domainKey, { countryIso: iso });
  const template = knowledge?.setupTemplate;

  if (!template) {
    return {
      items: [],
      categories: [],
      knowledge,
      standards,
      marketFeatures: knowledge?.marketFeatures || null,
    };
  }

  const rawItems = template.suggestedProducts || template.suggestedItems || [];
  const brands = getBrandsForMarket(iso, domainKey);
  const taxRate = knowledge.defaultTax ?? standards.defaultTaxRate ?? 0;

  const items = rawItems.map((item, index) => {
    const cleanItem = {
      business_id: businessId,
      name: item.name,
      category: item.category || 'General',
      unit: item.unit || knowledge.units?.[0] || 'pcs',
      price: item.defaultPrice ?? item.price ?? 0,
      stock: item.startingStock ?? item.stock ?? 0,
      tax_percent: taxRate,
      brand: item.brand || brands[index % Math.max(brands.length, 1)] || '',
      is_active: true,
      domain_data: {},
    };

    if (item.description) cleanItem.description = item.description;
    if (item.cost_price != null) cleanItem.cost_price = item.cost_price;
    if (item.sku) cleanItem.sku = item.sku;
    if (item.barcode) cleanItem.barcode = item.barcode;
    if (knowledge.defaultHSN && !item.hsn_code) cleanItem.hsn_code = knowledge.defaultHSN;

    Object.keys(item).forEach((key) => {
      if (KNOWN_PRODUCT_COLUMNS.has(key)) {
        if (item[key] !== undefined && cleanItem[key] === undefined) {
          cleanItem[key] = item[key];
        }
      } else if (!['defaultPrice', 'startingStock'].includes(key)) {
        cleanItem.domain_data[key] = item[key];
      }
    });

    return cleanItem;
  });

  return {
    items,
    categories: Array.isArray(template.categories) ? template.categories : [],
    knowledge,
    standards,
    marketFeatures: knowledge?.marketFeatures || knowledge?.pakistaniFeatures || null,
  };
}

/** @param {string} name */
export function slugifyCategoryName(name) {
  return (
    String(name || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'general'
  );
}

/**
 * @param {string} countryIso
 * @param {import('./regionalHelpers.ts').RegionalStandards} [regional]
 * @param {{ domainVertical?: string }} [extra]
 */
export function buildRegistrationSettingsSnapshot(countryIso, regional = null, extra = {}) {
  const r = regional || getRegionalStandards(countryIso);
  return {
    completed_via: 'register_wizard',
    country_iso: r.countryCode,
    country_name: r.countryName,
    tax_label: r.taxLabel,
    tax_id_label: r.taxIdLabel,
    default_tax_rate: r.defaultTaxRate,
    tax_strategy: r.taxStrategy,
    locale: r.locale,
    time_zone: r.timeZone,
    market_profile: r.countryCode,
    brand_catalog: r.countryCode,
    ...(extra.domainVertical ? { domain_vertical: extra.domainVertical } : {}),
  };
}

/** @param {string} countryIso @param {import('./regionalHelpers.ts').RegionalStandards} regional */
export function buildRegistrationFinancialsSnapshot(regional) {
  return {
    currency: regional.currency,
    currencySymbol: regional.currencySymbol,
    defaultTaxRate: regional.defaultTaxRate,
    taxLabel: regional.taxLabel,
    taxIdLabel: regional.taxIdLabel,
    taxStrategy: regional.taxStrategy,
    locale: regional.locale,
    timeZone: regional.timeZone,
  };
}
