#!/usr/bin/env node
/**
 * Static wiring checks for editorial fashion / textile storefronts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const errors = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

// 1. Lazy vertical loader includes fashion variant
const lazy = read('components/storefront/sections/LazyVerticalHomeSections.jsx');
assert(lazy.includes("case 'fashion'"), 'LazyVerticalHomeSections missing fashion variant');

// 2. Gul Ahmed section components
assert(
  fs.existsSync(path.join(root, 'components/storefront/sections/fashion/FashionHomeEditSection.jsx')),
  'FashionHomeEditSection.jsx missing'
);
assert(
  fs.existsSync(path.join(root, 'components/storefront/sections/fashion/FashionSaleMosaicSection.jsx')),
  'FashionSaleMosaicSection.jsx missing'
);
assert(
  fs.existsSync(path.join(root, 'lib/dataLab/fashionGulAhmedSections.js')),
  'fashionGulAhmedSections.js missing'
);

// 3. Editorial config exports premium fields
const editorial = read('lib/storefront/fashionEditorial.js');
assert(editorial.includes('showHomeEdit'), 'fashionEditorial missing showHomeEdit');
assert(editorial.includes('showSaleMosaic'), 'fashionEditorial missing showSaleMosaic');

const gulSeed = read('lib/dataLab/fashionGulAhmedSections.js');
assert(gulSeed.includes('GUL_AHMED_HOME_EDIT'), 'missing GUL_AHMED_HOME_EDIT seed');
assert(gulSeed.includes('GUL_AHMED_SALE_MOSAIC'), 'missing GUL_AHMED_SALE_MOSAIC seed');
assert(editorial.includes('showBrandsRow'), 'fashionEditorial missing showBrandsRow');
assert(editorial.includes('showPromoBanners'), 'fashionEditorial missing showPromoBanners');
assert(editorial.includes('resolveFashionSearchPlaceholder'), 'fashionEditorial missing search placeholder resolver');
assert(editorial.includes('getFashionMetadataCopy'), 'fashionEditorial missing SEO metadata helper');

// 4. Registration seed includes premium toggles
const regDefaults = read('lib/onboarding/registrationStorefrontDefaults.js');
assert(regDefaults.includes('buildFullFashionStorefrontSeed'), 'registration defaults missing fashion seed');

// 5. Page wires lazy fashion sections
const page = read('app/store/[businessDomain]/page.jsx');
assert(page.includes('variant="fashion"'), 'store page missing LazyVerticalHomeSections fashion variant');
assert(page.includes('isFashionEditorialStore'), 'store page missing fashion SEO metadata branch');

// 6. Hub settings expose new toggles
const settings = read('components/StoreSettingsManager.jsx');
assert(settings.includes('showTrustStrip'), 'StoreSettingsManager missing showTrustStrip');
assert(settings.includes('searchPlaceholder'), 'StoreSettingsManager missing fashion search placeholder');

// 7. Demo boutique domain alias
const domains = read('lib/dataLab/domains.mjs');
assert(domains.includes("domain: 'demo-boutique'"), 'demo-boutique missing from domains.mjs');

// 8. Hero preset routes fashion-editorial
const heroPresets = read('lib/storefront/heroPresets.js');
assert(heroPresets.includes('fashion-editorial'), 'heroPresets missing fashion-editorial type');

console.log('👗 Fashion editorial storefront verification\n');

if (errors.length) {
  console.error('❌ Failed checks:');
  errors.forEach((e) => console.error(`   • ${e}`));
  process.exit(1);
}

console.log('✅ All fashion editorial wiring checks passed');
console.log('\nManual QA:');
console.log('   1. Visit /store/demo-boutique');
console.log('   2. Confirm trust strip, brands, promo banners, SEO block');
console.log('   3. Hub → Store Settings → Clothing & textile storefront toggles');
console.log('   4. Filter /products by fabric and sourcing');
