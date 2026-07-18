/**
 * Guard: HeroCarousel must not hardcode automotive fallbacks for non-auto variants.
 * Furniture/tiles/pharmacy/etc. must resolve via resolveHeroCarouselFallback.
 * Fitness hosts must be allowlisted; nutrition brands must not map to pet imagery.
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
import { resolveStoredHeroSlides } from '../lib/storefront/heroSlides.js';

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

const nutritionFb = getFallbackProductImageUrl(
  { name: 'Optimum Nutrition Serious Mass', id: 'on-1' },
  'gym-fitness'
);
const petFb = getFallbackProductImageUrl({ name: 'Dog food bag', id: 'pet-1' }, 'veterinary-clinic');
assert.ok(nutritionFb.includes('unsplash.com'), 'supplement fallback must resolve');
assert.notEqual(
  nutritionFb,
  petFb,
  'Optimum Nutrition must not share the pet fallback pool'
);

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

const nextConfig = fs.readFileSync(path.join(root, 'next.config.js'), 'utf8');
for (const host of ['assets.website-files.com', 'synergize.pk', 'comfy.sg']) {
  assert.match(nextConfig, new RegExp(host.replace(/\./g, '\\.')), `next.config must allowlist ${host}`);
}

const fitnessHero = fs.readFileSync(
  path.join(root, 'components/storefront/sections/fitness/FitnessHero.jsx'),
  'utf8'
);
assert.match(fitnessHero, /resolveFitnessImageFallback/, 'FitnessHero must use gym fallbacks');
assert.match(fitnessHero, /isDeadImageUrl/, 'FitnessHero must reject dead cover images');

const leaked = resolveStoredHeroSlides({
  storefront: {
    heroSlides: [],
    dealership: {
      heroSlides: [{ title: 'Cars', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7' }],
    },
  },
});
assert.equal(
  leaked.filter((s) => s.image).length,
  0,
  'resolveStoredHeroSlides must not steal dealership slides when global is empty'
);

console.log('verify-storefront-domain-images: ok');
