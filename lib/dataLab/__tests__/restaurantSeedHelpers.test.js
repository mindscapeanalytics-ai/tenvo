import { describe, it, expect } from 'vitest';
import {
  resolveRestaurantShowcaseProducts,
  shouldUseRestaurantSeedCatalog,
  mapRestaurantSeedRowToStorefrontProduct,
  buildRestaurantShopCatalog,
  enrichRestaurantProductsFromSeed,
  isPurchasableRestaurantProduct,
} from '../restaurantSeedHelpers.js';
import { RESTAURANT_SEED_PRODUCTS } from '../restaurantDemoCatalog.js';

describe('restaurantSeedHelpers', () => {
  it('uses seed catalog for demo restaurant domains', () => {
    expect(shouldUseRestaurantSeedCatalog('demo-restaurant', 'restaurant-cafe')).toBe(true);
    expect(shouldUseRestaurantSeedCatalog('my-shop', 'retail')).toBe(false);
  });

  it('returns empty showcase when DB catalog is empty (no preview rows)', () => {
    const products = resolveRestaurantShowcaseProducts([], 'demo-restaurant', 'restaurant-cafe');
    expect(products).toEqual([]);
  });

  it('enriches DB rows from seed metadata by SKU', () => {
    const seed = RESTAURANT_SEED_PRODUCTS[0];
    const dbRow = {
      id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      sku: seed.sku,
      name: seed.name,
      price: seed.price,
      stock: 50,
    };
    const enriched = enrichRestaurantProductsFromSeed([dbRow])[0];
    expect(enriched.image_url).toContain('services.eatx.pk');
    expect(enriched.category_slug).toBeTruthy();
    expect(isPurchasableRestaurantProduct(enriched)).toBe(true);
  });

  it('buildRestaurantShopCatalog drops preview-only rows', () => {
    const preview = mapRestaurantSeedRowToStorefrontProduct(RESTAURANT_SEED_PRODUCTS[0]);
    const catalog = buildRestaurantShopCatalog([preview], 'demo-restaurant');
    expect(catalog).toEqual([]);
  });

  it('maps seed rows to storefront preview shape for scripts only', () => {
    const row = mapRestaurantSeedRowToStorefrontProduct(RESTAURANT_SEED_PRODUCTS[0]);
    expect(row.name).toBeTruthy();
    expect(row.image_url).toBeTruthy();
    expect(row.image_url).toContain('services.eatx.pk');
    expect(row.catalog_preview).toBe(true);
    expect(row.category_slug).toBeTruthy();
  });
});
