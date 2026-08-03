/**
 * Product gallery helpers — up to 3 images for all domains (Shopify-style).
 * Primary thumbnail is always slot 0 → products.image_url; gallery → products.images JSON.
 */

export const MAX_PRODUCT_IMAGES = 3;

/**
 * URLs safe to render on public storefront / next img.
 * @param {string} url
 */
export function isUsableProductImageUrl(url) {
  const u = typeof url === 'string' ? url.trim() : '';
  if (!u) return false;
  return (
    u.startsWith('https://') ||
    u.startsWith('http://') ||
    u.startsWith('data:') ||
    u.startsWith('/')
  );
}

/**
 * Multi-image product uploads are enabled for every domain.
 * Kept as a helper for API stability (ProductForm / callers).
 * @param {string | null | undefined} [_category]
 */
export function isMultiProductImagesEnabled(_category) {
  return true;
}

/**
 * Coerce DB / API `images` into an array (pg may return JSON string).
 * @param {unknown} raw
 * @returns {unknown[]}
 */
export function coerceProductImagesArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (!t || t === '[]') return [];
    try {
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
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

  for (const item of coerceProductImagesArray(product.images)) push(item);
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

/**
 * Sync gallery JSON + primary URL on a product-like object (storefront reads).
 * @param {{ name?: string; image_url?: string | null; images?: unknown } | null | undefined} product
 */
export function enrichProductWithNormalizedImages(product) {
  if (!product || typeof product !== 'object') return product;
  const pack = productImagesFromUrls(
    normalizeProductImageUrls(product).filter(isUsableProductImageUrl),
    String(product.name || '')
  );
  return {
    ...product,
    images: pack.images,
    image_url: pack.image_url,
  };
}

/**
 * Gallery slides for PDP / ProductGallery. Merchant URLs first; optional catalog fallback.
 * @param {{ name?: string; image_url?: string | null; images?: unknown } | null | undefined} product
 * @param {{ catalogFallback?: string | null }} [opts]
 * @returns {{ url: string; alt: string; primary?: boolean }[]}
 */
export function resolveStorefrontProductGallery(product, opts = {}) {
  const name = String(product?.name || '');
  const urls = normalizeProductImageUrls(product || {}).filter(isUsableProductImageUrl);
  if (urls.length > 0) {
    return buildProductImagesJson(urls, name);
  }
  const catalog = typeof opts.catalogFallback === 'string' ? opts.catalogFallback.trim() : '';
  if (catalog && isUsableProductImageUrl(catalog)) {
    return [{ url: catalog, alt: name, primary: true }];
  }
  return [];
}
