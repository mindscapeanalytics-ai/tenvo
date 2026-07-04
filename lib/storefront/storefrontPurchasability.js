import { isStorefrontProductUuid } from '@/lib/utils/storefrontProductRef';

/**
 * Cross-domain: a product row is orderable when it is a tenant UUID (not preview/seed).
 * @param {object | null | undefined} product
 */
export function isPurchasableStorefrontProduct(product) {
  return Boolean(product?.id && isStorefrontProductUuid(product.id) && !product.catalog_preview);
}

/**
 * @param {object | null | undefined} item — cart line
 */
export function isPurchasableCartLine(item) {
  return isStorefrontProductUuid(item?.productId);
}

/**
 * @param {object[]} products
 */
export function filterPurchasableStorefrontProducts(products) {
  return (products || []).filter(isPurchasableStorefrontProduct);
}

/**
 * Safe PDP / search href — preview rows go to catalog search, not a 404 slug.
 * @param {object} product
 * @param {string} businessDomain
 */
export function resolveStorefrontProductBrowseHref(product, businessDomain) {
  const name = product?.name || '';
  if (product?.catalog_preview || !isStorefrontProductUuid(product?.id)) {
    return `/store/${businessDomain}/products?search=${encodeURIComponent(name)}`;
  }
  return `/store/${businessDomain}/products/${product.slug || product.id}`;
}
