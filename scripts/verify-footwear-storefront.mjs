#!/usr/bin/env node
/**
 * Sanity-check footwear elevated storefront + seed catalog.
 */
import { resolveDomainKey } from '../lib/config/domainKeyAliases.js';
import { getBrandCategoryForDomain } from '../lib/regionalMarket/domainBrandMap.js';
import { getBrandsForMarket } from '../lib/regionalMarket/index.js';
import { hasRichCatalog } from '../lib/dataLab/richProductCatalog.js';
import { FOOTWEAR_SEED_PRODUCTS } from '../lib/dataLab/footwearDemoCatalog.js';
import { isFashionEditorialStore } from '../lib/storefront/fashionEditorial.js';
import {
  buildFootwearFinderHref,
  getFootwearConfig,
  getFootwearHeroSlides,
  isFootwearElevatedStore,
  partitionFootwearProducts,
  resolveFootwearBrandWall,
  resolveFootwearShowcaseProducts,
  enrichFootwearProductsWithSeedImages,
  resolveFootwearTrustPillars,
  resolveFootwearGenderTiles,
  resolveFootwearQuickSearchTerms,
  resolveFootwearBrandGrid,
  resolveFootwearThreeUp,
  FOOTWEAR_BRAND_YELLOW,
} from '../lib/storefront/footwearStorefront.js';
import { buildQuickSearchTerms } from '../lib/storefront/elevatedStorefrontTenant.js';
import { isLuxuryFashionStore } from '../lib/storefront/luxuryFashion.js';
import { getStoreAccentColor } from '../lib/config/storefrontDomains.js';

const errors = [];

if (resolveDomainKey('footwear') !== 'leather-footwear' || resolveDomainKey('shoes') !== 'leather-footwear') {
  errors.push('footwear aliases should resolve to leather-footwear');
}
if (!isFootwearElevatedStore('leather-footwear') || !isFootwearElevatedStore('sneakers')) {
  errors.push('leather-footwear should be elevated');
}
if (isFootwearElevatedStore('boutique-fashion')) {
  errors.push('boutique-fashion must not resolve as footwear elevated');
}
if (isFashionEditorialStore('leather-footwear')) {
  errors.push('leather-footwear must not use fashion editorial');
}
if (getBrandCategoryForDomain('leather-footwear') !== 'footwear') {
  errors.push('leather-footwear brand category should be footwear');
}

const pkBrands = getBrandsForMarket('PK', 'leather-footwear');
if (!pkBrands.includes('Nike') || !pkBrands.includes('Bata Pakistan')) {
  errors.push('PK footwear brands should include Nike and Bata Pakistan');
}

if (!hasRichCatalog('leather-footwear')) {
  errors.push('leather-footwear should have rich catalog');
}
if (!Array.isArray(FOOTWEAR_SEED_PRODUCTS) || FOOTWEAR_SEED_PRODUCTS.length < 40) {
  errors.push(`expected 40+ seed products, got ${FOOTWEAR_SEED_PRODUCTS?.length || 0}`);
}

const requiredKeys = ['articlenumber', 'size', 'color', 'sourcing', 'brand'];
for (const p of FOOTWEAR_SEED_PRODUCTS) {
  if (!p.sku || !p.name || !p.category || !p.image_url) {
    errors.push(`seed product missing core fields: ${p.sku || p.name}`);
    break;
  }
  const dd = p.domain_data || {};
  if (!dd.sourcing || !['local', 'imported'].includes(dd.sourcing)) {
    errors.push(`invalid sourcing on ${p.sku}`);
    break;
  }
  if (/^(excellent|premium|very good|brand new|store return)/i.test(String(dd.color || ''))) {
    errors.push(`condition grade leaked into color on ${p.sku}: ${dd.color}`);
    break;
  }
  if (!dd.condition) {
    errors.push(`missing condition on ${p.sku}`);
    break;
  }
  for (const key of requiredKeys) {
    if (dd[key] == null || dd[key] === '') {
      if (key === 'brand' && p.brand) continue;
      errors.push(`missing domain_data.${key} on ${p.sku}`);
    }
  }
}

const liveCfg = getFootwearConfig({}, 'acme-shoes');
if (liveCfg.showTrustStrip !== true || liveCfg.showJustForYou !== true || liveCfg.showBrandGrid !== true) {
  errors.push('FL homepage modules should default on');
}
if (liveCfg.showTestimonials === true) {
  errors.push('live tenants should not force testimonials on');
}

const demoCfg = getFootwearConfig({}, 'demo-footwear');
if (demoCfg.showSaleHero !== true || demoCfg.showThreeUp !== true) {
  errors.push('demo-footwear should enable sale hero and three-up');
}

if (isLuxuryFashionStore('leather-footwear')) {
  errors.push('leather-footwear must not use luxury fashion chrome');
}
if (getStoreAccentColor({}, 'leather-footwear') !== FOOTWEAR_BRAND_YELLOW) {
  errors.push(`footwear accent should default to ${FOOTWEAR_BRAND_YELLOW}`);
}

const href = buildFootwearFinderHref('/store/demo-footwear', { gender: 'men', size: '42', brand: 'Nike' });
if (!href.includes('gender=men') || !href.includes('size=42') || !href.includes('brand=Nike')) {
  errors.push(`finder href unexpected: ${href}`);
}
if (/search=Nike|search=men/i.test(href)) {
  errors.push('finder href should not pack structured filters into search');
}

const slides = getFootwearHeroSlides('/store/demo-footwear', {}, {
  storeName: 'Tenvo Footwear Demo',
  businessDomain: 'demo-footwear',
  products: FOOTWEAR_SEED_PRODUCTS.slice(0, 8).map((p, i) => ({ ...p, id: `seed-${i}` })),
});
if (!Array.isArray(slides) || slides.length < 1) {
  errors.push('hero slides should resolve for demo');
}

const { topPicks, deals, sports, newArrivals } = partitionFootwearProducts(
  FOOTWEAR_SEED_PRODUCTS.map((p, i) => ({ ...p, id: `p-${i}`, stock: 10 }))
);
if (!topPicks.length) errors.push('partition should yield top picks');
if (!deals.length && !newArrivals.length) errors.push('partition should yield deals or new arrivals');
if (!sports.length) errors.push('partition should yield sports products');

const trust = resolveFootwearTrustPillars({}, 'demo-footwear');
if (trust.length < 3) errors.push('demo trust pillars should resolve');

const tiles = resolveFootwearGenderTiles({}, '/store/demo-footwear', {
  businessDomain: 'demo-footwear',
  products: FOOTWEAR_SEED_PRODUCTS.map((p, i) => ({ ...p, id: `p-${i}` })),
});
if (tiles.length < 3) errors.push('category tiles should resolve');

const brands = resolveFootwearBrandWall({}, '/store/demo-footwear', {
  businessDomain: 'demo-footwear',
  products: FOOTWEAR_SEED_PRODUCTS.map((p, i) => ({ ...p, id: `p-${i}` })),
});
if (brands.length < 4) errors.push('brand wall should resolve');

const brandGrid = resolveFootwearBrandGrid({}, '/store/demo-footwear', {
  businessDomain: 'demo-footwear',
  products: FOOTWEAR_SEED_PRODUCTS.map((p, i) => ({ ...p, id: `p-${i}` })),
});
if (brandGrid.length < 4) errors.push('brand grid should resolve 4+ tiles');

const threeUp = resolveFootwearThreeUp({}, '/store/demo-footwear', { businessDomain: 'demo-footwear' });
if (threeUp.length < 3) errors.push('three-up editorial tiles should resolve');
if (!threeUp.every((t) => t.image && t.href && t.title)) {
  errors.push('three-up tiles need image, href, and title');
}

const quickTerms = resolveFootwearQuickSearchTerms(
  {},
  FOOTWEAR_SEED_PRODUCTS.map((p, i) => ({ ...p, id: `p-${i}` })),
  FOOTWEAR_SEED_PRODUCTS.slice(0, 4).map((p, i) => ({ id: `c-${i}`, name: p.category })),
  'demo-footwear'
);
if (!Array.isArray(quickTerms) || quickTerms.length < 1) {
  errors.push('quick search terms should resolve without throwing');
}
try {
  buildQuickSearchTerms(FOOTWEAR_SEED_PRODUCTS, { not: 'array' }, null, 6);
} catch (e) {
  errors.push(`buildQuickSearchTerms must tolerate non-array categories: ${e.message}`);
}

const enriched = resolveFootwearShowcaseProducts(
  [{ id: '11111111-1111-4111-8111-111111111111', sku: FOOTWEAR_SEED_PRODUCTS[0]?.sku, name: FOOTWEAR_SEED_PRODUCTS[0]?.name, stock: 5 }],
  'demo-footwear'
);
if (!enriched[0]?.image_url) errors.push('showcase enrich should backfill missing image by SKU');

const preserved = enrichFootwearProductsWithSeedImages(
  [{ id: '22222222-2222-4222-8222-222222222222', sku: 'CUSTOM-1', image_url: 'https://example.supabase.co/storage/v1/object/public/products/custom.webp', stock: 2 }],
  'live-footwear'
);
if (preserved[0]?.image_url !== 'https://example.supabase.co/storage/v1/object/public/products/custom.webp') {
  errors.push('tenant uploaded image must not be replaced by seed enrich');
}

if (errors.length) {
  console.error('verify-footwear-storefront FAILED:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log(
  `verify-footwear-storefront OK (${FOOTWEAR_SEED_PRODUCTS.length} products, ${slides.length} slides, ${brandGrid.length} brands, ${threeUp.length} three-up)`
);
