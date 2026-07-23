#!/usr/bin/env node
/**
 * Sanity-check milk-shop vertical + Tenvo Milk Demo seed catalog.
 */
import { resolveDomainKey } from '../lib/config/domainKeyAliases.js';
import { resolveStorefrontVertical } from '../lib/config/storefrontDomains.js';
import { getBrandCategoryForDomain } from '../lib/regionalMarket/domainBrandMap.js';
import { getBrandsForMarket } from '../lib/regionalMarket/index.js';
import { getDomainKnowledge } from '../lib/domainKnowledge.js';
import { hasRichCatalog } from '../lib/dataLab/richProductCatalog.js';
import { resolvePosVariant } from '../lib/config/posDomains.js';
import {
  MILK_SHOP_SEED_PRODUCTS,
  MILK_SHOP_SEED_CATEGORIES,
} from '../lib/dataLab/milkShopDemoCatalog.js';
import {
  isMilkShopStore,
  MILK_SHOP_QUICK_SEARCH,
  MILK_SHOP_SIDEBAR_DEPARTMENTS,
  resolveMilkShopInventoryCategories,
  buildMilkShopHomeRailsFromInventory,
  buildMilkShopBrandRowsFromProducts,
} from '../lib/storefront/milkShopStorefront.js';
import {
  resolveSupermarketCategoryIcons,
  resolveSupermarketBrands,
  resolveSupermarketHomeRails,
  resolveSupermarketQuickSearchTerms,
  resolveSupermarketSidebarDepartments,
} from '../lib/storefront/supermarketStorefront.js';
import {
  isStorefrontWeightUnit,
  allowsFractionalStorefrontQty,
  normalizeStorefrontQty,
} from '../lib/storefront/storefrontWeightQty.js';
import { shouldSeedRichCatalogOnRegistration } from '../lib/onboarding/registrationRichVerticals.js';

const errors = [];

if (resolveDomainKey('milk') !== 'milk-shop' || resolveDomainKey('doodh-shop') !== 'milk-shop') {
  errors.push('milk aliases should resolve to milk-shop');
}
if (resolveDomainKey('dairy-farm') === 'milk-shop') {
  errors.push('dairy-farm must NOT alias to milk-shop');
}
if (!isMilkShopStore('milk-shop') || !isMilkShopStore('milk')) {
  errors.push('isMilkShopStore should accept milk-shop aliases');
}
if (isMilkShopStore('dairy-farm') || isMilkShopStore('supermarket')) {
  errors.push('dairy-farm / supermarket must not resolve as milk-shop');
}
if (resolveStorefrontVertical('milk-shop') !== 'supermarket') {
  errors.push('milk-shop storefront vertical should be supermarket');
}

const knowledge = getDomainKnowledge('milk-shop');
if (!knowledge || knowledge.units?.[0] !== 'kg') {
  errors.push('milk-shop units[0] must be kg');
}
if (!knowledge.setupTemplate?.categories?.includes('Fresh Milk')) {
  errors.push('milk-shop setupTemplate must include Fresh Milk');
}
const farm = getDomainKnowledge('dairy-farm');
if (!farm?.fieldConfig?.animalid && !farm?.productFields?.some((f) => /animal/i.test(f))) {
  errors.push('dairy-farm knowledge must remain livestock (Animal ID)');
}

if (getBrandCategoryForDomain('milk-shop') !== 'dairy') {
  errors.push('milk-shop brand category should be dairy');
}
const pkBrands = getBrandsForMarket('PK', 'milk-shop');
if (!Array.isArray(pkBrands) || pkBrands.length < 5) {
  errors.push('PK dairy brand pack should have brands');
}

if (!hasRichCatalog('milk-shop')) {
  errors.push('milk-shop should have rich catalog');
}
if (!shouldSeedRichCatalogOnRegistration('milk-shop', 'PK')) {
  errors.push('milk-shop should seed rich catalog on PK registration');
}
if (resolvePosVariant('milk-shop') !== 'superstore') {
  errors.push('milk-shop POS should be superstore');
}

if (MILK_SHOP_SEED_PRODUCTS.length < 30) {
  errors.push(`seed catalog too small: ${MILK_SHOP_SEED_PRODUCTS.length}`);
}
const cats = new Set(MILK_SHOP_SEED_PRODUCTS.map((p) => p.category));
for (const required of MILK_SHOP_SEED_CATEGORIES) {
  if (!cats.has(required)) errors.push(`seed missing category: ${required}`);
}
const kgFresh = MILK_SHOP_SEED_PRODUCTS.filter(
  (p) => p.category === 'Fresh Milk' && p.unit === 'kg'
);
if (kgFresh.length < 2) {
  errors.push('need at least 2 Fresh Milk kg SKUs');
}
if (MILK_SHOP_SEED_PRODUCTS.some((p) => /animal id|lactation/i.test(JSON.stringify(p)))) {
  errors.push('seed must not include livestock fields');
}

if (!MILK_SHOP_QUICK_SEARCH.length || MILK_SHOP_SIDEBAR_DEPARTMENTS.length < 5) {
  errors.push('milk shop chrome defaults incomplete');
}

// Inventory-first chrome: live categories/products beat static fallbacks
{
  const sampleProducts = MILK_SHOP_SEED_PRODUCTS.slice(0, 20).map((p, i) => ({
    ...p,
    id: `uuid-${i}`,
    category_name: p.category,
    category_slug: p.category,
  }));
  const inventoryCats = resolveMilkShopInventoryCategories([], sampleProducts);
  if (inventoryCats.length < 5) {
    errors.push('inventory categories should derive from product.category');
  }
  const rails = resolveSupermarketHomeRails({}, 'milk-shop', {
    products: sampleProducts,
    categories: [],
  });
  if (!rails.length || !rails.every((r) => r.categorySlug)) {
    errors.push('milk home rails should come from inventory categories');
  }
  const icons = resolveSupermarketCategoryIcons({}, '/store/demo-milk', {
    businessCategory: 'milk-shop',
    products: sampleProducts,
    categories: [],
  });
  if (!icons.some((i) => /Fresh Milk|Yogurt/i.test(i.label || i.slug || ''))) {
    errors.push('category icons should reflect inventory');
  }
  const brands = resolveSupermarketBrands({}, '/store/demo-milk', {
    businessCategory: 'milk-shop',
    products: sampleProducts,
  });
  if (!brands.some((b) => /Olper|Nurpur|Dayfresh|Prema|Nestlé|Pakola|Haleeb|Anhaar|Milkland/i.test(b.label))) {
    errors.push('brands should come from inventory product.brand');
  }
  const quick = resolveSupermarketQuickSearchTerms({}, sampleProducts, inventoryCats, 'demo-milk', 'milk-shop');
  if (!quick.length) errors.push('quick search should build from inventory');
  const sidebar = resolveSupermarketSidebarDepartments({}, '/store/demo-milk', {
    businessCategory: 'milk-shop',
    products: sampleProducts,
    categories: [],
  });
  if (sidebar.length < 5) errors.push('sidebar should use inventory categories');
  const fromBuilder = buildMilkShopHomeRailsFromInventory(inventoryCats, sampleProducts);
  if (fromBuilder.length < 4) errors.push('buildMilkShopHomeRailsFromInventory too sparse');
  if (buildMilkShopBrandRowsFromProducts(sampleProducts).length < 1) {
    errors.push('brand rows should extract packaged dairy brands');
  }
}

if (!isStorefrontWeightUnit('kg') || allowsFractionalStorefrontQty({ unit: 'pcs' })) {
  errors.push('weight qty helpers misconfigured');
}
if (normalizeStorefrontQty(1.55, { unit: 'kg' }) !== 1.55) {
  errors.push('kg qty should keep two-decimal precision');
}
if (normalizeStorefrontQty(1.7, { unit: 'pcs' }) !== 1) {
  errors.push('pcs qty should floor to integer');
}

if (errors.length) {
  console.error('verify-milk-shop-storefront FAILED:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log(
  `verify-milk-shop-storefront OK (${MILK_SHOP_SEED_PRODUCTS.length} SKUs, ${cats.size} categories)`
);
