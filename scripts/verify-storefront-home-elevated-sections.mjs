/**
 * Guard: elevated homepage sections must not blank to hero+footer when catalog fails.
 * Run: bun scripts/verify-storefront-home-elevated-sections.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pageSrc = readFileSync(resolve(process.cwd(), 'app/store/[businessDomain]/page.jsx'), 'utf8');
const catalogSrc = readFileSync(resolve(process.cwd(), 'lib/storefront/storeHomeCatalog.js'), 'utf8');

assert.equal(
  /marketplaceHero\s*&&\s*marketplaceCatalogResult\.success/.test(pageSrc),
  false,
  'marketplace LazyVertical must not gate on catalogResult.success'
);
assert.equal(
  /dealershipHero\s*&&\s*dealershipCatalogResult\.success/.test(pageSrc),
  false,
  'dealership LazyVertical must not gate on catalogResult.success'
);
assert.equal(
  /autoPartsHero\s*&&\s*autoPartsProducts\.length\s*>\s*0/.test(pageSrc),
  false,
  'auto-parts LazyVertical must not gate on products.length > 0'
);
assert.match(pageSrc, /marketplaceHero\s*&&\s*\(\s*\n\s*<LazyVerticalHomeSections/, 'marketplace sections must always mount when hero is active');
assert.match(pageSrc, /dealershipHero\s*&&\s*\(\s*\n\s*<LazyVerticalHomeSections/, 'dealership sections must always mount when hero is active');

assert.match(catalogSrc, /preferProductSlice/, 'catalog mapper must prefer featured then popularity');
assert.match(
  catalogSrc,
  /needPopularity:\s*Boolean\(popularityVertical\s*\|\|\s*featuredVertical\)/,
  'featured verticals must also fetch popularity fallback'
);
assert.match(
  catalogSrc,
  /marketplaceCatalogResult:[\s\S]*?preferProductSlice\(bundle\.featured,\s*popularity/,
  'marketplace must use preferProductSlice fallback'
);

console.log('OK: storefront home elevated section gates + marketplace catalog fallback');
