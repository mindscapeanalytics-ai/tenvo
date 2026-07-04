import { isDemoStoreDomain } from '@/lib/storefront/elevatedStorefrontTenant';
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { resolveStorefrontVertical } from '@/lib/config/storefrontDomains';
import { SUPERMARKET_SEED_PRODUCTS } from './supermarketDemoCatalog.js';

/**
 * @param {string | null | undefined} businessDomain
 * @param {string | null | undefined} businessCategory
 */
export function shouldUseSupermarketSeedCatalog(businessDomain, businessCategory) {
  if (isDemoStoreDomain(businessDomain)) return true;
  const key = resolveDomainKey(businessCategory);
  return resolveStorefrontVertical(key) === 'supermarket';
}

/**
 * @param {typeof SUPERMARKET_SEED_PRODUCTS[number]} row
 */
export function mapSupermarketSeedRowToStorefrontProduct(row) {
  const name = String(row.name || 'Product');
  return {
    id: row.sku || name.toLowerCase().replace(/\s+/g, '-'),
    slug: null,
    sku: row.sku,
    name,
    price: row.price,
    compare_price: row.compare_price,
    compare_at_price: row.compare_price,
    image_url: row.image_url,
    category_name: row.category,
    category: row.category,
    brand: row.brand,
    stock: row.stock ?? 24,
    is_featured: Boolean(row.is_featured),
    domain_data: row.domain_data || {},
    catalog_preview: true,
  };
}

/**
 * Demo supermarket: merge DB catalog with archive seed for full product rails.
 * @param {object[]} dbProducts
 * @param {string | null | undefined} businessDomain
 * @param {string | null | undefined} [businessCategory]
 */
export function resolveSupermarketShowcaseProducts(dbProducts, businessDomain, businessCategory) {
  const list = Array.isArray(dbProducts) ? dbProducts.filter(Boolean) : [];
  if (!shouldUseSupermarketSeedCatalog(businessDomain, businessCategory)) {
    return list;
  }

  if (list.length >= 12) {
    return enrichSupermarketProductsWithSeedImages(list);
  }

  const seedCards = SUPERMARKET_SEED_PRODUCTS.map(mapSupermarketSeedRowToStorefrontProduct);
  if (!list.length) {
    return seedCards;
  }

  const seen = new Set(list.map((p) => String(p.sku || p.name || '').toLowerCase()));
  const merged = [...list];
  for (const seed of seedCards) {
    const key = String(seed.sku || seed.name || '').toLowerCase();
    if (seen.has(key)) continue;
    merged.push(seed);
    seen.add(key);
  }
  return merged;
}

/**
 * @param {object[]} products
 */
export function enrichSupermarketProductsWithSeedImages(products) {
  const bySku = new Map(
    SUPERMARKET_SEED_PRODUCTS.map((row) => [String(row.sku || '').toLowerCase(), row])
  );
  const byName = new Map(
    SUPERMARKET_SEED_PRODUCTS.map((row) => [String(row.name || '').trim().toLowerCase(), row])
  );

  return products.map((product) => {
    const seed =
      bySku.get(String(product.sku || '').toLowerCase())
      || byName.get(String(product.name || '').trim().toLowerCase());
    if (!seed?.image_url) return product;
    return {
      ...product,
      image_url: product.image_url?.startsWith('http') ? product.image_url : seed.image_url,
      brand: product.brand || seed.brand,
      category_name: product.category_name || product.category || seed.category,
      compare_price: product.compare_price ?? product.compare_at_price ?? seed.compare_price,
      compare_at_price: product.compare_at_price ?? product.compare_price ?? seed.compare_price,
    };
  });
}
