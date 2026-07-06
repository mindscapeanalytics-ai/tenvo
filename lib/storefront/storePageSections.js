/**
 * Owner-defined homepage marketing sections for public storefronts.
 * Persisted on `business_settings.settings.pageSections`.
 */
import { resolveSpotlightBannerImage } from './storefrontImagePlaceholders.js';

export const MAX_PAGE_SECTIONS = 12;

/** @typedef {'banner' | 'promo-strip'} PageSectionType */
/** @typedef {'image-only' | 'image' | 'gradient' | 'solid'} BannerDesignMode */
/** @typedef {'after-hero' | 'mid-page' | 'before-footer'} PageSectionPlacement */

/** @typedef {'compact' | 'standard' | 'tall' | 'feature'} BannerHeightPreset */
/** @typedef {'cover' | 'contain'} BannerImageFit */

export const BANNER_HEIGHT_PRESETS = [
  {
    id: 'compact',
    label: 'Compact strip',
    aspect: 'aspect-[32/9]',
    minHeight: 'min-h-[56px] sm:min-h-[72px]',
    textMinHeight: 'min-h-[120px] sm:min-h-[140px]',
  },
  {
    id: 'standard',
    label: 'Standard',
    aspect: 'aspect-[21/9]',
    minHeight: 'min-h-[96px] sm:min-h-[128px]',
    textMinHeight: 'min-h-[180px] sm:min-h-[220px]',
  },
  {
    id: 'tall',
    label: 'Tall',
    aspect: 'aspect-[16/9]',
    minHeight: 'min-h-[128px] sm:min-h-[180px]',
    textMinHeight: 'min-h-[220px] sm:min-h-[280px]',
  },
  {
    id: 'feature',
    label: 'Feature (large)',
    aspect: 'aspect-[3/2] sm:aspect-[21/9]',
    minHeight: 'min-h-[160px] sm:min-h-[220px] lg:min-h-[280px]',
    textMinHeight: 'min-h-[260px] sm:min-h-[320px]',
  },
];

const HEIGHT_PRESET_IDS = new Set(BANNER_HEIGHT_PRESETS.map((p) => p.id));

/**
 * @param {string | null | undefined} value
 * @param {BannerHeightPreset} [fallback]
 * @returns {BannerHeightPreset}
 */
export function normalizeBannerHeightPreset(value, fallback = 'standard') {
  const v = String(value || '').trim();
  if (HEIGHT_PRESET_IDS.has(v)) return /** @type {BannerHeightPreset} */ (v);
  return /** @type {BannerHeightPreset} */ (fallback);
}

/**
 * @param {string | null | undefined} value
 * @returns {BannerImageFit}
 */
export function normalizeBannerImageFit(value) {
  return String(value || '').trim() === 'contain' ? 'contain' : 'cover';
}

/**
 * @param {object | null | undefined} section
 * @param {{ isAfterHero?: boolean; framed?: boolean }} [opts]
 */
export function resolveBannerFrameClasses(section, opts = {}) {
  const { isAfterHero = false, framed = false } = opts;
  const defaultPreset = isAfterHero ? 'compact' : 'standard';
  const preset = BANNER_HEIGHT_PRESETS.find(
    (p) => p.id === normalizeBannerHeightPreset(section?.heightPreset, defaultPreset)
  );
  const row = preset || BANNER_HEIGHT_PRESETS[1];
  if (section?.type === 'promo-strip') {
    return 'min-h-0';
  }
  if (isImageOnlyBanner(section)) {
    return cnJoin(row.aspect, row.minHeight);
  }
  return cnJoin(
    framed ? 'rounded-2xl sm:rounded-3xl' : '',
    row.textMinHeight
  );
}

function cnJoin(...parts) {
  return parts.filter(Boolean).join(' ');
}

export const PAGE_SECTION_PLACEMENTS = [
  {
    id: 'after-hero',
    label: 'After hero',
    description: 'Full-width banner directly below your hero carousel or cover image.',
  },
  {
    id: 'mid-page',
    label: 'Middle of homepage',
    description: 'Between category navigation and product rows.',
  },
  {
    id: 'before-footer',
    label: 'Before footer',
    description: 'Last promotional slot above support links and footer.',
  },
];

const PLACEMENT_IDS = new Set(PAGE_SECTION_PLACEMENTS.map((p) => p.id));

/**
 * @param {string | null | undefined} value
 * @param {string} [legacyDefault]
 * @returns {PageSectionPlacement}
 */
export function normalizePlacement(value, legacyDefault = 'mid-page') {
  const v = String(value || '').trim();
  if (PLACEMENT_IDS.has(v)) return /** @type {PageSectionPlacement} */ (v);
  return /** @type {PageSectionPlacement} */ (legacyDefault);
}

/**
 * @param {PageSectionType} [type]
 */
export function createEmptyPageSection(type = 'banner') {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `sec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    type,
    enabled: true,
    sortOrder: 0,
    placement: type === 'banner' ? 'after-hero' : 'mid-page',
    title: '',
    subtitle: '',
    imageUrl: '',
    design: type === 'banner' ? 'image-only' : 'solid',
    backgroundColor: '',
    gradientFrom: '',
    gradientTo: '',
    textColor: '#ffffff',
    ctaLabel: '',
    ctaHref: '/products',
    heightPreset: type === 'banner' ? 'standard' : 'compact',
    imageFit: 'cover',
  };
}

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * @param {string | null | undefined} value
 * @param {string} [fallback]
 */
function cleanColor(value, fallback = '') {
  const v = String(value || '').trim();
  if (HEX_COLOR.test(v)) return v;
  return fallback;
}

/**
 * @param {string | null | undefined} href
 */
export function sanitizeStoreCtaHref(href) {
  const raw = String(href || '').trim();
  if (!raw) return '/products';
  if (raw.startsWith('/')) return raw.slice(0, 240);
  if (/^https?:\/\//i.test(raw)) return raw.slice(0, 500);
  return `/products`;
}

/**
 * @param {unknown} raw
 * @param {{ brandColor?: string }} [opts]
 * @returns {object[]}
 */
export function normalizePageSections(raw, opts = {}) {
  if (!Array.isArray(raw)) return [];

  const brand = cleanColor(opts.brandColor, '#2563eb') || '#2563eb';
  const brandDark = cleanColor(opts.brandColorDark, '#1e3a8a') || '#1e3a8a';

  return raw
    .slice(0, MAX_PAGE_SECTIONS)
    .map((row, index) => {
      if (!row || typeof row !== 'object') return null;
      const type = row.type === 'promo-strip' ? 'promo-strip' : 'banner';
      const design =
        row.design === 'image-only' ||
        row.design === 'image' ||
        row.design === 'solid' ||
        row.design === 'gradient'
          ? row.design
          : type === 'banner'
            ? 'gradient'
            : 'solid';

      const hasExplicitPlacement = row.placement != null && String(row.placement).trim() !== '';

      return {
        id: String(row.id || `sec-${index}`).slice(0, 64),
        type,
        enabled: row.enabled !== false,
        sortOrder: Number.isFinite(Number(row.sortOrder)) ? Number(row.sortOrder) : index,
        placement: hasExplicitPlacement
          ? normalizePlacement(row.placement, 'mid-page')
          : 'mid-page',
        title: String(row.title || '').trim().slice(0, 120),
        subtitle: String(row.subtitle || '').trim().slice(0, 280),
        imageUrl: String(row.imageUrl || '').trim().slice(0, 2000),
        design,
        backgroundColor: cleanColor(row.backgroundColor, brand),
        gradientFrom: cleanColor(row.gradientFrom, brand),
        gradientTo: cleanColor(row.gradientTo, brandDark),
        textColor: cleanColor(row.textColor, '#ffffff') || '#ffffff',
        ctaLabel: String(row.ctaLabel || '').trim().slice(0, 48),
        ctaHref: sanitizeStoreCtaHref(row.ctaHref),
        heightPreset: normalizeBannerHeightPreset(
          row.heightPreset,
          type === 'banner' ? 'standard' : 'compact'
        ),
        imageFit: normalizeBannerImageFit(row.imageFit),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row, index) => ({ ...row, sortOrder: index }));
}

/**
 * @param {object} section
 * @param {string} [fallbackAccent]
 */
export function getSectionBackgroundStyle(section, fallbackAccent = '#2563eb') {
  const accent = cleanColor(section.backgroundColor, fallbackAccent) || fallbackAccent;
  const from = cleanColor(section.gradientFrom, accent) || accent;
  const to = cleanColor(section.gradientTo, accent) || accent;

  if (section.type === 'banner') {
    const imageUrl =
      String(section.imageUrl || '').trim() ||
      resolveSpotlightBannerImage(
        { id: section.id, title: section.title },
        'retail-shop',
        Number(section.sortOrder) || 0
      );

    if (section.design === 'image-only') {
      return {
        backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: accent,
      };
    }

    return {
      backgroundImage: `linear-gradient(to right, rgba(15,23,42,0.78), rgba(15,23,42,0.34)), url(${imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  if (section.design === 'image' && section.imageUrl) {
    return {
      backgroundImage: `linear-gradient(to right, rgba(15,23,42,0.72), rgba(15,23,42,0.35)), url(${section.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  if (section.design === 'gradient') {
    return { background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` };
  }
  return { backgroundColor: accent };
}

/**
 * @param {object} section
 */
export function isImageOnlyBanner(section) {
  return section?.type === 'banner' && section.design === 'image-only' && !!String(section.imageUrl || '').trim();
}

/**
 * @param {unknown} sections
 */
export function getActivePageSections(sections) {
  return normalizePageSections(sections).filter(
    (s) => s.enabled && (s.title || s.subtitle || s.imageUrl)
  );
}

/**
 * @param {unknown} sections
 * @param {PageSectionPlacement} placement
 */
export function filterPageSectionsByPlacement(sections, placement) {
  return getActivePageSections(sections).filter((s) => s.placement === placement);
}
