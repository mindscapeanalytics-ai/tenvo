/**
 * Milk shop storefront helpers — overlays on supermarket chrome.
 * Isolated to canonical `milk-shop` (aliases resolve via resolveDomainKey).
 *
 * Inventory + Store Settings win. Static lists are empty-store / demo fallbacks only.
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { buildUnsplashImageUrl } from '@/lib/storefront/unsplashUrl';

export const MILK_SHOP_ACCENT = '#0ea5e9';
export const MILK_SHOP_ACCENT_DARK = '#0369a1';
export const MILK_SHOP_ACCENT_LIGHT = '#e0f2fe';

export const MILK_SHOP_ACCENTS = {
  accent: MILK_SHOP_ACCENT,
  accentDark: MILK_SHOP_ACCENT_DARK,
  accentLight: MILK_SHOP_ACCENT_LIGHT,
};

/** Fallback chips when inventory has no names yet (owner can override in Store Settings). */
export const MILK_SHOP_QUICK_SEARCH = [
  'Cow milk',
  'Buffalo milk',
  'Dahi',
  'Lassi',
  'Paneer',
  "Olper's",
  'Makkhan',
  'Ghee',
];

/** Fallback sidebar when categories table + product categories are empty. */
export const MILK_SHOP_SIDEBAR_DEPARTMENTS = [
  { id: 'fresh-milk', label: 'Fresh Milk', slug: 'Fresh Milk' },
  { id: 'yogurt', label: 'Yogurt / Dahi', slug: 'Yogurt / Dahi' },
  { id: 'cream-butter', label: 'Cream & Butter', slug: 'Cream & Butter' },
  { id: 'ghee', label: 'Ghee', slug: 'Ghee' },
  { id: 'cheese-khoya', label: 'Cheese & Khoya', slug: 'Cheese & Khoya' },
  { id: 'lassi', label: 'Lassi & Drinks', slug: 'Lassi & Drinks' },
  { id: 'sweets', label: 'Dairy Sweets', slug: 'Dairy Sweets' },
  { id: 'packaged', label: 'Packaged Dairy', slug: 'Packaged Dairy' },
  { id: 'eggs', label: 'Eggs', slug: 'Eggs' },
  { id: 'bakery', label: 'Bakery Staples', slug: 'Bakery Staples' },
];

export const MILK_SHOP_POPULAR_CATEGORIES = MILK_SHOP_SIDEBAR_DEPARTMENTS.slice(0, 6).map((d) => ({
  id: d.id,
  label: d.label,
  slug: d.slug,
  icon: /lassi|drink/i.test(d.label) ? 'beverage' : 'milk',
}));

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
  popularCategories: 'Shop by category',
  trendingNow: 'Dairy brands',
  shopByOffer: 'From the counter',
};

export const MILK_SHOP_HOME_TRUST = [
  { id: 'chill', label: 'Chilled chain', desc: 'Kept cold from shop to door' },
  { id: 'kg', label: 'Sold by kg', desc: 'Order exact milk weight you need' },
  { id: 'daily', label: 'Daily fresh', desc: 'Cow, buffalo, dahi, and makkhan' },
  { id: 'cod', label: 'Easy pay', desc: 'Cash, JazzCash, or card on delivery' },
];

/** Fallback rails only when no inventory categories exist. */
export const MILK_SHOP_HOME_RAILS = [
  {
    id: 'fresh-milk',
    title: 'Fresh milk',
    subtitle: 'Cow and buffalo by the kg',
    href: '?category=Fresh%20Milk',
    categorySlug: 'Fresh Milk',
    partition: 'fresh',
    enabled: true,
  },
  {
    id: 'dahi-lassi',
    title: 'Dahi and lassi',
    subtitle: 'Homemade yogurt and chilled drinks',
    href: '?category=Yogurt%20%2F%20Dahi',
    categorySlug: 'Yogurt / Dahi',
    partition: 'topSellers',
    enabled: true,
  },
  {
    id: 'dairy-sweets',
    title: 'Dairy sweets',
    subtitle: 'Kheer, rabri, and shop specialties',
    href: '?category=Dairy%20Sweets',
    categorySlug: 'Dairy Sweets',
    partition: 'deals',
    enabled: true,
  },
  {
    id: 'packaged',
    title: 'Packaged dairy',
    subtitle: "Olper's, Nurpur, Dayfresh and more",
    href: '?category=Packaged%20Dairy',
    categorySlug: 'Packaged Dairy',
    partition: 'topSellers',
    enabled: true,
  },
];

export const MILK_SHOP_DEFAULT_HERO_SLIDES = [
  {
    eyebrow: 'Fresh daily',
    title: 'Farm-fresh milk by the kg',
    subtitle: 'Cow and buffalo milk, dahi, makkhan, and lassi. Chilled and ready.',
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
 * Owner overrides only. Empty arrays mean "use live inventory".
 * @param {object} [settings]
 */
export function getMilkShopConfig(settings = {}) {
  const raw = settings?.storefront?.milkShop || settings?.storefront?.supermarket || {};
  return {
    searchPlaceholder: raw.searchPlaceholder || 'Search milk, dahi, lassi, brands…',
    quickSearchTerms:
      Array.isArray(raw.quickSearchTerms) && raw.quickSearchTerms.length
        ? raw.quickSearchTerms
        : null,
    sectionTitles: { ...MILK_SHOP_SECTION_TITLES, ...(raw.sectionTitles || {}) },
  };
}

/**
 * Normalize inventory categories for milk chrome (DB rows or product.category strings).
 * @param {object[]} [categories]
 * @param {object[]} [products]
 */
export function resolveMilkShopInventoryCategories(categories = [], products = []) {
  const fromDb = (categories || [])
    .filter((c) => c?.name)
    .map((c) => ({
      id: String(c.id || c.slug || c.name),
      name: String(c.name),
      slug: String(c.slug || c.name),
      image_url: c.image_url || '',
      product_count: c.product_count,
    }));
  if (fromDb.length) return fromDb;

  const map = new Map();
  for (const p of products || []) {
    const name = String(p.category_name || p.category || '').trim();
    if (!name) continue;
    const slug = String(p.category_slug || name).trim();
    const key = slug.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        id: slug,
        name,
        slug,
        image_url: p.image_url || '',
        product_count: 1,
      });
    } else {
      const row = map.get(key);
      row.product_count += 1;
      if (!row.image_url && p.image_url) row.image_url = p.image_url;
    }
  }
  return [...map.values()];
}

/**
 * @param {object[]} inventoryCategories
 */
export function buildMilkShopSidebarFromInventory(inventoryCategories = []) {
  return inventoryCategories.map((c, i) => ({
    id: String(c.id || `dept-${i}`),
    label: c.name,
    slug: c.slug || c.name,
  }));
}

/**
 * @param {object[]} inventoryCategories
 */
export function buildMilkShopCategoryIconsFromInventory(inventoryCategories = []) {
  return inventoryCategories.slice(0, 8).map((c, i) => ({
    id: String(c.id || `cat-${i}`),
    label: c.name,
    slug: c.slug || c.name,
    image: c.image_url || '',
    icon: /lassi|drink/i.test(c.name) ? 'beverage' : 'milk',
  }));
}

/**
 * Brands from product.brand (skips generic house label).
 * @param {object[]} products
 * @param {number} [max]
 */
export function buildMilkShopBrandRowsFromProducts(products = [], max = 12) {
  const counts = new Map();
  for (const p of products || []) {
    const brand = String(p.brand || '').trim();
    if (!brand || /^tenvo\b/i.test(brand)) continue;
    counts.set(brand, (counts.get(brand) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([label], i) => ({
      id: `brand-${i}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label,
      hrefSuffix: `?search=${encodeURIComponent(label)}`,
    }));
}

/**
 * One homepage rail per inventory category that still has products.
 * @param {object[]} inventoryCategories
 * @param {object[]} [products]
 * @param {number} [max]
 */
export function buildMilkShopHomeRailsFromInventory(inventoryCategories = [], products = [], max = 6) {
  const withStock = inventoryCategories.filter((c) => {
    if (c.product_count != null && Number(c.product_count) > 0) return true;
    if (!(products || []).length) return true;
    const needle = String(c.slug || c.name || '').toLowerCase();
    return (products || []).some((p) => {
      const cat = String(p.category_name || p.category || '').toLowerCase();
      const slug = String(p.category_slug || '').toLowerCase();
      return cat === needle || slug === needle || cat.includes(needle) || needle.includes(cat);
    });
  });

  return withStock.slice(0, max).map((c, i) => {
    const slug = c.slug || c.name;
    return {
      id: `rail-${String(c.id || slug).replace(/\s+/g, '-').toLowerCase()}`,
      title: c.name,
      subtitle: 'From our dairy counter',
      href: `?category=${encodeURIComponent(slug)}`,
      categorySlug: slug,
      partition: i === 0 ? 'fresh' : i % 3 === 1 ? 'deals' : 'topSellers',
      enabled: true,
    };
  });
}
