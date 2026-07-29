/**
 * Product gallery helpers — up to 3 images for all domains (Shopify-style).
 * Primary thumbnail is always slot 0 → products.image_url; gallery → products.images JSON.
 */

export const MAX_PRODUCT_IMAGES = 3;

/**
 * Multi-image product uploads are enabled for every domain.
 * Kept as a helper for API stability (ProductForm / callers).
 * @param {string | null | undefined} [_category]
 */
export function isMultiProductImagesEnabled(_category) {
  return true;
}

/**
 * Normalize stored product images + legacy image_url into URL strings (max 3).
 * @param {{ image_url?: string | null; images?: unknown }} product
 */
export function normalizeProductImageUrls(product = {}) {
  const urls = [];
  const push = (raw) => {
    const u = typeof raw === 'string' ? raw.trim() : typeof raw?.url === 'string' ? raw.url.trim() : '';
    if (u && !urls.includes(u)) urls.push(u);
  };

  if (Array.isArray(product.images)) {
    for (const item of product.images) push(item);
  }
  push(product.image_url);

  return urls.slice(0, MAX_PRODUCT_IMAGES);
}

/**
 * @param {string[]} urls
 * @param {string} [productName]
 */
export function buildProductImagesJson(urls, productName = '') {
  const alt = typeof productName === 'string' ? productName.trim() : '';
  return urls
    .filter((u) => typeof u === 'string' && u.trim())
    .slice(0, MAX_PRODUCT_IMAGES)
    .map((url, i) => ({
      url: url.trim(),
      alt,
      primary: i === 0,
    }));
}

/**
 * @param {string[]} urls
 * @param {string} [productName]
 */
export function productImagesFromUrls(urls, productName = '') {
  const images = buildProductImagesJson(urls, productName);
  return {
    images,
    image_url: images[0]?.url || null,
  };
}
