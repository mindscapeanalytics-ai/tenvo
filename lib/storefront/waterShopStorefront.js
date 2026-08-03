/**
 * Water supply storefront helpers — overlays on supermarket chrome.
 * Isolated to canonical `water-delivery` (aliases via resolveDomainKey).
 *
 * Inventory + Store Settings win. Static lists are empty-store / demo fallbacks only.
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { buildUnsplashImageUrl } from '@/lib/storefront/unsplashUrl';
import { WATER_SHOP_MARKETING_HERO_IMAGE } from '@/lib/dataLab/waterShopDemoCatalog.js';

export const WATER_SHOP_ACCENT = '#0284c7';
export const WATER_SHOP_ACCENT_DARK = '#0c4a6e';
export const WATER_SHOP_ACCENT_LIGHT = '#e0f2fe';
export const WATER_SHOP_PROMO_BAR = '#0369a1';

export const WATER_SHOP_ACCENTS = {
  accent: WATER_SHOP_ACCENT,
  accentDark: WATER_SHOP_ACCENT_DARK,
  accentLight: WATER_SHOP_ACCENT_LIGHT,
  promoBar: WATER_SHOP_PROMO_BAR,
};

export const WATER_SHOP_QUICK_SEARCH = [
  '19L refill',
  '12L',
  '1.5L case',
  '500ml',
  'Dispenser',
  'Cradle stand',
  'Deposit',
  'Summer bundle',
];

export const WATER_SHOP_SIDEBAR_DEPARTMENTS = [
  { id: '19l', label: '19L Dispenser', slug: '19L Dispenser' },
  { id: 'family', label: '12L / 6L Family', slug: '12L / 6L Family' },
  { id: '15l', label: 'Family Packs (1.5L)', slug: 'Family Packs (1.5L)' },
  { id: 'pet', label: 'PET Small Bottles', slug: 'PET Small Bottles' },
  { id: 'stands', label: 'Water Dispensers / Stands', slug: 'Water Dispensers / Stands' },
  { id: 'deposit', label: 'Empty Bottle Deposit', slug: 'Empty Bottle Deposit' },
  { id: 'office', label: 'Office / Corporate', slug: 'Office / Corporate' },
  { id: 'bundles', label: 'Seasonal Bundles', slug: 'Seasonal Bundles' },
];

export const WATER_SHOP_POPULAR_CATEGORIES = [
  {
    id: '19l',
    label: '19L Refill',
    slug: '19L Dispenser',
    icon: 'droplets',
    image: buildUnsplashImageUrl('1548832330-d0f21f4b8f8b', { w: 600, q: 80 }),
  },
  {
    id: 'family',
    label: '12L / 6L',
    slug: '12L / 6L Family',
    icon: 'droplets',
    image: buildUnsplashImageUrl('1564419320461-6870880221ad', { w: 600, q: 80 }),
  },
  {
    id: 'pet',
    label: 'PET cases',
    slug: 'PET Small Bottles',
    icon: 'package',
    image: buildUnsplashImageUrl('1622484212850-eb5969ee8b37', { w: 600, q: 80 }),
  },
  {
    id: 'stands',
    label: 'Dispensers',
    slug: 'Water Dispensers / Stands',
    icon: 'appliance',
    image: buildUnsplashImageUrl('1584622650111-993a426fbf0a', { w: 600, q: 80 }),
  },
  {
    id: 'office',
    label: 'Office bulk',
    slug: 'Office / Corporate',
    icon: 'building',
    image: buildUnsplashImageUrl('1497366216548-37526070297c', { w: 600, q: 80 }),
  },
  {
    id: 'bundles',
    label: 'Bundles',
    slug: 'Seasonal Bundles',
    icon: 'gift',
    image: buildUnsplashImageUrl('1556911220-e15b29be8c8f', { w: 600, q: 80 }),
  },
];

export const WATER_SHOP_DEFAULT_BRANDS = [
  { id: 'tenvo', label: 'Tenvo Water', hrefSuffix: '?search=Tenvo' },
  { id: 'nestle', label: 'Nestlé Pure Life', hrefSuffix: '?search=Nestle' },
  { id: 'aquafina', label: 'Aquafina', hrefSuffix: '?search=Aquafina' },
  { id: 'kinley', label: 'Kinley', hrefSuffix: '?search=Kinley' },
  { id: 'gourmet', label: 'Gourmet Water', hrefSuffix: '?search=Gourmet' },
  { id: 'local', label: 'Local Plant', hrefSuffix: '?search=Local' },
];

export const WATER_SHOP_SECTION_TITLES = {
  weeklyEssentials: 'Weekly home delivery essentials',
  deliveryBanner: 'Doorstep delivery on your fixed day',
  freshRail: 'Refills & family packs',
  dealsRail: 'Stands & dispensers',
  featuredRail: 'Top picks',
  popularCategories: 'Shop by size',
  trendingNow: 'Water brands',
  shopByOffer: 'Bundles & deposits',
};

export const WATER_SHOP_HOME_TRUST = [
  { id: 'door', label: 'Doorstep delivery', desc: 'Riders on fixed days across your city' },
  { id: 'cycle', label: 'Empty bottle cycle', desc: 'DEL full · REC empties · BAL tracked' },
  { id: 'psqca', label: 'Plant quality', desc: 'PSQCA-minded mineral water process' },
  { id: 'pay', label: 'Easy pay', desc: 'Cash, JazzCash, or monthly credit hisab' },
];

/** How delivery works — Culligan-style 4 steps (Tenvo copy). */
export const WATER_SHOP_HOW_IT_WORKS = [
  {
    id: 'signup',
    title: 'Sign up or call',
    desc: 'Create an account online or call our UAN. We set your town code, house, and delivery day.',
  },
  {
    id: 'receive',
    title: 'Receive bottles & pay',
    desc: 'Rider delivers 12L / 19L and can set up a stand or hot & cold dispenser. Pay cash or open credit.',
  },
  {
    id: 'refill',
    title: 'Weekly refill',
    desc: 'Leave empties out. On your fixed day we swap filled bottles — even if you are not home.',
  },
  {
    id: 'manage',
    title: 'Manage your account',
    desc: 'Change qty, skip vacation weeks, view weekly or monthly bills, and track bottle BAL online.',
  },
];

export const WATER_SHOP_HOME_RAILS = [
  {
    id: '19l-refill',
    title: '19L dispenser refill',
    subtitle: 'Home & flat weekly cycle',
    href: '?category=19L%20Dispenser',
    categorySlug: '19L Dispenser',
    partition: 'fresh',
    enabled: true,
  },
  {
    id: 'pet-cases',
    title: 'PET cases',
    subtitle: '1.5L, 500ml, 330ml for events',
    href: '?category=PET%20Small%20Bottles',
    categorySlug: 'PET Small Bottles',
    partition: 'topSellers',
    enabled: true,
  },
  {
    id: 'stands',
    title: 'Stands & dispensers',
    subtitle: 'Cradle, tabletop, hot & cold',
    href: '?category=Water%20Dispensers%20%2F%20Stands',
    categorySlug: 'Water Dispensers / Stands',
    partition: 'deals',
    enabled: true,
  },
  {
    id: 'bundles',
    title: 'Seasonal bundles',
    subtitle: 'Summer packs and coupon books',
    href: '?category=Seasonal%20Bundles',
    categorySlug: 'Seasonal Bundles',
    partition: 'topSellers',
    enabled: true,
  },
];

export const WATER_SHOP_DEFAULT_HERO_SLIDES = [
  {
    eyebrow: 'Home delivery',
    title: 'Crystal clear water at your doorstep',
    subtitle:
      '19L and 12L refills, fixed rider days, and empty bottle tracking across Karachi, Lahore, and beyond.',
    image: buildUnsplashImageUrl('1548832330-d0f21f4b8f8b', { w: 1920, q: 85 }),
    ctaLabel: 'Shop 19L refill',
    ctaHref: '/products?category=19L%20Dispenser',
  },
  {
    eyebrow: 'Hot & cold',
    title: 'Dispensers for home and office',
    subtitle: 'Cradle stands and electronic hot & cold units, installed on first delivery.',
    image: buildUnsplashImageUrl('1584622650111-993a426fbf0a', { w: 1920, q: 85 }),
    ctaLabel: 'Shop dispensers',
    ctaHref: '/products?category=Water%20Dispensers%20%2F%20Stands',
  },
  {
    eyebrow: 'On the go',
    title: 'PET cases for offices and events',
    subtitle: '1.5L, 500ml, and 330ml cases with same-day Karachi routes where available.',
    image: buildUnsplashImageUrl('1622484212850-eb5969ee8b37', { w: 1920, q: 85 }),
    ctaLabel: 'Shop PET packs',
    ctaHref: '/products?category=PET%20Small%20Bottles',
  },
];

/**
 * @param {string | null | undefined} category
 */
export function isWaterShopStore(category) {
  return resolveDomainKey(category) === 'water-delivery';
}

/**
 * @param {object} [settings]
 */
export function getWaterShopConfig(settings = {}) {
  const raw = settings?.storefront?.water || settings?.storefront?.waterDelivery || {};
  return {
    searchPlaceholder: raw.searchPlaceholder || 'Search 19L, dispensers, PET cases…',
    deliveryNotice:
      raw.deliveryNotice ||
      'Fixed-day rider delivery · Empty bottle return · Weekly & monthly hisab bills',
    uan: raw.uan || '',
    showHowItWorks: raw.showHowItWorks !== false,
    howItWorks: Array.isArray(raw.howItWorks) && raw.howItWorks.length
      ? raw.howItWorks
      : WATER_SHOP_HOW_IT_WORKS,
    heroVideoUrl: typeof raw.heroVideoUrl === 'string' ? raw.heroVideoUrl.trim() : '',
  };
}

export function getWaterShopDefaultHeroSlides() {
  return WATER_SHOP_DEFAULT_HERO_SLIDES.map((s) => ({ ...s }));
}

export function getWaterShopMarketingHeroImage() {
  return WATER_SHOP_MARKETING_HERO_IMAGE;
}
