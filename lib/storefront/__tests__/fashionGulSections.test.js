import { describe, it, expect } from 'vitest';
import {
  supportsFashionGulSections,
  resolveFashionHomeEdit,
  resolveFashionSaleMosaic,
  buildFashionSaleMosaicFromCatalog,
  enrichFashionSaleMosaicFromCatalog,
} from '../fashionGulSections.js';

describe('fashionGulSections', () => {
  it('supports editorial and jewellery verticals', () => {
    expect(supportsFashionGulSections('garments')).toBe(true);
    expect(supportsFashionGulSections('gems-jewellery')).toBe(true);
    expect(supportsFashionGulSections('pharmacy')).toBe(false);
  });

  it('resolves apparel home edit defaults for demo boutique', () => {
    const section = resolveFashionHomeEdit({}, 'boutique-fashion', 'demo-boutique', '/store/demo-boutique');
    expect(section?.title).toBe('The Style Edit');
    expect(section?.tiles.length).toBe(4);
    expect(section?.tiles[0].href).toContain('/products');
  });

  it('enriches home edit tiles from live categories', () => {
    const section = resolveFashionHomeEdit(
      {
        storefront: {
          fashion: {
            homeEdit: {
              title: 'Custom edit',
              tiles: [
                {
                  id: 'lawn-tile',
                  slot: 'hero',
                  href: '?category=lawn',
                  image: 'https://fallback.example/fallback.jpg',
                },
              ],
            },
          },
        },
      },
      'boutique-fashion',
      'live-boutique',
      '/store/live-boutique',
      [{ id: 'c1', name: 'Lawn', slug: 'lawn', product_count: 5 }],
      [{ id: 'p1', name: 'Digital Lawn 3pc', category_slug: 'lawn', category_name: 'Lawn', image_url: 'https://example.com/lawn.jpg' }]
    );
    expect(section?.tiles[0].href).toContain('category=lawn');
    expect(section?.tiles[0].image).toContain('example.com');
  });

  it('resolves sale mosaic with five columns for demo stores', () => {
    const section = resolveFashionSaleMosaic({}, 'garments', 'demo-boutique', '/store/demo-boutique');
    expect(section?.title).toBe('Sale');
    expect(section?.columns.length).toBe(5);
    expect(section?.columns[0].tiles[0].label).toBe('Kids');
    expect(section?.columns[0].tiles[0].href).toContain('/products');
  });

  it('builds live sale mosaic from inventory categories for non-demo stores', () => {
    const section = resolveFashionSaleMosaic(
      {},
      'boutique-fashion',
      'live-boutique',
      '/store/live-boutique',
      [
        { id: 'c1', name: 'Lawn', slug: 'lawn', product_count: 12 },
        { id: 'c2', name: 'Pret', slug: 'pret', product_count: 8 },
        { id: 'c3', name: 'Kids', slug: 'kids', product_count: 5 },
      ],
      [
        {
          id: 'p1',
          name: 'Digital Lawn',
          category_slug: 'lawn',
          category_name: 'Lawn',
          price: 4500,
          compare_price: 5200,
          image_url: 'https://example.com/lawn.jpg',
        },
      ]
    );
    expect(section?.columns.length).toBeGreaterThanOrEqual(2);
    expect(section?.columns[0].tiles[0].href).toContain('category=lawn');
    expect(section?.columns[0].tiles[0].desktop).toContain('example.com');
  });

  it('enriches owner sale mosaic tiles with live category slugs and photos', () => {
    const enriched = enrichFashionSaleMosaicFromCatalog(
      {
        title: 'Sale',
        columns: [
          {
            id: 'col-1',
            tiles: [
              {
                id: 'kids',
                label: 'Kids',
                href: '?category=kids-wear&onSale=true',
              },
            ],
          },
        ],
      },
      [{ id: 'c1', name: 'Kids Wear', slug: 'kids-wear', product_count: 4 }],
      [
        {
          id: 'p1',
          name: 'Kids Lawn',
          category_slug: 'kids-wear',
          image_url: 'https://example.com/kids.jpg',
          price: 2000,
          compare_price: 2500,
        },
      ],
      'garments'
    );
    expect(enriched.columns[0].tiles[0].href).toContain('category=kids-wear');
    expect(enriched.columns[0].tiles[0].desktop).toContain('example.com');
  });

  it('builds catalog mosaic with sale-first ranking', () => {
    const built = buildFashionSaleMosaicFromCatalog(
      [
        { id: 'c1', name: 'Basics', slug: 'basics', product_count: 20 },
        { id: 'c2', name: 'Sale Pret', slug: 'pret', product_count: 3 },
      ],
      [
        { id: 'p1', name: 'Basic Kurta', category_slug: 'basics', price: 3000 },
        {
          id: 'p2',
          name: 'Pret Suit',
          category_slug: 'pret',
          price: 5000,
          compare_price: 7000,
        },
      ],
      'garments'
    );
    expect(built?.columns[0].tiles[0].href).toContain('category=pret');
    expect(built?.columns[0].tiles[0].href).toContain('onSale=true');
  });

  it('uses jewellery-specific defaults for demo jewellery', () => {
    const home = resolveFashionHomeEdit({}, 'gems-jewellery', 'demo-jewellery', '/store/demo-jewellery');
    expect(home?.title).toBe('The Jewellery Edit');
  });
});
