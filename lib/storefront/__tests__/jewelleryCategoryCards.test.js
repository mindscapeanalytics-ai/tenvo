import { describe, it, expect } from 'vitest';
import {
  resolveJewelleryCategoryCards,
  mergeJewelleryCardFields,
  JEWELLERY_HERO_CARD_SLOTS,
  BEAUTY_HERO_CARD_SLOTS,
  JEWELLERY_EDIT_CARD_SLOTS,
} from '../jewelleryCategoryCards.js';

describe('mergeJewelleryCardFields', () => {
  it('keeps inventory values when owner fields are blank', () => {
    const resolved = {
      id: 'gold',
      label: 'Gold',
      desc: 'Rings & sets',
      href: '/store/demo/products?category=gold',
      image: 'https://cdn.example/gold.jpg',
      categorySlug: 'gold',
    };
    const merged = mergeJewelleryCardFields(resolved, {
      id: 'gold',
      label: 'Fine Gold',
      desc: '',
      image: null,
      href: undefined,
    });
    expect(merged.label).toBe('Fine Gold');
    expect(merged.desc).toBe('Rings & sets');
    expect(merged.image).toBe('https://cdn.example/gold.jpg');
    expect(merged.href).toBe('/store/demo/products?category=gold');
  });
});

describe('resolveJewelleryCategoryCards', () => {
  const base = '/store/demo-jewellery';

  const categories = [
    { id: 'c1', slug: 'gold', name: 'Gold', product_count: 4, image_url: null },
    { id: 'c2', slug: 'diamonds', name: 'Diamonds', product_count: 3 },
    { id: 'c3', slug: 'bridal', name: 'Bridal', product_count: 2 },
  ];

  const products = [
    {
      id: 'p1',
      name: '22K Gold Band',
      category_id: 'c1',
      category_slug: 'gold',
      category_name: 'Gold',
      image_url: 'https://cdn.example/gold-band.jpg',
    },
    {
      id: 'p2',
      name: 'Solitaire Diamond Ring',
      category_id: 'c2',
      category_slug: 'diamonds',
      image_url: 'https://cdn.example/diamond.jpg',
    },
    {
      id: 'p3',
      name: 'Bridal Set',
      category_id: 'c3',
      category_slug: 'bridal',
      image_url: 'https://cdn.example/bridal.jpg',
    },
  ];

  it('resolves hero cards from live inventory images and category hrefs', () => {
    const cards = resolveJewelleryCategoryCards({
      base,
      mode: 'jewellery',
      surface: 'hero',
      categories,
      products,
      businessCategory: 'gems-jewellery',
    });

    expect(cards).toHaveLength(4);
    const gold = cards[0];
    expect(gold.label).toBe('Gold');
    expect(gold.href).toContain('category=gold');
    expect(gold.image).toBe('https://cdn.example/gold-band.jpg');
  });

  it('applies per-field owner overrides without wiping inventory image', () => {
    const cards = resolveJewelleryCategoryCards({
      base,
      mode: 'jewellery',
      surface: 'hero',
      categories,
      products,
      businessCategory: 'gems-jewellery',
      ownerTiles: [
        { id: 'gold', label: 'Hallmarked Gold', image: '' },
      ],
    });

    expect(cards[0].label).toBe('Hallmarked Gold');
    expect(cards[0].image).toBe('https://cdn.example/gold-band.jpg');
  });

  it('falls back when owner categorySlug is missing from catalog', () => {
    const cards = resolveJewelleryCategoryCards({
      base,
      mode: 'jewellery',
      surface: 'hero',
      categories,
      products,
      businessCategory: 'gems-jewellery',
      ownerTiles: [
        { id: 'gold', categorySlug: 'does-not-exist', label: 'Custom' },
      ],
    });

    expect(cards[0].label).toBe('Custom');
    expect(cards[0].href).toContain('category=gold');
    expect(cards[0].image).toBe('https://cdn.example/gold-band.jpg');
  });

  it('builds mosaic slots with inventory-backed images', () => {
    const cards = resolveJewelleryCategoryCards({
      base,
      mode: 'jewellery',
      surface: 'edit',
      categories,
      products,
      businessCategory: 'gems-jewellery',
    });

    expect(cards.map((c) => c.slot)).toEqual(['hero', 'banner', 'half-left', 'half-right']);
    expect(cards[0].eyebrow.toLowerCase()).toContain('gold');
    expect(cards[0].image).toBe('https://cdn.example/gold-band.jpg');
    expect(cards[0].ctaLabel).toBe('EXPLORE');
  });

  it('uses beauty slot defaults for salon-spa mode', () => {
    const beautyCats = [
      { id: 'b1', slug: 'polish', name: 'Polish', product_count: 2 },
    ];
    const beautyProducts = [
      {
        id: 'bp1',
        name: 'Gel Rose',
        category_slug: 'polish',
        category_id: 'b1',
        image_url: 'https://cdn.example/polish.jpg',
      },
    ];
    const cards = resolveJewelleryCategoryCards({
      base: '/store/demo-salon',
      mode: 'beauty',
      surface: 'hero',
      categories: beautyCats,
      products: beautyProducts,
      businessCategory: 'salon-spa',
    });

    expect(cards[0].id).toBe('polish');
    expect(cards[0].href).toContain('category=polish');
    expect(cards[0].image).toBe('https://cdn.example/polish.jpg');
  });

  it('exports four hero and edit slot defs per mode', () => {
    expect(JEWELLERY_HERO_CARD_SLOTS).toHaveLength(4);
    expect(BEAUTY_HERO_CARD_SLOTS).toHaveLength(4);
    expect(JEWELLERY_EDIT_CARD_SLOTS).toHaveLength(4);
  });
});
