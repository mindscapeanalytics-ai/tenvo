import { describe, it, expect } from 'vitest';
import {
  normalizePageSections,
  sanitizeStoreCtaHref,
  getActivePageSections,
  filterPageSectionsByPlacement,
  normalizePlacement,
  resolveBannerFrameClasses,
  MAX_BANNERS_PER_PLACEMENT,
  MAX_PAGE_SECTIONS,
  countSectionsForPlacement,
  canAddSectionAtPlacement,
  resolveDefaultPlacement,
} from '../storePageSections.js';

describe('storePageSections', () => {
  it('sanitizes relative and absolute CTA links', () => {
    expect(sanitizeStoreCtaHref('/products?onSale=true')).toBe('/products?onSale=true');
    expect(sanitizeStoreCtaHref('https://example.com/x')).toBe('https://example.com/x');
    expect(sanitizeStoreCtaHref('')).toBe('/products');
  });

  it('normalizes and caps section count', () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      id: `s${i}`,
      type: 'banner',
      title: `Banner ${i}`,
      enabled: true,
      placement: i % 3 === 0 ? 'after-hero' : i % 3 === 1 ? 'mid-page' : 'before-footer',
    }));
    expect(normalizePageSections(rows)).toHaveLength(MAX_PAGE_SECTIONS);
  });

  it('caps each placement to three banners', () => {
    const afterHero = Array.from({ length: 5 }, (_, i) => ({
      id: `ah${i}`,
      type: 'banner',
      title: `After ${i}`,
      placement: 'after-hero',
      enabled: true,
    }));
    const normalized = normalizePageSections(afterHero);
    expect(normalized).toHaveLength(MAX_BANNERS_PER_PLACEMENT);
    expect(normalized.every((s) => s.placement === 'after-hero')).toBe(true);
  });

  it('counts sections per placement and picks default slot', () => {
    const sections = [
      { id: '1', placement: 'after-hero', title: 'A' },
      { id: '2', placement: 'after-hero', title: 'B' },
      { id: '3', placement: 'after-hero', title: 'C' },
      { id: '4', placement: 'mid-page', title: 'M' },
    ];
    expect(countSectionsForPlacement(sections, 'after-hero')).toBe(3);
    expect(canAddSectionAtPlacement(sections, 'after-hero')).toBe(false);
    expect(canAddSectionAtPlacement(sections, 'mid-page')).toBe(true);
    expect(resolveDefaultPlacement(sections)).toBe('mid-page');
  });

  it('returns only enabled sections with content', () => {
    const active = getActivePageSections([
      { id: '1', type: 'banner', title: 'Sale', enabled: true },
      { id: '2', type: 'banner', title: '', enabled: true },
      { id: '3', type: 'promo-strip', subtitle: 'Free ship', enabled: false },
    ]);
    expect(active).toHaveLength(1);
    expect(active[0].title).toBe('Sale');
  });

  it('activates image-only banners with imageUrl only', () => {
    const active = getActivePageSections([
      {
        id: '1',
        type: 'banner',
        design: 'image-only',
        imageUrl: 'https://cdn.example.com/promo.webp',
        enabled: true,
        placement: 'after-hero',
      },
    ]);
    expect(active).toHaveLength(1);
    expect(active[0].design).toBe('image-only');
  });

  it('filters sections by placement', () => {
    const sections = normalizePageSections([
      { id: '1', type: 'banner', title: 'Hero promo', placement: 'after-hero', enabled: true },
      { id: '2', type: 'banner', title: 'Mid promo', placement: 'mid-page', enabled: true },
    ]);
    expect(filterPageSectionsByPlacement(sections, 'after-hero')).toHaveLength(1);
    expect(filterPageSectionsByPlacement(sections, 'after-hero')[0].title).toBe('Hero promo');
  });

  it('defaults legacy sections without placement to mid-page', () => {
    const [row] = normalizePageSections([{ id: '1', type: 'banner', title: 'Legacy', enabled: true }]);
    expect(row.placement).toBe('mid-page');
    expect(normalizePlacement(undefined)).toBe('mid-page');
    expect(normalizePlacement('after-hero')).toBe('after-hero');
  });

  it('applies compact default frame for after-hero image banners', () => {
    const section = {
      type: 'banner',
      design: 'image-only',
      imageUrl: 'https://cdn.example.com/promo.webp',
      heightPreset: 'compact',
    };
    const classes = resolveBannerFrameClasses(section, { isAfterHero: true });
    expect(classes).toContain('aspect-[32/9]');
    expect(classes).toContain('min-h-[56px]');
  });
});
