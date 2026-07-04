import { isDemoStoreDomain } from '@/lib/storefront/elevatedStorefrontTenant';
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { isRestaurantElevatedStore } from '@/lib/storefront/restaurantStorefront';
import { filterProductsByCategorySlug } from '@/lib/storefront/elevatedStorefrontTenant';
import { isStorefrontProductUuid } from '@/lib/utils/storefrontProductRef';
import { RESTAURANT_SEED_PRODUCTS, RESTAURANT_SEED_CATEGORIES } from './restaurantDemoCatalog.js';
import { normalizeStorefrontRemoteImageUrl } from '@/lib/storefront/productImageFallback';
const seedProductBySku = new Map(
  RESTAURANT_SEED_PRODUCTS.map((row) => [String(row.sku || '').toLowerCase(), row])
);
const seedProductByName = new Map(
  RESTAURANT_SEED_PRODUCTS.map((row) => [String(row.name || '').trim().toLowerCase(), row])
);

import { isPurchasableStorefrontProduct } from '@/lib/storefront/storefrontPurchasability';

/** @param {object | null | undefined} product */
export function isPurchasableRestaurantProduct(product) {
  return isPurchasableStorefrontProduct(product);
}

/**
 * Merge Roll Inn seed metadata onto live DB rows (images, slugs, sale flags).
 * Never injects preview-only seed rows — database is the source of truth.
 * @param {object[]} products
 */
export function enrichRestaurantProductsFromSeed(products = []) {
  return (products || []).filter(Boolean).map((p) => {
    if (!isPurchasableRestaurantProduct(p)) return p;

    const seed =
      seedProductBySku.get(String(p.sku || '').toLowerCase()) ||
      seedProductByName.get(String(p.name || '').trim().toLowerCase());

    const categorySlug =
      p.category_slug ||
      p.domain_data?.category_slug ||
      seed?.domain_data?.category_slug ||
      '';

    const imageUrl = normalizeStorefrontRemoteImageUrl(
      p.image_url || seed?.image_url || ''
    );

    const comparePrice =
      p.compare_price ??
      p.compare_at_price ??
      p.mrp ??
      seed?.compare_price ??
      null;

    const onSale =
      p.on_sale ??
      seed?.on_sale ??
      (comparePrice && Number(comparePrice) > Number(p.price));

    return {
      ...p,
      image_url: imageUrl || p.image_url,
      category_slug: categorySlug || p.category_slug,
      compare_price: comparePrice,
      compare_at_price: comparePrice,
      is_featured: p.is_featured || Boolean(seed?.is_featured),
      on_sale: Boolean(onSale),
      domain_data: {
        ...(seed?.domain_data || {}),
        ...(p.domain_data || {}),
        category_slug: categorySlug || p.domain_data?.category_slug,
      },
    };
  });
}

/**
 * Tenant menu catalog — DB products only, enriched from Roll Inn seed metadata.
 * @param {object[]} products
 * @param {string | null | undefined} [businessDomain]
 */
export function buildRestaurantShopCatalog(products = [], _businessDomain) {
  const purchasable = (products || []).filter(isPurchasableRestaurantProduct);
  return enrichRestaurantProductsFromSeed(purchasable);
}

function productComparePrice(p) {
  return p?.compare_price ?? p?.compare_at_price ?? p?.mrp ?? null;
}

/** @param {object[]} list @param {string} [sort] */
function sortRestaurantShopProducts(list, sort = 'featured') {
  switch (sort) {
    case 'price-asc':
      return [...list].sort((a, b) => Number(a.price) - Number(b.price));
    case 'price-desc':
      return [...list].sort((a, b) => Number(b.price) - Number(a.price));
    case 'name-asc':
      return [...list].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    case 'newest':
      return [...list].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    case 'popularity':
      return [...list].sort(
        (a, b) =>
          (Number(b.sales_count) || 0) - (Number(a.sales_count) || 0) ||
          (Number(b.rating) || 0) - (Number(a.rating) || 0)
      );
    case 'rating':
      return [...list].sort(
        (a, b) =>
          (Number(b.rating) || 0) - (Number(a.rating) || 0) ||
          (Number(b.review_count) || 0) - (Number(a.review_count) || 0)
      );
    case 'featured':
    default:
      return [...list].sort((a, b) => {
        const featuredDelta = Number(b.is_featured) - Number(a.is_featured);
        if (featuredDelta) return featuredDelta;
        return (Number(b.sales_count) || 0) - (Number(a.sales_count) || 0);
      });
  }
}

/**
 * Filter + paginate merged restaurant shop catalog (demo / enriched DB path).
 * @param {object[]} products
 * @param {object} filters
 * @param {string | null | undefined} [businessDomain]
 */
export function paginateRestaurantShopCatalog(products = [], filters = {}, businessDomain) {
  let list = buildRestaurantShopCatalog(products, businessDomain);

  if (filters.category) {
    list = filterProductsByCategorySlug(list, filters.category);
  }

  if (filters.search) {
    const term = String(filters.search).trim().toLowerCase();
    if (term) {
      list = list.filter((p) => {
        const name = String(p.name || '').toLowerCase();
        const desc = String(p.description || '').toLowerCase();
        const sku = String(p.sku || '').toLowerCase();
        const category = String(p.category_name || p.category || '').toLowerCase();
        return (
          name.includes(term) ||
          desc.includes(term) ||
          sku.includes(term) ||
          category.includes(term)
        );
      });
    }
  }

  if (filters.onSale) {
    list = list.filter((p) => {
      const compare = productComparePrice(p);
      return compare && Number(compare) > Number(p.price);
    });
  }

  if (filters.featured === 'only') {
    list = list.filter((p) => p.is_featured);
  }

  if (filters.inStock === true) {
    list = list.filter((p) => p.stock == null || Number(p.stock) > 0);
  }

  if (filters.minPrice != null) {
    list = list.filter((p) => Number(p.price) >= Number(filters.minPrice));
  }
  if (filters.maxPrice != null) {
    list = list.filter((p) => Number(p.price) <= Number(filters.maxPrice));
  }

  list = sortRestaurantShopProducts(list, filters.sort);

  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.max(1, Number(filters.limit) || 24);
  const total = list.length;
  const offset = (page - 1) * limit;

  return {
    products: list.slice(offset, offset + limit),
    total,
    hasMore: offset + limit < total,
  };
}

/** Prefer live catalog, then Roll Inn seed products. */
function mergeRestaurantProductPool(products = []) {
  if (Array.isArray(products) && products.length) return products;
  return RESTAURANT_SEED_PRODUCTS;
}

function productCategorySlug(p) {
  const slug = p?.category_slug || p?.domain_data?.category_slug;
  if (slug) return String(slug).toLowerCase();
  const name = String(p?.category || p?.category_name || '').trim().toLowerCase();
  return name ? name.replace(/\s+/g, '-') : '';
}

function productMatchesCategory(p, slug, label) {
  const slugKey = String(slug || '').toLowerCase();
  const labelKey = String(label || '').trim().toLowerCase();
  const pSlug = productCategorySlug(p);
  const pLabel = String(p?.category || p?.category_name || '').trim().toLowerCase();
  if (slugKey === 'deals') {
    return Boolean(p?.on_sale || p?.compare_price || /deal|combo/i.test(String(p?.name || '')));
  }
  if (slugKey && pSlug === slugKey) return true;
  if (labelKey && pLabel === labelKey) return true;
  return false;
}

function scoreCategoryHeroProduct(p) {
  let score = 0;
  const url = String(p?.image_url || '');
  if (!url) return -1;
  if (p?.is_featured) score += 5;
  if (p?.on_sale || p?.compare_price) score += 2;
  if (url.includes('/ProductImages/')) score += 3;
  if (/\.(jpg|jpeg|webp|png)$/i.test(url)) score += 1;
  return score;
}

/**
 * Best representative product photo for a menu category (ProductImages CDN).
 * @param {{ slug?: string; label?: string; products?: object[] }} params
 */
export function resolveRestaurantCategoryProductImage({ slug, label, products = [] }) {
  const pool = mergeRestaurantProductPool(products);
  const matches = pool.filter((p) => productMatchesCategory(p, slug, label) && p.image_url);
  if (!matches.length) return '';
  matches.sort((a, b) => scoreCategoryHeroProduct(b) - scoreCategoryHeroProduct(a));
  return matches[0].image_url;
}

/**
 * Resolve category visual — product photo first, then category banner.
 * @param {{ slug?: string; label?: string; products?: object[]; categoryImageUrl?: string }} params
 */
export function resolveRestaurantCategoryVisual({ slug, label, products = [], categoryImageUrl = '' }) {
  const fromProduct = resolveRestaurantCategoryProductImage({ slug, label, products });
  if (fromProduct) return fromProduct;
  if (categoryImageUrl) return categoryImageUrl;
  const seed = seedCategoryBySlug.get(String(slug || '').toLowerCase());
  return seed?.image_url || '';
}

/**
 * Backfill category hero images from Roll Inn seed when DB rows omit image_url.
 * @param {object[]} categories
 */
export function enrichRestaurantCategoriesWithSeedImages(categories) {
  return (categories || []).map((cat) => {
    if (cat?.image_url) return cat;
    const seed = seedCategoryBySlug.get(String(cat?.slug || '').toLowerCase());
    if (!seed?.image_url) return cat;
    return { ...cat, image_url: seed.image_url };
  });
}

/**
 * Ensure cuisine nav rows use product photos when available.
 * @param {object[]} items
 * @param {object[]} [products]
 */
export function enrichRestaurantCuisineNavImages(items, products = []) {
  return (items || []).map((item) => {
    const image = resolveRestaurantCategoryVisual({
      slug: item?.slug || item?.id,
      label: item?.label,
      products,
      categoryImageUrl: item?.image || '',
    });
    return image ? { ...item, image } : item;
  });
}

/** Shared demo homepage category highlights. */
export const RESTAURANT_DEMO_HOME_CATEGORY_SPECS = [
  {
    id: 'bbq',
    title: 'BBQ & grills',
    subtitle: 'Tikka, boti, and karahi specials',
    slug: 'bbq',
    href: '?category=bbq',
  },
  {
    id: 'biryani',
    title: 'Biryani & rice',
    subtitle: 'Handi biryani and classic rice dishes',
    slug: 'biryani',
    href: '?category=biryani',
  },
  {
    id: 'rolls',
    title: 'Signature rolls',
    subtitle: 'Behari, malai, and crispy rolls',
    slug: 'rolls',
    href: '?category=rolls',
  },
  {
    id: 'deals',
    title: 'Deals & combos',
    subtitle: 'Value meals and bundle savings',
    slug: 'deals',
    href: '?onSale=true',
  },
];

/**
 * Full demo category rail — product photos + accurate slugs.
 * @param {string} storeBase
 * @param {object[]} [products]
 */
export function buildRestaurantDemoCuisineIcons(storeBase, products = []) {
  const productsUrl = `${storeBase}/products`;
  return RESTAURANT_SEED_CATEGORIES.filter((row) => row.slug && row.name).map((row) => ({
    id: row.slug,
    label: row.name,
    slug: row.slug,
    image: resolveRestaurantCategoryVisual({
      slug: row.slug,
      label: row.name,
      products,
      categoryImageUrl: row.image_url || '',
    }),
    href:
      row.slug === 'deals'
        ? `${productsUrl}?onSale=true`
        : `${productsUrl}?category=${encodeURIComponent(row.slug)}`,
  }));
}

/**
 * Four-up spotlight cards with product-backed imagery.
 * @param {string} storeBase
 * @param {object[]} [products]
 */
export function buildRestaurantDemoSpotlightCards(storeBase, products = []) {
  const productsUrl = `${storeBase}/products`;
  return RESTAURANT_DEMO_HOME_CATEGORY_SPECS.map((card) => ({
    ...card,
    image: resolveRestaurantCategoryVisual({
      slug: card.slug,
      label: card.title,
      products,
    }),
    href: `${productsUrl}${card.href}`,
  }));
}

/**
 * Upper promo strip tiles with product-backed imagery.
 * @param {string} storeBase
 * @param {object[]} [products]
 */
export function buildRestaurantDemoPromoTiles(storeBase, products = []) {
  const productsUrl = `${storeBase}/products`;
  return RESTAURANT_DEMO_HOME_CATEGORY_SPECS.map((card) => ({
    id: card.id,
    title: card.title,
    image: resolveRestaurantCategoryVisual({
      slug: card.slug,
      label: card.title,
      products,
    }),
    href: `${productsUrl}${card.href}`,
  }));
}

/**
 * @param {string | null | undefined} businessDomain
 * @param {string | null | undefined} businessCategory
 */
export function shouldUseRestaurantSeedCatalog(businessDomain, businessCategory) {
  if (isDemoStoreDomain(businessDomain)) return true;
  return isRestaurantElevatedStore(businessCategory);
}

/**
 * @param {typeof RESTAURANT_SEED_PRODUCTS[number]} row
 */
export function mapRestaurantSeedRowToStorefrontProduct(row) {
  const name = String(row.name || 'Menu item');
  return {
    id: row.sku || name.toLowerCase().replace(/\s+/g, '-'),
    slug: null,
    sku: row.sku,
    name,
    price: row.price,
    compare_price: row.compare_price,
    compare_at_price: row.compare_price,
    image_url: normalizeStorefrontRemoteImageUrl(row.image_url),
    category_name: row.category,
    category: row.category,
    category_slug: row.domain_data?.category_slug || '',
    brand: row.brand,
    stock: row.stock ?? 999,
    is_featured: Boolean(row.is_featured),
    domain_data: row.domain_data || {},
    catalog_preview: true,
  };
}

const seedCategoryBySlug = new Map(
  RESTAURANT_SEED_CATEGORIES.map((row) => [String(row.slug || '').toLowerCase(), row])
);

/** @deprecated use enrichRestaurantProductsFromSeed */
export function enrichRestaurantProductsWithSeedImages(products) {
  return enrichRestaurantProductsFromSeed(products);
}

/**
 * Homepage / showcase pool — DB products enriched from seed; no preview-only rows.
 * @param {object[]} dbProducts
 * @param {string | null | undefined} businessDomain
 * @param {string | null | undefined} [businessCategory]
 */
export function resolveRestaurantShowcaseProducts(dbProducts, businessDomain, businessCategory) {
  const list = Array.isArray(dbProducts) ? dbProducts.filter(Boolean) : [];
  if (!shouldUseRestaurantSeedCatalog(businessDomain, businessCategory)) {
    return list.filter(isPurchasableRestaurantProduct);
  }
  return buildRestaurantShopCatalog(list, businessDomain);
}
