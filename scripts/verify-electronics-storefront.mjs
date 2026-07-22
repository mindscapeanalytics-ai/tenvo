#!/usr/bin/env node
/**
 * Sanity-check electronics elevated storefront + seed catalog.
 */
import { resolveDomainKey } from '../lib/config/domainKeyAliases.js';
import { hasRichCatalog } from '../lib/dataLab/richProductCatalog.js';
import {
  ELECTRONICS_SEED_PRODUCTS,
  ELECTRONICS_SEED_CATEGORIES,
  ELECTRONICS_MARKETING_HERO_IMAGE,
} from '../lib/dataLab/electronicsDemoCatalog.js';
import {
  buildDefaultElectronicsStorefrontSeed,
  getElectronicsConfig,
  getElectronicsHeroSlides,
  isElectronicsElevatedStore,
  partitionElectronicsProducts,
  resolveElectronicsBrandWall,
  resolveElectronicsCategoryTiles,
  resolveElectronicsShowcaseProducts,
  resolveElectronicsTrustPillars,
  ELECTRONICS_ACCENTS,
} from '../lib/storefront/electronicsStorefront.js';
import { HERO_EXCLUDED_DEMO_DOMAINS } from '../lib/marketing/demoStoreGalleryMeta.js';
import { STOREFRONT_CONTACT_SUBJECTS } from '../lib/dashboard/domainOperationsSubjects.js';

const errors = [];

if (resolveDomainKey('electronics') !== 'electronics-goods') {
  errors.push('electronics alias should resolve to electronics-goods');
}
if (!isElectronicsElevatedStore('electronics-goods') || !isElectronicsElevatedStore('electronics')) {
  errors.push('electronics-goods should be elevated');
}
if (isElectronicsElevatedStore('mobile') || isElectronicsElevatedStore('tyre-shop')) {
  errors.push('mobile/tyre must not resolve as electronics elevated');
}

if (!hasRichCatalog('electronics-goods')) {
  errors.push('electronics-goods should have rich catalog');
}
if (!Array.isArray(ELECTRONICS_SEED_PRODUCTS) || ELECTRONICS_SEED_PRODUCTS.length < 17) {
  errors.push(`expected 17+ seed products, got ${ELECTRONICS_SEED_PRODUCTS?.length || 0}`);
}
if (!ELECTRONICS_SEED_CATEGORIES.includes('Air Conditioners')) {
  errors.push('seed categories should include Air Conditioners');
}
if (!ELECTRONICS_MARKETING_HERO_IMAGE) {
  errors.push('marketing hero image missing');
}

for (const p of ELECTRONICS_SEED_PRODUCTS) {
  if (!p.sku || !p.name || !p.category || !p.image_url || p.price == null) {
    errors.push(`seed product missing core fields: ${p.sku || p.name}`);
    break;
  }
  const dd = p.domain_data || {};
  if (!dd.warranty) {
    errors.push(`missing warranty on ${p.sku}`);
    break;
  }
  if (/motorcycle/i.test(String(p.category))) {
    errors.push(`motorcycle SKU not allowed in v1: ${p.sku}`);
  }
}

const liveCfg = getElectronicsConfig({}, 'acme-electronics');
if (liveCfg.showTrustStrip !== true || liveCfg.showInstallmentCta !== true) {
  errors.push('trust strip and installment CTA should default on');
}
if (liveCfg.showDealsRail !== true || liveCfg.showVisitCta !== true) {
  errors.push('deals rail and visit CTA should default on');
}

const demoCfg = getElectronicsConfig({}, 'demo-electronics');
if (demoCfg.defaultLocation !== 'Karachi') {
  errors.push('demo default location should be Karachi');
}

const seed = buildDefaultElectronicsStorefrontSeed('electronics-goods');
if (!seed.electronics?.showCategoryTiles) {
  errors.push('registration seed should enable category tiles');
}
if (!seed.electronics?.showDealsRail || !seed.electronics?.showVisitCta) {
  errors.push('registration seed should enable deals rail and visit CTA');
}
if (Object.keys(buildDefaultElectronicsStorefrontSeed('mobile')).length) {
  errors.push('mobile should not get electronics storefront seed');
}

const slides = getElectronicsHeroSlides('/store/demo-electronics', {}, {
  storeName: 'Tenvo Electronics',
  businessDomain: 'demo-electronics',
});
if (!Array.isArray(slides) || slides.length < 1) {
  errors.push('hero slides should resolve for demo');
}

const trust = resolveElectronicsTrustPillars({}, 'demo-electronics');
if (trust.length < 3) errors.push('trust pillars expected');

const tiles = resolveElectronicsCategoryTiles({}, '/store/demo-electronics', {
  businessDomain: 'demo-electronics',
  products: ELECTRONICS_SEED_PRODUCTS,
  businessCategory: 'electronics-goods',
});
if (tiles.length < 4) errors.push('category tiles expected');

const brands = resolveElectronicsBrandWall({}, '/store/demo-electronics', {
  businessDomain: 'demo-electronics',
  products: ELECTRONICS_SEED_PRODUCTS,
});
if (!brands.some((b) => /YOLO|PEL/i.test(b.label))) {
  errors.push('brand wall should include YOLO or PEL from seed');
}

const { topPicks, deals, gadgets, appliances } = partitionElectronicsProducts(ELECTRONICS_SEED_PRODUCTS);
if (!topPicks.length || !gadgets.length) {
  errors.push('partition should yield top picks and gadgets');
}
if (!appliances.length) {
  errors.push('partition should yield appliances (PEL AC)');
}
if (!deals.length) {
  errors.push('partition should yield deals (compare_price SKUs)');
}
if (!ELECTRONICS_SEED_PRODUCTS.some((p) => /Refrigerator|LED TV|Washing/i.test(String(p.category)))) {
  errors.push('seed should include appliance categories beyond AC/gadgets');
}

const fakeUuid = '11111111-1111-4111-8111-111111111111';
const showcase = resolveElectronicsShowcaseProducts(
  ELECTRONICS_SEED_PRODUCTS.map((p, i) => ({ ...p, id: i === 0 ? fakeUuid : `sku-${i}` })),
  'demo-electronics'
);
if (showcase.length !== 1 || showcase[0].id !== fakeUuid) {
  errors.push('showcase must keep UUID rows only');
}

if (HERO_EXCLUDED_DEMO_DOMAINS.has('demo-electronics')) {
  errors.push('demo-electronics should not be hero-excluded after elevated polish');
}

if (!STOREFRONT_CONTACT_SUBJECTS.includes('installment')) {
  errors.push('installment contact subject missing');
}

if (ELECTRONICS_ACCENTS.accent !== '#2563eb') {
  errors.push('electronics accent should be electric blue');
}

if (errors.length) {
  console.error('verify:electronics-storefront FAILED');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log(
  `verify:electronics-storefront OK (${ELECTRONICS_SEED_PRODUCTS.length} SKUs, ${slides.length} hero slides)`
);
