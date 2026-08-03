#!/usr/bin/env node
/**
 * Sanity-check tyre elevated storefront + seed catalog.
 */
import { resolveDomainKey } from '../lib/config/domainKeyAliases.js';
import { getBrandCategoryForDomain } from '../lib/regionalMarket/domainBrandMap.js';
import { getBrandsForMarket } from '../lib/regionalMarket/index.js';
import { hasRichCatalog } from '../lib/dataLab/richProductCatalog.js';
import { TYRE_SEED_PRODUCTS } from '../lib/dataLab/tyreDemoCatalog.js';
import {
  buildTyreFinderHref,
  getTyreConfig,
  getTyreHeroSlides,
  isTyreElevatedStore,
  normalizeTyreVideoUrl,
  partitionTyreProducts,
  resolveTyreBrandWall,
  resolveTyreShowcaseProducts,
  enrichTyreProductsWithSeedImages,
  resolveTyreTrustPillars,
  resolveTyreVehicleTiles,
  resolveTyreExploreSegments,
  resolveTyreExplorePresentation,
  resolveTyreBrandStories,
  filterTyreExploreProducts,
  pickTyreExploreSegmentWithStock,
  TYRE_EXPLORE_SEGMENTS,
} from '../lib/storefront/tyreStorefront.js';

const errors = [];

if (resolveDomainKey('tyre') !== 'tyre-shop' || resolveDomainKey('tires') !== 'tyre-shop') {
  errors.push('tyre aliases should resolve to tyre-shop');
}
if (!isTyreElevatedStore('tyre-shop') || !isTyreElevatedStore('tyre')) {
  errors.push('tyre-shop should be elevated');
}
if (isTyreElevatedStore('auto-parts')) {
  errors.push('auto-parts must not resolve as tyre elevated');
}
if (getBrandCategoryForDomain('tyre-shop') !== 'tyres') {
  errors.push('tyre-shop brand category should be tyres');
}

const pkBrands = getBrandsForMarket('PK', 'tyre-shop');
if (!pkBrands.includes('GTR') || !pkBrands.includes('Michelin')) {
  errors.push('PK tyre brands should include GTR and Michelin');
}

if (!hasRichCatalog('tyre-shop')) {
  errors.push('tyre-shop should have rich catalog');
}
if (!Array.isArray(TYRE_SEED_PRODUCTS) || TYRE_SEED_PRODUCTS.length < 40) {
  errors.push(`expected 40+ seed products, got ${TYRE_SEED_PRODUCTS?.length || 0}`);
}

const requiredKeys = ['tyresize', 'sourcing', 'brand'];
for (const p of TYRE_SEED_PRODUCTS) {
  if (!p.sku || !p.name || !p.category || !p.image_url) {
    errors.push(`seed product missing core fields: ${p.sku || p.name}`);
    break;
  }
  const dd = p.domain_data || {};
  if (p.category !== 'Alloy Rims' && p.category !== 'Services (Fitting)') {
    if (!dd.tyresize) {
      errors.push(`missing tyresize on ${p.sku}`);
      break;
    }
  }
  if (!dd.sourcing || !['local', 'imported'].includes(dd.sourcing)) {
    errors.push(`invalid sourcing on ${p.sku}`);
    break;
  }
  for (const key of requiredKeys) {
    if (key === 'tyresize' && (p.category === 'Alloy Rims' || p.category === 'Services (Fitting)')) continue;
    if (dd[key] == null || dd[key] === '') {
      // brand may live on product.brand
      if (key === 'brand' && p.brand) continue;
      errors.push(`missing domain_data.${key} on ${p.sku}`);
      break;
    }
  }
}

if (normalizeTyreVideoUrl('javascript:alert(1)') !== '') {
  errors.push('normalize should reject javascript URLs');
}
if (normalizeTyreVideoUrl('https://cdn.example.com/tyre.mp4') !== 'https://cdn.example.com/tyre.mp4') {
  errors.push('normalize should accept https URLs');
}

const liveCfg = getTyreConfig({}, 'acme-tyres');
if (liveCfg.showTrustStrip !== true || liveCfg.showVehicleTiles !== true) {
  errors.push('trust strip and vehicle tiles should default on');
}
if (liveCfg.showTestimonials === true) {
  errors.push('live tenants should not force testimonials on');
}

const demoCfg = getTyreConfig({}, 'demo-tyre');
if (demoCfg.showTestimonials !== true) {
  errors.push('demo-tyre should show testimonials by default');
}

const href = buildTyreFinderHref('/store/demo-tyre', { width: '205', profile: '55', rim: '16' });
if (!href.includes('205%2F55R16') || !href.includes('width=205')) {
  errors.push(`finder href unexpected: ${href}`);
}

const slides = getTyreHeroSlides('/store/demo-tyre', {}, {
  storeName: 'Tenvo Tyre Store',
  businessDomain: 'demo-tyre',
  products: TYRE_SEED_PRODUCTS.slice(0, 8).map((p, i) => ({ ...p, id: `seed-${i}` })),
});
if (!Array.isArray(slides) || slides.length < 1) {
  errors.push('hero slides should resolve for demo');
}

const { topPicks, deals, alloy, services } = partitionTyreProducts(
  TYRE_SEED_PRODUCTS.map((p, i) => ({ ...p, id: `p-${i}`, stock: 10 }))
);
if (!topPicks.length) errors.push('partition should yield top picks');
if (!alloy.length) errors.push('partition should yield alloy products');
if (!services.length) errors.push('partition should yield services');

const trust = resolveTyreTrustPillars({}, 'demo-tyre');
if (trust.length !== 4) errors.push('demo trust pillars should be 4');

const tiles = resolveTyreVehicleTiles({}, '/store/demo-tyre', {
  businessDomain: 'demo-tyre',
  products: TYRE_SEED_PRODUCTS.map((p, i) => ({ ...p, id: `p-${i}` })),
});
if (tiles.length < 4) errors.push('vehicle tiles should resolve');

const brands = resolveTyreBrandWall({}, '/store/demo-tyre', {
  businessDomain: 'demo-tyre',
  products: TYRE_SEED_PRODUCTS.map((p, i) => ({ ...p, id: `p-${i}` })),
});
if (brands.length < 4) errors.push('brand wall should resolve');

const explore = resolveTyreExploreSegments({}, '/store/demo-tyre', {
  businessDomain: 'demo-tyre',
  products: TYRE_SEED_PRODUCTS.map((p, i) => ({ ...p, id: `p-${i}` })),
});
if (explore.length < 4) errors.push('explore segments should resolve');

const brandStories = resolveTyreBrandStories({}, TYRE_SEED_PRODUCTS, 'demo-tyre', 'tyre-shop', {
  storeName: 'Tenvo Tyre Store',
});
if (!brandStories.length) errors.push('brand stories should resolve for demo');

const enriched = resolveTyreShowcaseProducts(
  [{ id: '11111111-1111-4111-8111-111111111111', sku: 'TT-GTR-ECONO-1856515', name: 'GTR BG Econo', stock: 5 }],
  'demo-tyre'
);
if (!enriched[0]?.image_url) errors.push('showcase enrich should backfill missing image by SKU');

const preserved = enrichTyreProductsWithSeedImages(
  [{ id: '22222222-2222-4222-8222-222222222222', sku: 'CUSTOM-1', image_url: 'https://example.supabase.co/storage/v1/object/public/products/custom.webp', stock: 2 }],
  'live-tyre'
);
if (preserved[0]?.image_url !== 'https://example.supabase.co/storage/v1/object/public/products/custom.webp') {
  errors.push('tenant uploaded image must not be replaced by seed enrich');
}

const explorePool = TYRE_SEED_PRODUCTS.map((p, i) => ({
  ...p,
  id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  category_name: p.category,
  category_slug: String(p.category || '')
    .toLowerCase()
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-'),
  stock: 10,
}));
for (const seg of TYRE_EXPLORE_SEGMENTS) {
  const hits = filterTyreExploreProducts(explorePool, seg.slug);
  if (!hits.length) errors.push(`explore filter empty for ${seg.slug}`);
}
const picked = pickTyreExploreSegmentWithStock(TYRE_EXPLORE_SEGMENTS, explorePool);
if (!picked?.id) errors.push('pickTyreExploreSegmentWithStock should return a segment');

// silence unused
void deals;

if (errors.length) {
  console.error('verify-tyre-storefront FAILED:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log(
  `verify-tyre-storefront OK (${TYRE_SEED_PRODUCTS.length} products, ${slides.length} slides, ${brands.length} brands)`
);
