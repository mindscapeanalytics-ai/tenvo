/**
 * Guard: HeroCarousel must not hardcode automotive fallbacks for non-auto variants.
 * Furniture/tiles/pharmacy/etc. must resolve via resolveHeroCarouselFallback.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveHeroCarouselFallback,
  resolveAutomotiveTileImage,
} from '../lib/storefront/storefrontImagePlaceholders.js';
import { getFallbackProductImageUrl } from '../lib/storefront/productImageFallback.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const heroCarouselSrc = fs.readFileSync(
  path.join(root, 'components/storefront/sections/heroes/HeroCarousel.jsx'),
  'utf8'
);

assert.match(
  heroCarouselSrc,
  /resolveHeroCarouselFallback/,
  'HeroCarousel must use resolveHeroCarouselFallback'
);
assert.doesNotMatch(
  heroCarouselSrc,
  /resolveAutomotiveTileImage/,
  'HeroCarousel must not call resolveAutomotiveTileImage directly'
);

const autoVariants = new Set(['parts', 'dealership', 'marketplace']);
const nonAuto = ['furniture', 'tiles', 'pharmacy', 'restaurant', 'luxury', 'fitness', 'supermarket', 'default'];

for (const v of nonAuto) {
  const url = resolveHeroCarouselFallback(v, `seed-${v}`);
  assert.ok(url && url.startsWith('https://'), `${v} fallback must be https`);
  const autoSample = resolveAutomotiveTileImage(`seed-${v}`);
  // Non-auto variants must not reuse the automotive tile pool for the same seed.
  if (v !== 'default') {
    assert.notEqual(
      url,
      autoSample,
      `${v} hero fallback must not equal automotive tile for same seed`
    );
  }
}

for (const v of autoVariants) {
  const url = resolveHeroCarouselFallback(v, `seed-${v}`);
  assert.equal(
    url,
    resolveAutomotiveTileImage(`seed-${v}`),
    `${v} should keep automotive hero fallbacks`
  );
}

const furnitureFb = getFallbackProductImageUrl({ name: 'Oak sofa', id: '1' }, 'furniture');
const tilesFb = getFallbackProductImageUrl({ name: 'Marble floor tile', id: '2' }, 'ceramics-tiles');
assert.ok(furnitureFb.includes('unsplash.com'), 'furniture pool must return Unsplash');
assert.ok(tilesFb.includes('unsplash.com'), 'ceramics-tiles pool must return Unsplash');

const furnitureFile = fs.readFileSync(path.join(root, 'lib/storefront/furnitureStorefront.js'), 'utf8');
assert.doesNotMatch(
  furnitureFile,
  /FURNITURE_DEMO_HERO_SLIDES[\s\S]*?comfy\.sg/,
  'Furniture demo hero slides must not use flaky comfy.sg CDN'
);
assert.match(
  furnitureFile,
  /FURNITURE_DEMO_HERO_SLIDES[\s\S]*?buildUnsplashImageUrl/,
  'Furniture demo heroes must use Unsplash'
);

const elevated = fs.readFileSync(
  path.join(root, 'lib/storefront/elevatedStorefrontTenant.js'),
  'utf8'
);
assert.match(
  elevated,
  /Skip global `storefront\.heroSlides` on demos|skip global.*demos/i,
  'Demo hero resolution must skip polluted global heroSlides'
);

console.log('verify-storefront-domain-images: ok');
