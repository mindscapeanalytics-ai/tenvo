/**
 * Merge owner-uploaded hero slides with domain template defaults.
 */

/**
 * @param {unknown} slides
 * @returns {object[]}
 */
export function sanitizeHeroSlides(slides) {
  if (!Array.isArray(slides)) return [];
  return slides
    .filter((s) => s && typeof s === 'object')
    .map((s) => ({
      eyebrow: typeof s.eyebrow === 'string' ? s.eyebrow.trim() : '',
      title: typeof s.title === 'string' ? s.title.trim() : '',
      subtitle: typeof s.subtitle === 'string' ? s.subtitle.trim() : '',
      image: typeof s.image === 'string' ? s.image.trim() : '',
      ctaLabel: typeof s.ctaLabel === 'string' ? s.ctaLabel.trim() : '',
      ctaHref: typeof s.ctaHref === 'string' ? s.ctaHref.trim() : '',
      rating: typeof s.rating === 'number' ? s.rating : undefined,
      ratingText: typeof s.ratingText === 'string' ? s.ratingText.trim() : undefined,
      promoTag: typeof s.promoTag === 'string' ? s.promoTag.trim() : undefined,
    }));
}

/**
 * Overlay custom slide fields onto template defaults (by index).
 * Custom images replace defaults; empty slots keep template copy + image.
 *
 * @param {object[] | null | undefined} customSlides
 * @param {object[]} defaultSlides
 * @param {{ coverImage?: string | null; maxSlides?: number }} [opts]
 */
export function mergeHeroSlidesWithDefaults(customSlides, defaultSlides, opts = {}) {
  const { coverImage = null, maxSlides = 8 } = opts;
  const defaults = Array.isArray(defaultSlides) ? defaultSlides : [];
  const custom = sanitizeHeroSlides(customSlides);

  const hasCustomImages = custom.some((s) => s.image);
  if (!hasCustomImages && !coverImage) {
    return defaults.map((s, i) => (i === 0 && coverImage ? { ...s, image: coverImage } : s));
  }

  if (!hasCustomImages && coverImage) {
    return defaults.map((s, i) => (i === 0 ? { ...s, image: coverImage } : s));
  }

  const len = Math.min(Math.max(custom.length, defaults.length), maxSlides);
  const merged = [];

  for (let i = 0; i < len; i++) {
    const def = defaults[i] || defaults[defaults.length - 1] || {};
    const c = custom[i] || {};
    const image = c.image || (i === 0 && coverImage) || def.image || '';
    const hasCustomCopy = c.title || c.subtitle || c.eyebrow || c.ctaLabel;
    if (!image && !hasCustomCopy && !def.title) continue;
    merged.push({
      ...def,
      ...(c.image || hasCustomCopy ? c : {}),
      image,
      title: c.title || def.title || '',
      subtitle: c.subtitle || def.subtitle || '',
      eyebrow: c.eyebrow || def.eyebrow || '',
      ctaLabel: c.ctaLabel || def.ctaLabel || 'Shop Now',
      ctaHref: c.ctaHref || def.ctaHref || '',
      rating: c.rating ?? def.rating,
      ratingText: c.ratingText || def.ratingText,
      promoTag: c.promoTag || def.promoTag,
    });
  }

  return merged.length ? merged : defaults;
}

/**
 * Load hero slides for admin UI — prefers global `storefront.heroSlides`,
 * falls back to legacy vertical-specific arrays when global has no uploads.
 * @param {object} [storeSettings] business_settings.settings
 */
export function resolveStoredHeroSlides(storeSettings = {}) {
  const sf =
    storeSettings?.storefront && typeof storeSettings.storefront === 'object'
      ? storeSettings.storefront
      : {};
  const global = sanitizeHeroSlides(sf.heroSlides);
  if (global.some((s) => s.image)) return global;

  const verticalKeys = [
    'fashion',
    'restaurant',
    'pharmacy',
    'furniture',
    'fitness',
    'dealership',
    'supermarket',
    'autoParts',
    'jewellery',
  ];
  for (const key of verticalKeys) {
    const legacy = sanitizeHeroSlides(sf[key]?.heroSlides);
    if (legacy.some((s) => s.image)) return legacy;
  }
  return global;
}

const LEGACY_HERO_VERTICAL_KEYS = [
  'fashion',
  'restaurant',
  'pharmacy',
  'furniture',
  'fitness',
  'dealership',
  'supermarket',
  'autoParts',
  'jewellery',
];

/** Remove legacy per-vertical heroSlides after saving universal storefront.heroSlides. */
export function clearLegacyVerticalHeroSlides(storefront = {}) {
  const next = { ...storefront };
  for (const key of LEGACY_HERO_VERTICAL_KEYS) {
    if (!next[key] || typeof next[key] !== 'object') continue;
    const { heroSlides: _removed, ...rest } = next[key];
    if (Object.keys(rest).length) {
      next[key] = rest;
    } else {
      delete next[key];
    }
  }
  return next;
}

/**
 * Resolve hero slides from storefront settings (any vertical).
 * @param {object} settings business_settings.settings
 * @param {object[]} defaultSlides
 * @param {{ coverImage?: string | null; verticalKey?: string }} [opts]
 */
export function resolveStorefrontHeroSlides(settings, defaultSlides, opts = {}) {
  const sf = settings?.storefront && typeof settings.storefront === 'object' ? settings.storefront : {};
  const verticalKey = opts.verticalKey;
  const global = sanitizeHeroSlides(sf.heroSlides);
  if (global.some((s) => s.image || s.title || s.subtitle)) {
    return mergeHeroSlidesWithDefaults(global, defaultSlides, { coverImage: opts.coverImage });
  }
  const verticalSlides =
    verticalKey && sf[verticalKey]?.heroSlides ? sf[verticalKey].heroSlides : null;
  const legacy = sanitizeHeroSlides(verticalSlides);
  const custom = legacy.some((s) => s.image) ? legacy : global.length ? global : null;
  return mergeHeroSlidesWithDefaults(custom, defaultSlides, { coverImage: opts.coverImage });
}

/** Map hero preset type → storefront settings key for vertical-specific heroSlides. */
export function inferHeroVerticalKey(presetType) {
  const map = {
    'fashion-editorial': 'fashion',
    'fashion-finder': 'fashion',
    'pharmacy-elevated': 'pharmacy',
    'pharmacy-finder': 'pharmacy',
    'restaurant-elevated': 'restaurant',
    'restaurant-finder': 'restaurant',
    'furniture-elevated': 'furniture',
    'fitness-elevated': 'fitness',
    'auto-dealership': 'dealership',
    'auto-marketplace': 'marketplace',
    'parts-finder': 'autoParts',
    'marine-parts-finder': 'marine',
    'supermarket-elevated': 'supermarket',
    'grocery-finder': 'supermarket',
    'jewellery-elevated': 'jewellery',
  };
  return map[presetType] || null;
}

/**
 * Nest flat Store Settings form state into the runtime `settings.storefront.*` shape
 * so hero preview / default slides match public storefront resolution.
 * @param {object} [flat]
 */
export function nestAdminSettingsForHeroPreview(flat = {}) {
  const storefront = {
    ...(flat.storefront && typeof flat.storefront === 'object' ? flat.storefront : {}),
  };

  if (Array.isArray(flat.heroSlides)) storefront.heroSlides = flat.heroSlides;
  if (flat.jewellery) storefront.jewellery = flat.jewellery;
  if (flat.fashion) storefront.fashion = flat.fashion;
  if (flat.pharmacy) storefront.pharmacy = flat.pharmacy;
  if (flat.furniture) storefront.furniture = flat.furniture;
  if (flat.restaurant) storefront.restaurant = flat.restaurant;
  if (flat.fitness) storefront.fitness = flat.fitness;
  if (flat.supermarket) storefront.supermarket = flat.supermarket;
  if (flat.dealership) storefront.dealership = flat.dealership;
  if (flat.autoParts) storefront.autoParts = flat.autoParts;
  if (flat.marine) storefront.marine = flat.marine;
  if (flat.marketplace) storefront.marketplace = flat.marketplace;
  if (flat.booking) storefront.booking = flat.booking;
  if (typeof flat.heroTitle === 'string') storefront.heroTitle = flat.heroTitle;
  if (typeof flat.heroSubtitle === 'string') storefront.heroSubtitle = flat.heroSubtitle;
  if (typeof flat.announcement === 'string') storefront.announcement = flat.announcement;

  return {
    ...flat,
    storefront,
  };
}

/**
 * Apply owner-uploaded hero slides (global or vertical) onto a built preset.
 * @param {object} preset
 * @param {object} settings
 * @param {{ coverImage?: string | null }} [opts]
 */
export function applyOwnerHeroSlideOverrides(preset, settings, opts = {}) {
  if (!preset?.slides?.length) return preset;
  const verticalKey = inferHeroVerticalKey(preset.type);
  const slides = resolveStorefrontHeroSlides(settings, preset.slides, {
    coverImage: opts.coverImage,
    verticalKey,
  });
  return { ...preset, slides };
}
