/**
 * Milk shop storefront helpers — overlays on supermarket chrome.
 * Isolated to canonical `milk-shop` (aliases resolve via resolveDomainKey).
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { buildUnsplashImageUrl } from '@/lib/storefront/unsplashUrl';

export const MILK_SHOP_ACCENT = '#0ea5e9';
export const MILK_SHOP_ACCENT_DARK = '#0369a1';

export const MILK_SHOP_QUICK_SEARCH = [
  'Cow milk',
  'Buffalo milk',
  'Dahi',
  'Lassi',
  'Paneer',
  'Olper\'s',
  'Makkhan',
  'Ghee',
];

export const MILK_SHOP_SIDEBAR_DEPARTMENTS = [
  {
    id: 'fresh-milk',
    label: 'Fresh Milk',
    slug: 'Fresh Milk',
    children: [
      { id: 'cow', label: 'Cow Milk', slug: 'Fresh Milk' },
      { id: 'buffalo', label: 'Buffalo Milk', slug: 'Fresh Milk' },
    ],
  },
  {
    id: 'yogurt',
    label: 'Yogurt / Dahi',
    slug: 'Yogurt / Dahi',
  },
  {
    id: 'cream-butter',
    label: 'Cream & Butter',
    slug: 'Cream & Butter',
  },
  {
    id: 'ghee',
    label: 'Ghee',
    slug: 'Ghee',
  },
  {
    id: 'cheese-khoya',
    label: 'Cheese & Khoya',
    slug: 'Cheese & Khoya',
  },
  {
    id: 'lassi',
    label: 'Lassi & Drinks',
    slug: 'Lassi & Drinks',
  },
  {
    id: 'sweets',
    label: 'Dairy Sweets',
    slug: 'Dairy Sweets',
  },
  {
    id: 'packaged',
    label: 'Packaged Dairy',
    slug: 'Packaged Dairy',
  },
  {
    id: 'eggs',
    label: 'Eggs',
    slug: 'Eggs',
  },
  {
    id: 'bakery',
    label: 'Bakery Staples',
    slug: 'Bakery Staples',
  },
];

export const MILK_SHOP_POPULAR_CATEGORIES = [
  { id: 'fresh', label: 'Fresh Milk', slug: 'Fresh Milk', icon: 'milk' },
  { id: 'dahi', label: 'Dahi', slug: 'Yogurt / Dahi', icon: 'milk' },
  { id: 'lassi', label: 'Lassi', slug: 'Lassi & Drinks', icon: 'beverage' },
  { id: 'paneer', label: 'Paneer', slug: 'Cheese & Khoya', icon: 'milk' },
  { id: 'ghee', label: 'Ghee', slug: 'Ghee', icon: 'milk' },
  { id: 'packaged', label: 'Packaged', slug: 'Packaged Dairy', icon: 'milk' },
];

export const MILK_SHOP_DEFAULT_BRANDS = [
  { id: 'olpers', label: "Olper's", hrefSuffix: '?search=Olper' },
  { id: 'nurpur', label: 'Nurpur', hrefSuffix: '?search=Nurpur' },
  { id: 'dayfresh', label: 'Dayfresh', hrefSuffix: '?search=Dayfresh' },
  { id: 'prema', label: 'Prema', hrefSuffix: '?search=Prema' },
  { id: 'nestle', label: 'Nestlé', hrefSuffix: '?search=Nestle' },
  { id: 'pakola', label: 'Pakola', hrefSuffix: '?search=Pakola' },
];

export const MILK_SHOP_SECTION_TITLES = {
  weeklyEssentials: 'Daily dairy essentials',
  deliveryBanner: 'Chilled delivery in your area',
  freshRail: 'Fresh today',
  dealsRail: 'Milk shop deals',
  featuredRail: 'Top picks',
};

export const MILK_SHOP_DEFAULT_HERO_SLIDES = [
  {
    eyebrow: 'Fresh daily',
    title: 'Farm-fresh milk by the kg',
    subtitle: 'Cow and buffalo milk, dahi, makkhan, and lassi — chilled and ready.',
    image: buildUnsplashImageUrl('1563636619-e9143da7973b', { w: 1920, q: 85 }),
    ctaLabel: 'Order milk',
    ctaHref: '/products?category=Fresh%20Milk',
  },
  {
    eyebrow: 'Homemade',
    title: 'Thick dahi and malai',
    subtitle: 'Daily yogurt, cream, and desi ghee from the milk shop.',
    image: buildUnsplashImageUrl('1488477181946-6428a0291777', { w: 1920, q: 85 }),
    ctaLabel: 'Shop dahi',
    ctaHref: '/products?category=Yogurt%20%2F%20Dahi',
  },
  {
    eyebrow: 'Packaged dairy',
    title: "Olper's, Nurpur and more",
    subtitle: 'UHT packs, flavoured milk, and cream for the pantry.',
    image: buildUnsplashImageUrl('1578916171728-46686eac8d58', { w: 1920, q: 85 }),
    ctaLabel: 'Browse packs',
    ctaHref: '/products?category=Packaged%20Dairy',
  },
];

/**
 * @param {string | null | undefined} category
 */
export function isMilkShopStore(category) {
  return resolveDomainKey(category) === 'milk-shop';
}

/**
 * @param {object} [settings]
 */
export function getMilkShopConfig(settings = {}) {
  const raw = settings?.storefront?.milkShop || settings?.storefront?.supermarket || {};
  return {
    searchPlaceholder: raw.searchPlaceholder || 'Search milk, dahi, lassi, brands…',
    quickSearchTerms:
      Array.isArray(raw.quickSearchTerms) && raw.quickSearchTerms.length
        ? raw.quickSearchTerms
        : MILK_SHOP_QUICK_SEARCH,
    sectionTitles: { ...MILK_SHOP_SECTION_TITLES, ...(raw.sectionTitles || {}) },
  };
}
