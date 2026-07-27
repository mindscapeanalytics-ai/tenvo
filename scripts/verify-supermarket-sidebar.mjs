#!/usr/bin/env node
/**
 * Verify supermarket public DEPARTMENTS sidebar resolves nested demo tree + inventory.
 * Avoids importing supermarketDemoCatalog (circular with richProductCatalog).
 */
import {
  SUPERMARKET_SIDEBAR_DEPARTMENTS,
} from '../lib/storefront/supermarketCatalogDefaults.js';
import {
  resolveSupermarketSidebarDepartments,
  buildSupermarketSidebarFromCategoryTree,
  collectSupermarketInventoryCategoryTokens,
  getSupermarketConfig,
  isSupermarketElevatedStore,
} from '../lib/storefront/supermarketStorefront.js';

const errors = [];

if (!isSupermarketElevatedStore('supermarket') || !isSupermarketElevatedStore('grocery')) {
  errors.push('supermarket / grocery should be elevated supermarket stores');
}

/** Minimal inventory mirror of demo-supermarket seed categories. */
const SEED_CATEGORY_NAMES = [
  'Beverages',
  'Personal Care',
  'Food Staples',
  'Fresh Produce',
  'Snacks',
  'Electronics',
  'Kids & Babies',
  'Toys',
  'Stationery',
  'Dairy',
  'Cooking Oil',
  'Household',
  'Frozen',
];

const seedCats = SEED_CATEGORY_NAMES.map((name) => ({
  id: name,
  name,
  slug: String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''),
  parent_id: null,
}));

const products = seedCats.map((c, i) => ({
  id: `p${i}`,
  name: `Sample ${c.name}`,
  category: c.name,
  category_name: c.name,
  category_slug: c.slug,
}));

const demoSettings = {
  storefront: {
    supermarket: {
      sidebarDepartments: SUPERMARKET_SIDEBAR_DEPARTMENTS.map((item) => ({
        ...item,
        children: item.children?.map((child) => ({ ...child })),
      })),
    },
  },
};

// Flat inventory must NOT replace nested DEPARTMENTS defaults.
const fromFlat = resolveSupermarketSidebarDepartments({}, '/store/demo-supermarket', {
  businessCategory: 'supermarket',
  businessDomain: 'demo-supermarket',
  categories: seedCats,
  products,
});

const fresh = fromFlat.find((d) => /fresh/i.test(d.label));
if (!fresh?.children?.length) {
  errors.push('default sidebar should keep nested Fresh Products children even when inventory is flat');
}
if (!fromFlat.some((d) => d.label === 'Beverages' || d.slug === 'beverages')) {
  errors.push('sidebar should include Beverages from curated tree / inventory');
}
if (!fromFlat.some((d) => d.hrefSuffix?.includes('onSale') || /deals/i.test(d.label))) {
  errors.push('sidebar should include Deals & Offers');
}

const kids = fromFlat.find((d) => /kids/i.test(d.label));
if (kids && kids.slug !== 'kids-babies') {
  errors.push(`Kids & Babies should resolve to kids-babies slug, got ${kids.slug}`);
}

const cookingOil = fromFlat
  .flatMap((d) => [d, ...(d.children || [])])
  .find((d) => /cooking oil/i.test(d.label));
if (cookingOil && cookingOil.slug !== 'cooking-oil') {
  errors.push(`Cooking Oil child should link to cooking-oil category, got ${cookingOil.slug || cookingOil.hrefSuffix}`);
}

if (!fromFlat.some((d) => d.slug === 'toys')) {
  errors.push('sidebar should include Toys from defaults / inventory');
}

const seeded = resolveSupermarketSidebarDepartments(
  demoSettings,
  '/store/demo-supermarket',
  {
    businessCategory: 'supermarket',
    businessDomain: 'demo-supermarket',
    categories: seedCats,
    products,
  }
);
if (seeded.length < SUPERMARKET_SIDEBAR_DEPARTMENTS.length - 2) {
  errors.push('demo storefront seed should resolve a full departments tree');
}
if (!seeded.some((d) => d.children?.length)) {
  errors.push('demo seeded sidebar must keep expandable department groups');
}

const treeCats = [
  { id: '1', name: 'Fresh Products', slug: 'fresh-products', parent_id: null },
  { id: '2', name: 'Fruits', slug: 'fruits', parent_id: '1' },
  { id: '3', name: 'Vegetables', slug: 'vegetables', parent_id: '1' },
  { id: '4', name: 'Beverages', slug: 'beverages', parent_id: null },
];
const fromTree = buildSupermarketSidebarFromCategoryTree(treeCats);
if (fromTree.length !== 2 || fromTree[0].children?.length !== 2) {
  errors.push('buildSupermarketSidebarFromCategoryTree should nest by parent_id');
}

const tokens = collectSupermarketInventoryCategoryTokens(seedCats, products);
if (!tokens.has('fresh-produce') || !tokens.has('beverages')) {
  errors.push('inventory tokens should include fresh-produce and beverages');
}

const cfg = getSupermarketConfig({}, 'demo-supermarket', 'supermarket');
if (cfg.showFeedSidebar !== true) {
  errors.push('showFeedSidebar should default on for supermarket');
}

if (errors.length) {
  console.error('verify-supermarket-sidebar failed:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log(`verify-supermarket-sidebar ok (${seeded.length} departments, ${tokens.size} inventory tokens)`);
