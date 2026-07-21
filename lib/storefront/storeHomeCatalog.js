import 'server-only';

import pool from '@/lib/db';
import { actionFailure } from '@/lib/actions/_shared/result';
import {
  fetchStorefrontProductsOnClient,
  fetchStorefrontCategoriesOnClient,
} from '@/lib/actions/storefront/products';
import { cacheStorefrontRead } from '@/lib/storefront/storefrontCachedRead';
import {
  storefrontCatalogTag,
  STOREFRONT_CATALOG_REVALIDATE_SEC,
} from '@/lib/storefront/storefrontCacheTags';

const EMPTY_PRODUCTS = { success: false, products: [], total: 0 };

/**
 * Build a minimal query plan for the storefront homepage.
 * Elevated verticals only fetch rails their section builders actually use.
 * @param {{
 *   editorialHero?: boolean;
 *   dealershipHero?: boolean;
 *   marketplaceHero?: boolean;
 *   pharmacyElevatedHero?: boolean;
 *   furnitureElevatedHero?: boolean;
 *   tilesElevatedHero?: boolean;
 *   tyreElevatedHero?: boolean;
 *   restaurantElevatedHero?: boolean;
 *   fitnessElevatedHero?: boolean;
 *   supermarketElevatedHero?: boolean;
 *   jewelleryElevatedHero?: boolean;
 *   autoPartsHero?: boolean;
 *   marinePartsHero?: boolean;
 *   needsCatalogBackfill?: boolean;
 *   restaurantDemo?: boolean;
 * }} flags
 */
export function buildStoreHomeCatalogPlan(flags = {}) {
  const popularityVertical =
    flags.editorialHero ||
    flags.pharmacyElevatedHero ||
    flags.furnitureElevatedHero ||
    flags.tilesElevatedHero ||
    flags.tyreElevatedHero ||
    flags.restaurantElevatedHero ||
    flags.fitnessElevatedHero ||
    flags.supermarketElevatedHero ||
    flags.jewelleryElevatedHero ||
    flags.needsCatalogBackfill;

  const featuredVertical =
    flags.dealershipHero || flags.marketplaceHero || flags.autoPartsHero || flags.marinePartsHero;

  const fashionOrJewelleryRails = flags.editorialHero || flags.jewelleryElevatedHero;

  const anyElevated =
    popularityVertical ||
    featuredVertical ||
    flags.editorialHero ||
    flags.jewelleryElevatedHero;

  let popularityLimit = 48;
  if (flags.editorialHero || flags.jewelleryElevatedHero) popularityLimit = 80;
  // Homepage showcase only — full menu loads on /products with its own pagination.
  if (flags.restaurantElevatedHero && flags.restaurantDemo) popularityLimit = 80;

  return {
    needFeatured: !anyElevated || featuredVertical,
    featuredLimit: flags.dealershipHero
      ? 24
      : flags.marketplaceHero
        ? 80
        : flags.autoPartsHero || flags.marinePartsHero
          ? 48
          : 12,
    // Fashion/jewellery section builders need newest + on-sale rails.
    needNewest: !anyElevated || fashionOrJewelleryRails,
    newestLimit: 16,
    needOnSale: !anyElevated || fashionOrJewelleryRails,
    onSaleLimit: 12,
    // Featured verticals also fetch popularity as a fallback when featured is empty/fails.
    needPopularity: Boolean(popularityVertical || featuredVertical),
    popularityLimit: featuredVertical && !popularityVertical ? Math.max(popularityLimit, 40) : popularityLimit,
    needCategories: true,
  };
}

function planCacheKey(plan) {
  return [
    plan.needFeatured ? `f${plan.featuredLimit}` : 'f0',
    plan.needNewest ? `n${plan.newestLimit}` : 'n0',
    plan.needOnSale ? `s${plan.onSaleLimit}` : 's0',
    plan.needPopularity ? `p${plan.popularityLimit}` : 'p0',
    plan.needCategories ? 'c1' : 'c0',
  ].join('|');
}

/**
 * @param {import('@/lib/actions/_shared/result').ActionResult} result
 */
function asProductSlice(result, limit) {
  if (!result?.success) return EMPTY_PRODUCTS;
  const products = (result.products || []).slice(0, limit);
  return {
    success: true,
    products,
    total: result.total ?? products.length,
  };
}

/**
 * Prefer a successful non-empty primary rail; fall back to secondary (e.g. popularity).
 * @param {import('@/lib/actions/_shared/result').ActionResult} primary
 * @param {import('@/lib/actions/_shared/result').ActionResult} fallback
 * @param {number} limit
 */
function preferProductSlice(primary, fallback, limit) {
  const first = asProductSlice(primary, limit);
  if (first.success && first.products.length > 0) return first;
  const second = asProductSlice(fallback, limit);
  if (second.success && second.products.length > 0) return second;
  return first.success ? first : second;
}

/**
 * Fetch homepage catalog rails in parallel via the shared pool (no long-held client).
 * @param {string} businessId
 * @param {ReturnType<typeof buildStoreHomeCatalogPlan>} plan
 */
async function fetchStoreHomeCatalogUncached(businessId, plan) {
  if (!businessId) {
    return actionFailure('INVALID_INPUT', 'Business ID is required');
  }

  try {
    const [featured, newest, onSale, popularity, categories] = await Promise.all([
      plan.needFeatured
        ? fetchStorefrontProductsOnClient(pool, businessId, {
            sort: 'featured',
            limit: plan.featuredLimit,
          })
        : Promise.resolve(EMPTY_PRODUCTS),
      plan.needNewest
        ? fetchStorefrontProductsOnClient(pool, businessId, {
            sort: 'newest',
            limit: plan.newestLimit,
          })
        : Promise.resolve(EMPTY_PRODUCTS),
      plan.needOnSale
        ? fetchStorefrontProductsOnClient(pool, businessId, {
            sort: 'featured',
            limit: plan.onSaleLimit,
            onSale: true,
          })
        : Promise.resolve(EMPTY_PRODUCTS),
      plan.needPopularity
        ? fetchStorefrontProductsOnClient(pool, businessId, {
            sort: 'popularity',
            limit: plan.popularityLimit,
          })
        : Promise.resolve(EMPTY_PRODUCTS),
      plan.needCategories
        ? fetchStorefrontCategoriesOnClient(pool, businessId)
        : Promise.resolve({ success: false, categories: [] }),
    ]);

    return {
      success: true,
      featured,
      newest,
      onSale,
      popularity,
      categories,
    };
  } catch (error) {
    console.error('[fetchStoreHomeCatalogUncached] Error:', error);
    return actionFailure('DATABASE_ERROR', error.message);
  }
}

/**
 * Cached homepage catalog bundle.
 * @param {string} businessId
 * @param {ReturnType<typeof buildStoreHomeCatalogPlan>} plan
 */
export async function getStoreHomeCatalog(businessId, plan) {
  const cacheKey = planCacheKey(plan);

  return cacheStorefrontRead(
    () => fetchStoreHomeCatalogUncached(businessId, plan),
    ['storefront-home-catalog', String(businessId), cacheKey],
    {
      tags: [storefrontCatalogTag(businessId), 'storefront-catalog'],
      revalidate: STOREFRONT_CATALOG_REVALIDATE_SEC,
    }
  );
}

/**
 * Map bundled catalog results to the legacy per-rail shape used by the store homepage.
 * @param {Awaited<ReturnType<typeof getStoreHomeCatalog>>} bundle
 * @param {ReturnType<typeof buildStoreHomeCatalogPlan>} plan
 * @param {{
 *   editorialHero?: boolean;
 *   dealershipHero?: boolean;
 *   marketplaceHero?: boolean;
 *   pharmacyElevatedHero?: boolean;
 *   furnitureElevatedHero?: boolean;
 *   tilesElevatedHero?: boolean;
 *   tyreElevatedHero?: boolean;
 *   restaurantElevatedHero?: boolean;
 *   fitnessElevatedHero?: boolean;
 *   supermarketElevatedHero?: boolean;
 *   jewelleryElevatedHero?: boolean;
 *   autoPartsHero?: boolean;
 *   marinePartsHero?: boolean;
 *   needsCatalogBackfill?: boolean;
 * }} flags
 */
export function mapStoreHomeCatalogRails(bundle, plan, flags) {
  if (!bundle?.success) {
    const empty = EMPTY_PRODUCTS;
    return {
      featuredResult: empty,
      newArrivalsResult: empty,
      categoriesResult: { success: false, categories: [] },
      onSaleResult: empty,
      topCatalogResult: empty,
      catalogSnapshotResult: empty,
      dealershipCatalogResult: empty,
      marketplaceCatalogResult: empty,
      pharmacyCatalogResult: empty,
      furnitureCatalogResult: empty,
      tilesCatalogResult: empty,
      restaurantCatalogResult: empty,
      fitnessCatalogResult: empty,
      supermarketCatalogResult: empty,
      autoPartsCatalogResult: empty,
      marinePartsCatalogResult: empty,
      catalogBackfillResult: empty,
    };
  }

  const featuredResult = asProductSlice(bundle.featured, plan.featuredLimit || 12);
  const newArrivalsResult = bundle.newest?.success ? bundle.newest : EMPTY_PRODUCTS;
  const categoriesResult = bundle.categories?.success
    ? bundle.categories
    : { success: false, categories: [] };
  const onSaleResult = bundle.onSale?.success ? bundle.onSale : EMPTY_PRODUCTS;
  const popularity = bundle.popularity?.success ? bundle.popularity : EMPTY_PRODUCTS;

  return {
    featuredResult,
    newArrivalsResult,
    categoriesResult,
    onSaleResult,
    topCatalogResult: flags.editorialHero ? asProductSlice(popularity, 40) : EMPTY_PRODUCTS,
    catalogSnapshotResult: (flags.editorialHero || flags.jewelleryElevatedHero) ? asProductSlice(popularity, 80) : EMPTY_PRODUCTS,
    dealershipCatalogResult: flags.dealershipHero
      ? preferProductSlice(bundle.featured, popularity, 24)
      : EMPTY_PRODUCTS,
    marketplaceCatalogResult: flags.marketplaceHero
      ? preferProductSlice(bundle.featured, popularity, 80)
      : EMPTY_PRODUCTS,
    pharmacyCatalogResult: flags.pharmacyElevatedHero ? asProductSlice(popularity, 48) : EMPTY_PRODUCTS,
    furnitureCatalogResult: flags.furnitureElevatedHero ? asProductSlice(popularity, 48) : EMPTY_PRODUCTS,
    tilesCatalogResult: flags.tilesElevatedHero ? asProductSlice(popularity, 48) : EMPTY_PRODUCTS,
    tyreCatalogResult: flags.tyreElevatedHero ? asProductSlice(popularity, 48) : EMPTY_PRODUCTS,
    restaurantCatalogResult: flags.restaurantElevatedHero ? popularity : EMPTY_PRODUCTS,
    fitnessCatalogResult: flags.fitnessElevatedHero ? asProductSlice(popularity, 48) : EMPTY_PRODUCTS,
    supermarketCatalogResult: flags.supermarketElevatedHero ? asProductSlice(popularity, 48) : EMPTY_PRODUCTS,
    autoPartsCatalogResult: flags.autoPartsHero
      ? preferProductSlice(bundle.featured, popularity, 48)
      : EMPTY_PRODUCTS,
    marinePartsCatalogResult: flags.marinePartsHero
      ? preferProductSlice(bundle.featured, popularity, 48)
      : EMPTY_PRODUCTS,
    catalogBackfillResult: flags.needsCatalogBackfill ? asProductSlice(popularity, 12) : EMPTY_PRODUCTS,
  };
}
