import { describe, it, expect } from 'vitest';
import { buildTenantHeroSlides } from '../elevatedStorefrontTenant.js';
import { nestAdminSettingsForHeroPreview, inferHeroVerticalKey } from '../heroSlides.js';
import { getHeroPreset } from '../heroPresets.js';

const DEMO_SLIDES = [
  {
    eyebrow: '{storeName}',
    title: 'Demo title',
    subtitle: 'Demo subtitle',
    image: 'https://cdn.example.com/demo.jpg',
    ctaLabel: 'Shop',
    ctaHref: '/products',
  },
];

describe('buildTenantHeroSlides', () => {
  it('prefers global storefront.heroSlides over cleared vertical slides', () => {
    const slides = buildTenantHeroSlides({
      settings: {
        storefront: {
          heroSlides: [
            {
              title: 'Owner banner',
              image: 'https://cdn.example.com/owner.webp',
              ctaHref: '/products?onSale=true',
            },
          ],
        },
      },
      settingsSlides: null,
      base: '/store/demo-pharmacy',
      storeName: 'City Pharmacy',
      demoSlides: DEMO_SLIDES,
      isDemo: true,
    });

    expect(slides[0].title).toBe('Owner banner');
    expect(slides[0].image).toBe('https://cdn.example.com/owner.webp');
    expect(slides[0].ctaHref).toBe('/store/demo-pharmacy/products?onSale=true');
  });

  it('does not treat empty placeholder slots as authoritative', () => {
    const slides = buildTenantHeroSlides({
      settings: {
        storefront: {
          heroSlides: [
            { title: '', subtitle: '', image: '', ctaLabel: '', ctaHref: '' },
            { title: '', subtitle: '', image: '', ctaLabel: '', ctaHref: '' },
          ],
        },
      },
      settingsSlides: [],
      base: '/store/demo-restaurant',
      storeName: 'Roll Inn',
      demoSlides: DEMO_SLIDES,
      isDemo: true,
    });

    expect(slides[0].title).toBe('Demo title');
    expect(slides[0].image).toBe('https://cdn.example.com/demo.jpg');
  });

  it('applies cover image to first default slide', () => {
    const slides = buildTenantHeroSlides({
      settings: {},
      base: '/store/demo-furniture',
      storeName: 'Woodin',
      coverImage: 'https://cdn.example.com/cover.webp',
      demoSlides: DEMO_SLIDES,
      isDemo: true,
    });

    expect(slides[0].image).toBe('https://cdn.example.com/cover.webp');
  });
});

describe('hero settings helpers', () => {
  it('maps elevated hero types to vertical keys', () => {
    expect(inferHeroVerticalKey('jewellery-elevated')).toBe('jewellery');
    expect(inferHeroVerticalKey('fashion-finder')).toBe('fashion');
    expect(inferHeroVerticalKey('grocery-finder')).toBe('supermarket');
    expect(inferHeroVerticalKey('auto-marketplace')).toBe('marketplace');
  });

  it('nests flat admin form settings for hero preview', () => {
    const nested = nestAdminSettingsForHeroPreview({
      heroSlides: [{ title: 'From branding', image: 'https://cdn.example.com/a.webp' }],
      pharmacy: { searchPlaceholder: 'Find medicines' },
      heroTitle: 'Generic',
    });

    expect(nested.storefront.heroSlides[0].title).toBe('From branding');
    expect(nested.storefront.pharmacy.searchPlaceholder).toBe('Find medicines');
    expect(nested.storefront.heroTitle).toBe('Generic');
  });

  it('applies nested admin hero slides for pharmacy preset', () => {
    const preset = getHeroPreset(
      'pharmacy',
      'demo-pharmacy',
      {
        heroSlides: [
          {
            title: 'Owner pharmacy slide',
            image: 'https://cdn.example.com/pharmacy.webp',
            ctaHref: '/products',
          },
        ],
      },
      { business_name: 'City Pharmacy' }
    );

    expect(preset.type).toBe('pharmacy-elevated');
    expect(preset.slides[0].title).toBe('Owner pharmacy slide');
    expect(preset.slides[0].image).toBe('https://cdn.example.com/pharmacy.webp');
  });
});
