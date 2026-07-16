import { describe, it, expect } from 'vitest';
import {
  getStoreMode,
  getJewelleryStorefrontConfig,
  buildDefaultJewelleryStorefrontSeed,
  resolveJewellerySearchPlaceholder,
} from '../jewelleryStorefront.js';
import { buildJewelleryHomeSections } from '../jewelleryHomeSections.js';
import { getHeroPreset } from '../heroPresets.js';

describe('jewelleryStorefront', () => {
  it('resolves beauty mode for salon-spa', () => {
    expect(getStoreMode('salon-spa')).toBe('beauty');
    expect(getStoreMode('gems-jewellery')).toBe('jewellery');
  });

  it('applies owner search placeholder override', () => {
    const placeholder = resolveJewellerySearchPlaceholder(
      { storefront: { jewellery: { searchPlaceholder: 'Custom search' } } },
      'demo',
      'gems-jewellery'
    );
    expect(placeholder).toBe('Custom search');
  });

  it('seeds mode-aware registration defaults', () => {
    const beauty = buildDefaultJewelleryStorefrontSeed('salon-spa');
    const jewellery = buildDefaultJewelleryStorefrontSeed('gems-jewellery');
    expect(beauty.jewellery.jewelleryEditTitle).toBe('The Beauty Edit');
    expect(jewellery.jewellery.jewelleryEditTitle).toBe('The Jewellery Edit');
  });

  it('uses jewellery-elevated hero for gems-jewellery and salon-spa', () => {
    const gems = getHeroPreset('gems-jewellery', 'demo-jewellery', {}, { business_name: 'Gems' });
    const salon = getHeroPreset('salon-spa', 'demo-salon', {}, { business_name: 'Salon' });
    expect(gems.type).toBe('jewellery-elevated');
    expect(salon.type).toBe('jewellery-elevated');
  });

  it('builds beauty homepage sections from catalog', () => {
    const sections = buildJewelleryHomeSections({
      businessDomain: 'demo-salon',
      businessCategory: 'salon-spa',
      categories: [{ id: '1', slug: 'polish', name: 'Polish', product_count: 3 }],
      products: [
        {
          id: 'p1',
          name: 'Gel Polish Rose',
          category_slug: 'polish',
          price: 1200,
          image_url: 'https://example.com/polish.jpg',
        },
      ],
    });
    expect(sections.jewelleryEdit.title).toBe('The Beauty Edit');
    expect(sections.categories.circles.length).toBeGreaterThanOrEqual(1);
  });

  it('respects section toggles from settings', () => {
    const config = getJewelleryStorefrontConfig(
      { storefront: { jewellery: { showOffers: false, offersTitle: 'Deals' } } },
      'demo',
      'gems-jewellery'
    );
    expect(config.showOffers).toBe(false);
    expect(config.offersTitle).toBe('Deals');
  });
});
