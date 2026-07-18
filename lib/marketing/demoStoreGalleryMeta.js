/**
 * Rich marketing metadata for featured Tenvo demo storefront cards.
 * Hero images resolve from the same storefront assets each `/store/demo-*` uses.
 * Descriptions and accents align with `lib/dataLab/demoStoreProfiles.js`.
 */
import { ALL_DEMO_SEEDS } from '../dataLab/domains.mjs';
import { getDemoStorefrontProfile } from '../dataLab/demoStoreProfiles.js';
import { fashionStockImage } from '../dataLab/fashionDemoImages.js';
import { jewelleryStockImage } from '../dataLab/jewelleryDemoImages.js';
import { buildUnsplashImageUrl } from '../storefront/unsplashUrl.js';
import { AUTO_PARTS_DEFAULT_SLIDES } from '../storefront/autoPartsArchiveMap.js';
import { FITNESS_ASSETS } from '../storefront/fitnessStorefront.js';
import { FURNITURE_MARKETING_HERO_IMAGE } from '../storefront/furnitureStorefront.js';
import { TILES_MARKETING_HERO_IMAGE } from '../storefront/tilesStorefront.js';
import { MARINE_HERO_POSTER } from '../storefront/marinePartsArchiveMap.js';
import { PHARMACY_MARKETING_HERO_IMAGE } from '../storefront/pharmacyStorefront.js';
import { RESTAURANT_MARKETING_HERO_IMAGE } from '../storefront/restaurantStorefront.js';
import { SUPERMARKET_DEFAULT_HERO_SLIDES } from '../storefront/supermarketCatalogDefaults.js';
import { TENVO_VEHICLES_ASSETS } from '../storefront/tenvoVehiclesAssets.js';
import { FEATURED_DEMO_STORES } from './demoStores.js';

/** @param {string} photoId @param {number} [w] */
function unsplash(photoId, w = 900) {
  return buildUnsplashImageUrl(photoId, { w, q: 82 });
}

const AUTOPARTS_PARTS_CATALOG_HERO =
  AUTO_PARTS_DEFAULT_SLIDES[3]?.image || AUTO_PARTS_DEFAULT_SLIDES[0]?.image || '';

const SUPERMARKET_HERO = SUPERMARKET_DEFAULT_HERO_SLIDES[0]?.image || '';
const FMCG_HERO = SUPERMARKET_DEFAULT_HERO_SLIDES[1]?.image || '';

const MARKETPLACE_HERO =
  'https://images.unsplash.com/photo-1619405399517-d7fdef856543?w=1920&q=85&auto=format&fit=crop';

/**
 * Canonical marketing heroes — prefer live storefront defaults over ad-hoc Unsplash.
 * Every featured demo must resolve to a unique URL.
 * @type {Readonly<Record<string, string>>}
 */
export const CANONICAL_DEMO_HEROES = Object.freeze({
  'demo-textile': fashionStockImage('1594938298603-c8148c4dae35', 1200),
  'demo-boutique': fashionStockImage('1441984904996-e0b6ba687e04', 1000),
  'demo-jewellery': jewelleryStockImage('1515562141207-7a88fb7ce338', 1000),
  'demo-restaurant': RESTAURANT_MARKETING_HERO_IMAGE,
  'demo-bakery': unsplash('1555507036-ab1f4038808a', 1200),
  'demo-pharmacy': PHARMACY_MARKETING_HERO_IMAGE,
  'demo-dental': unsplash('1629909613654-28e495c44ad7', 1200),
  'demo-supermarket': SUPERMARKET_HERO,
  'demo-fmcg': FMCG_HERO,
  'demo-retail': unsplash('1556742049-0cfed4f6a45d', 1200),
  'demo-hardware': unsplash('1581578735548-049c48d88d70', 1200),
  'demo-furniture': FURNITURE_MARKETING_HERO_IMAGE,
  'demo-marbles': TILES_MARKETING_HERO_IMAGE,
  'demo-fitness': FITNESS_ASSETS.heroAthlete,
  'demo-autoparts': AUTOPARTS_PARTS_CATALOG_HERO,
  'demo-marine': MARINE_HERO_POSTER,
  'demo-showroom': TENVO_VEHICLES_ASSETS.hero.vehicles,
  'demo-sgcarmart': MARKETPLACE_HERO,
  'demo-electronics': unsplash('1498049794561-7780e7231661', 1200),
  'demo-mobile': unsplash('1511707171634-5f897ff02aa9', 1200),
  'demo-salon': unsplash('1560066984-138d9834df73', 1200),
});

/** Seed keys that may use fashion imagery as last-resort fallback */
const FASHION_FALLBACK_KEYS = new Set([
  'garments',
  'boutique-fashion',
  'textile-wholesale',
  'textile-mill',
]);

/**
 * Domain-family fallback when canonical + profile cover are missing.
 * Fashion Unsplash is only used for fashion/textile seed keys.
 * @param {string} seedKey
 * @param {string} domain
 */
function domainFamilyFallback(seedKey, domain) {
  if (CANONICAL_DEMO_HEROES[domain]) return CANONICAL_DEMO_HEROES[domain];
  if (FASHION_FALLBACK_KEYS.has(seedKey)) {
    return fashionStockImage('1441984904996-e0b6ba687e04', 1200);
  }
  return unsplash('1497366216548-37526070297c', 1200);
}

/**
 * Chrome-only gallery overrides (icons, glows, slide framing).
 * Prefer `CANONICAL_DEMO_HEROES` for images; set `heroImage` only for rare marketing crops.
 * @type {Record<string, Record<string, string>>}
 */
const GALLERY_OVERRIDES = {
  'demo-textile': {
    vertical: 'Textile & wholesale',
    icon: 'layers',
    backgroundColor: 'bg-gradient-to-br from-slate-800 via-stone-900 to-black',
    glowGradient: '#111827',
    glowColor: 'rgba(17, 24, 39, 0.35)',
  },
  'demo-retail': {
    vertical: 'General retail',
    icon: 'shopping-bag',
    backgroundColor: 'bg-gradient-to-br from-blue-600 via-blue-800 to-blue-950',
    glowGradient: '#2563eb',
    glowColor: 'rgba(37, 99, 235, 0.35)',
  },
  'demo-dental': {
    vertical: 'Dental & oral care',
    icon: 'stethoscope',
    backgroundColor: 'bg-gradient-to-br from-teal-600 via-cyan-800 to-teal-950',
    glowGradient: '#0d9488',
    glowColor: 'rgba(13, 148, 136, 0.35)',
  },
  'demo-boutique': {
    vertical: 'Fashion & boutique',
    icon: 'shirt',
    backgroundColor: 'bg-gradient-to-br from-stone-900 via-rose-950 to-black',
    glowGradient: '#0c0a09',
    glowColor: 'rgba(12, 10, 9, 0.35)',
  },
  'demo-jewellery': {
    vertical: 'Gems & jewellery',
    icon: 'gem',
    backgroundColor: 'bg-gradient-to-br from-amber-800 via-yellow-900 to-stone-950',
    glowGradient: '#b45309',
    glowColor: 'rgba(180, 83, 9, 0.35)',
  },
  'demo-restaurant': {
    vertical: 'Restaurant & BBQ',
    icon: 'utensils-crossed',
    backgroundColor: 'bg-gradient-to-br from-red-900 via-rose-950 to-black',
    glowGradient: '#dc2626',
    glowColor: 'rgba(220, 38, 38, 0.35)',
  },
  'demo-pharmacy': {
    vertical: 'Pharmacy',
    icon: 'pill',
    backgroundColor: 'bg-gradient-to-br from-emerald-600 via-teal-800 to-emerald-950',
    glowGradient: '#16a34a',
    glowColor: 'rgba(22, 163, 74, 0.35)',
  },
  'demo-supermarket': {
    vertical: 'Supermarket & grocery',
    icon: 'shopping-basket',
    backgroundColor: 'bg-gradient-to-br from-orange-500 via-amber-700 to-orange-950',
    glowGradient: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.35)',
  },
  'demo-fmcg': {
    vertical: 'FMCG & distribution',
    icon: 'shopping-basket',
    backgroundColor: 'bg-gradient-to-br from-lime-600 via-emerald-800 to-lime-950',
    glowGradient: '#65a30d',
    glowColor: 'rgba(101, 163, 13, 0.35)',
  },
  'demo-hardware': {
    vertical: 'Hardware & building',
    icon: 'wrench',
    backgroundColor: 'bg-gradient-to-br from-sky-800 via-slate-800 to-slate-950',
    glowGradient: '#0369a1',
    glowColor: 'rgba(3, 105, 161, 0.35)',
  },
  'demo-bakery': {
    vertical: 'Bakery & confectionery',
    icon: 'croissant',
    backgroundColor: 'bg-gradient-to-br from-orange-600 via-amber-700 to-orange-950',
    glowGradient: '#c2410c',
    glowColor: 'rgba(194, 65, 12, 0.35)',
  },
  'demo-electronics': {
    vertical: 'Electronics',
    icon: 'monitor',
    backgroundColor: 'bg-gradient-to-br from-indigo-600 via-violet-800 to-indigo-950',
    glowGradient: '#4f46e5',
    glowColor: 'rgba(79, 70, 229, 0.35)',
  },
  'demo-mobile': {
    vertical: 'Mobile & devices',
    icon: 'smartphone',
    backgroundColor: 'bg-gradient-to-br from-teal-700 via-cyan-900 to-teal-950',
    glowGradient: '#0f766e',
    glowColor: 'rgba(15, 118, 110, 0.35)',
  },
  'demo-salon': {
    vertical: 'Salon & spa',
    icon: 'scissors',
    backgroundColor: 'bg-gradient-to-br from-fuchsia-700 via-purple-900 to-fuchsia-950',
    glowGradient: '#a21caf',
    glowColor: 'rgba(162, 28, 175, 0.35)',
  },
  'demo-furniture': {
    vertical: 'Furniture & home',
    icon: 'sofa',
    backgroundColor: 'bg-gradient-to-br from-amber-900 via-stone-800 to-stone-950',
    glowGradient: '#92400e',
    glowColor: 'rgba(146, 64, 14, 0.35)',
  },
  'demo-marbles': {
    vertical: 'Tiles & marble',
    marketingName: 'Tenvo Marbles',
    icon: 'grid',
    backgroundColor: 'bg-gradient-to-br from-stone-800 via-stone-900 to-black',
    glowGradient: '#57534e',
    glowColor: 'rgba(87, 83, 78, 0.4)',
  },
  'demo-fitness': {
    vertical: 'Gym & fitness',
    marketingName: 'Fitness Demo',
    icon: 'dumbbell',
    slideTheme: 'dark',
    heroObjectFit: 'object-contain',
    heroObjectPosition: 'object-bottom',
    slideBackdropClass: 'bg-zinc-950',
    backgroundColor: 'bg-gradient-to-br from-rose-950 via-zinc-900 to-black',
    glowGradient: '#e11d48',
    glowColor: 'rgba(225, 29, 72, 0.4)',
  },
  'demo-autoparts': {
    vertical: 'Auto parts',
    icon: 'car',
    backgroundColor: 'bg-gradient-to-br from-red-700 via-zinc-900 to-black',
    glowGradient: '#cd232a',
    glowColor: 'rgba(205, 35, 42, 0.4)',
  },
  'demo-marine': {
    vertical: 'Marine spare parts',
    marketingName: 'Tenvo Marine',
    icon: 'ship',
    backgroundColor: 'bg-gradient-to-br from-slate-900 via-cyan-950 to-black',
    glowGradient: '#002d54',
    glowColor: 'rgba(0, 45, 84, 0.45)',
  },
  'demo-showroom': {
    vertical: 'Vehicle dealership',
    icon: 'car-front',
    logo: '/storefront/tenvo-car-dealership-tcd.svg',
    backgroundColor: 'bg-gradient-to-br from-zinc-800 via-neutral-900 to-black',
    glowGradient: '#111827',
    glowColor: 'rgba(17, 24, 39, 0.45)',
  },
  'demo-sgcarmart': {
    vertical: 'Tenvo Auto Marketplace',
    marketingName: 'Tenvo Auto Marketplace',
    icon: 'store',
    backgroundColor: 'bg-gradient-to-br from-red-600 via-red-800 to-red-950',
    glowGradient: '#E30613',
    glowColor: 'rgba(227, 6, 19, 0.4)',
  },
};

/**
 * @param {string} hex
 * @param {number} alpha
 */
function hexToGlow(hex, alpha = 0.35) {
  const raw = String(hex || '').replace('#', '');
  if (raw.length !== 6) return `rgba(99, 102, 241, ${alpha})`;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Resolve marketing hero for a demo domain (canonical → profile cover → family fallback).
 * @param {string} domain
 * @param {string} [seedKey]
 * @param {{ cover_image_url?: string | null }} [profile]
 * @param {{ heroImage?: string }} [override]
 */
export function resolveMarketingDemoHero(domain, seedKey = '', profile = {}, override = {}) {
  if (override.heroImage) return override.heroImage;
  const canonical = CANONICAL_DEMO_HEROES[domain];
  if (canonical) return canonical;
  if (profile.cover_image_url) return profile.cover_image_url;
  return domainFamilyFallback(seedKey, domain);
}

/**
 * @returns {Array<{
 *   key: string;
 *   name: string;
 *   domain: string;
 *   country: string;
 *   href: string;
 *   tier: 'full' | 'showcase';
 *   vertical: string;
 *   description: string;
 *   city: string;
 *   icon: string;
 *   heroImage: string;
 *   logo?: string;
 *   backgroundColor: string;
 *   glowGradient: string;
 *   glowColor: string;
 * }>}
 */
export function getFeaturedDemoGalleryItems() {
  const byDomain = new Map(
    FEATURED_DEMO_STORES.map((store) => {
      const seed = ALL_DEMO_SEEDS.find((s) => s.domain === store.domain);
      const domainKey = seed?.key || store.key;
      const profile = getDemoStorefrontProfile(domainKey);
      const override = GALLERY_OVERRIDES[store.domain] || {};
      const accent = profile.accentColor || override.glowGradient || '#6366f1';

      return [
        store.domain,
        {
          ...store,
          name: override.marketingName || store.name,
          vertical: override.vertical || store.name,
          description: profile.description,
          city: profile.city || store.country,
          icon: override.icon || 'store',
          heroImage: resolveMarketingDemoHero(store.domain, domainKey, profile, override),
          slideTheme: override.slideTheme || 'light',
          heroObjectFit: override.heroObjectFit || 'object-cover',
          heroObjectPosition: override.heroObjectPosition || 'object-center',
          slideBackdropClass: override.slideBackdropClass || 'bg-slate-100',
          logo: override.logo || profile.logo_url || undefined,
          backgroundColor: override.backgroundColor || 'bg-gradient-to-br from-indigo-600 to-violet-900',
          glowGradient: override.glowGradient || accent,
          glowColor: override.glowColor || hexToGlow(accent),
        },
      ];
    })
  );

  return FEATURED_DEMO_STORES.map((store) => byDomain.get(store.domain)).filter(Boolean);
}

/**
 * Showcase-only demos hidden from the full-screen hero until elevated storefront polish ships.
 * Full `DEMO_BUSINESS_PACK` seeds stay eligible for the carousel.
 */
export const HERO_EXCLUDED_DEMO_DOMAINS = new Set([
  'demo-mobile',
  'demo-electronics',
  'demo-solar',
  'demo-salon',
]);

/** Featured demos eligible for the homepage hero flip carousel. */
export function getHeroDemoGalleryItems() {
  return getFeaturedDemoGalleryItems().filter((store) => !HERO_EXCLUDED_DEMO_DOMAINS.has(store.domain));
}

/**
 * Hero image for a demo storefront domain (marketing sections).
 * @param {string} domain e.g. `demo-boutique`
 */
export function getDemoStoreHeroByDomain(domain) {
  const seed = ALL_DEMO_SEEDS.find((s) => s.domain === domain);
  if (!seed) return CANONICAL_DEMO_HEROES[domain] || '';
  const profile = getDemoStorefrontProfile(seed.key);
  const override = GALLERY_OVERRIDES[domain] || {};
  return resolveMarketingDemoHero(domain, seed.key, profile, override);
}

/**
 * @param {string} domain
 */
export function getDemoStoreHref(domain) {
  return `/store/${domain}`;
}
