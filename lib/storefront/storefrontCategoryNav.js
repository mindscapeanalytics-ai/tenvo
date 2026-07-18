/**
 * Shared public storefront category navigation helpers (client + server safe).
 */
import { slugifyCategoryName } from '@/lib/utils/registrationSeed';

/** URL params that narrow the product result set (cleared when changing category). */
export const STOREFRONT_ATTRIBUTE_FILTER_KEYS = Object.freeze([
  'search',
  'searchMode',
  'minPrice',
  'maxPrice',
  'inStock',
  'onSale',
  'featured',
  'brand',
  'fabric',
  'sourcing',
  'size',
  'model',
  'year',
  'engine',
  'engineNo',
  'class',
  'vehicleType',
  'body',
  'fuel',
  'condition',
  'equipmentType',
  'vesselType',
  'systemCondition',
  'manufacturer',
  'otc',
  'rx',
  'page',
]);

/**
 * Canonical category query value for URLs and comparisons.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function normalizeStorefrontCategoryParam(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[0-9a-f-]{36}$/i.test(raw)) return raw.toLowerCase();
  return slugifyCategoryName(raw);
}

/**
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 */
export function storefrontCategoriesMatch(a, b) {
  const left = normalizeStorefrontCategoryParam(a);
  const right = normalizeStorefrontCategoryParam(b);
  if (!left || !right) return false;
  return left === right;
}

/**
 * Resolve display category from list using slug or name.
 * @param {Array<{ slug?: string; name?: string }>} categories
 * @param {string | null | undefined} param
 */
export function findStorefrontCategory(categories, param) {
  if (!param || !Array.isArray(categories)) return null;
  return (
    categories.find(
      (c) =>
        storefrontCategoriesMatch(c.slug, param) || storefrontCategoriesMatch(c.name, param)
    ) || null
  );
}

/**
 * Build `/store/{domain}/products` href.
 * Category changes replace attribute filters; sort/view can be preserved.
 *
 * @param {string} businessDomain
 * @param {{
 *   category?: string | null,
 *   sort?: string | null,
 *   view?: string | null,
 *   searchParams?: URLSearchParams | Record<string, string> | null,
 *   preserveSortView?: boolean,
 *   clearAttributeFilters?: boolean,
 *   extra?: Record<string, string | null | undefined>,
 * }} [opts]
 */
export function buildStoreProductsHref(businessDomain, opts = {}) {
  const base = `/store/${businessDomain}/products`;
  const params = new URLSearchParams();

  const fromSearch =
    opts.searchParams instanceof URLSearchParams
      ? opts.searchParams
      : opts.searchParams && typeof opts.searchParams === 'object'
        ? new URLSearchParams(
            Object.entries(opts.searchParams)
              .filter(([, v]) => v != null && v !== '')
              .map(([k, v]) => [k, String(v)])
          )
        : null;

  if (opts.preserveSortView && fromSearch) {
    const sort = fromSearch.get('sort');
    const view = fromSearch.get('view');
    if (sort) params.set('sort', sort);
    if (view) params.set('view', view);
  } else {
    if (opts.sort) params.set('sort', String(opts.sort));
    if (opts.view) params.set('view', String(opts.view));
  }

  if (opts.clearAttributeFilters === false && fromSearch) {
    for (const [key, value] of fromSearch.entries()) {
      if (key === 'category' || key === 'page') continue;
      if (!params.has(key)) params.set(key, value);
    }
  }

  const category = normalizeStorefrontCategoryParam(opts.category);
  if (category) params.set('category', category);

  if (opts.extra && typeof opts.extra === 'object') {
    for (const [key, value] of Object.entries(opts.extra)) {
      if (value == null || value === '') params.delete(key);
      else params.set(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
