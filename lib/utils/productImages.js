/**
 * Multi-image product uploads for visual/catalog domains.
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { resolveStorefrontVertical } from '@/lib/config/storefrontDomains';
import { isFashionEditorialStore } from '@/lib/storefront/fashionEditorial';

export const MAX_PRODUCT_IMAGES = 3;

const MULTI_IMAGE_VERTICALS = new Set([
  'fashion-clothing',
  'luxury-fashion',
  'furniture',
  'electronics-tech',
]);

const MULTI_IMAGE_CANONICALS = new Set([
  'boutique-fashion',
  'textile-wholesale',
  'garments',
  'leather-footwear',
  'gems-jewellery',
  'mobile',
  'mobile-phone-shop',
  'electronics-goods',
  'computer-hardware',
  'electrical',
  'furniture',
  'home-decor',
  'retail-shop',
  'beauty-salon',
  'spa-wellness',
  'paint',
]);

/**
 * @param {string | null | undefined} category
 */
export function isMultiProductImagesEnabled(category) {
  const key = resolveDomainKey(category);
  if (MULTI_IMAGE_CANONICALS.has(key)) return true;
  if (isFashionEditorialStore(category)) return true;
  const vertical = resolveStorefrontVertical(key);
  return MULTI_IMAGE_VERTICALS.has(vertical);
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
