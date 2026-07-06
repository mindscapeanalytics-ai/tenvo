import { describe, it, expect } from 'vitest';
import {
  buildDemoPageSectionsSeed,
  mergeDemoPageSectionsIntoSettings,
  stripDemoAutoPageSections,
  isDemoAutoPageSection,
} from '@/lib/dataLab/demoPageSectionsSeed';
import { getActivePageSections } from '@/lib/storefront/storePageSections';

describe('demoPageSectionsSeed', () => {
  it('does not auto-seed full-width hero banners by default', () => {
    const sections = buildDemoPageSectionsSeed({
      domainKey: 'retail-shop',
      domainHandle: 'demo-retail',
      storefrontProfile: {
        announcement: 'Free delivery · Shop online',
        description: 'Everyday essentials and gifts.',
        accentColor: '#2563eb',
        freeShippingThreshold: 2500,
        businessHours: 'Mon - Sun, 10:00 AM - 10:00 PM',
        cover_image_url: 'https://images.unsplash.com/photo-1',
      },
      productImages: ['https://images.unsplash.com/photo-2'],
    });
    expect(sections).toEqual([]);
    expect(getActivePageSections(sections)).toHaveLength(0);
  });

  it('strips legacy demo-* auto banners', () => {
    const cleaned = stripDemoAutoPageSections({
      pageSections: [
        { id: 'demo-retail-after-hero', type: 'banner', enabled: true, imageUrl: 'https://x', design: 'image-only' },
        { id: 'owner-1', type: 'banner', enabled: true, title: 'Sale', placement: 'mid-page' },
      ],
    });
    expect(cleaned.pageSections).toHaveLength(1);
    expect(cleaned.pageSections[0].id).toBe('owner-1');
    expect(isDemoAutoPageSection({ id: 'demo-x' })).toBe(true);
  });

  it('does not overwrite existing owner pageSections', () => {
    const existing = [
      {
        id: 'owner-1',
        type: 'banner',
        enabled: true,
        placement: 'mid-page',
        title: 'Owner promo',
        sortOrder: 0,
      },
    ];
    const merged = mergeDemoPageSectionsIntoSettings({ pageSections: existing }, {
      domainKey: 'bakery',
      domainHandle: 'demo-bakery',
      storefrontProfile: { announcement: 'Fresh bakes' },
    });
    expect(merged.pageSections).toEqual(existing);
  });
});

describe('buildFitnessSupplementShowcase demo DB priority', () => {
  it('prefers DB UUID supplements over catalog_preview seed on demo domain', async () => {
    const { buildFitnessSupplementShowcase } = await import('@/lib/storefront/fitnessStorefront');
    const rows = buildFitnessSupplementShowcase(
      [
        {
          id: '11111111-2222-4333-8444-555555555555',
          name: 'Live Whey',
          sku: 'LW-001',
          category: 'Whey Protein',
          category_name: 'Whey Protein',
          price: 5000,
          stock: 10,
          domain_data: { supplementtype: 'whey' },
        },
      ],
      'demo-fitness',
      12
    );
    expect(rows.length).toBe(1);
    expect(rows[0].catalog_preview).toBeFalsy();
    expect(rows[0].id).toBe('11111111-2222-4333-8444-555555555555');
  });
});
