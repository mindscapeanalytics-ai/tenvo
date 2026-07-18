/**
 * Tenvo Marine storefront template (marine-parts-finder vertical).
 * Owner overrides via `settings.storefront.marine`.
 */
import { resolveDomainKey } from '../config/domainKeyAliases.js';
import { getEffectiveProductImageUrl } from '@/lib/storefront/productImageFallback';
import { isMarinePartsFinderStore } from './marinePartsFinder.js';
import {
  MARINE_DEFAULT_SLIDES,
  MARINE_EXPERTISE_CARDS,
  MARINE_EQUIPMENT_CATEGORIES,
  MARINE_TRUST_DEFAULTS,
  MARINE_CTA_DEFAULTS,
  MARINE_INSIGHTS,
  MARINE_ACCENT,
  MARINE_HERO_VIDEO_URL,
  MARINE_HERO_POSTER,
  MARINE_ABOUT_IMAGE,
  MARINE_SERVICE_IMAGE,
} from './marinePartsArchiveMap.js';

export {
  MARINE_DEFAULT_SLIDES,
  MARINE_EXPERTISE_CARDS,
  MARINE_EQUIPMENT_CATEGORIES,
  MARINE_TRUST_DEFAULTS,
  MARINE_CTA_DEFAULTS,
  MARINE_INSIGHTS,
  MARINE_ACCENT,
  MARINE_HERO_VIDEO_URL,
  MARINE_HERO_POSTER,
  MARINE_ABOUT_IMAGE,
  MARINE_SERVICE_IMAGE,
};

export const MARINE_PARTS_CANONICALS = new Set(['marine-parts']);

export function isMarinePartsStore(category) {
  return isMarinePartsFinderStore(category);
}

/**
 * Normalize owner-entered hero media URLs (direct MP4 preferred for looping backdrop).
 * @param {string | null | undefined} raw
 */
export function normalizeMarineHeroVideoUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) return '';
  return url;
}

/**
 * @param {object} [settings]
 */
export function getMarinePartsStorefrontConfig(settings = {}) {
  const raw = settings?.storefront?.marine || settings?.marine || {};
  const heroVideoUrl = normalizeMarineHeroVideoUrl(raw.heroVideoUrl) || MARINE_HERO_VIDEO_URL;
  return {
    showFinder: raw.showFinder !== false,
    showKpis: raw.showKpis !== false,
    showExpertise: raw.showExpertise !== false,
    showEquipmentGrid: raw.showEquipmentGrid !== false,
    showStayAhead: raw.showStayAhead !== false,
    showInsights: raw.showInsights !== false,
    showFeaturedRails: raw.showFeaturedRails !== false,
    showSpareRail: raw.showSpareRail !== false,
    showBottomCta: raw.showBottomCta !== false,
    showMarketingBanners: raw.showMarketingBanners !== false,
    heroVideoUrl,
    heroPosterUrl: String(raw.heroPosterUrl || '').trim() || MARINE_HERO_POSTER,
    heroEyebrow: String(raw.heroEyebrow || '').trim() || 'Tenvo Marine',
    heroTitle: String(raw.heroTitle || '').trim() || 'Shaping reliable power at sea',
    heroSubtitle:
      String(raw.heroSubtitle || '').trim() ||
      'Find thrusters, rudder propellers, seals, and lifecycle spare parts by part number, OEM, or equipment type.',
    heroCtaLabel: String(raw.heroCtaLabel || '').trim() || 'Browse catalogue',
    kpiTitle: String(raw.kpiTitle || '').trim() || 'Enabling cleaner, more reliable operations at sea',
    kpiSubtitle: String(raw.kpiSubtitle || '').trim(),
    expertiseTitle: String(raw.expertiseTitle || '').trim() || 'New systems, used units, parts, and repair',
    expertiseSubtitle:
      String(raw.expertiseSubtitle || '').trim() ||
      'One catalogue for procurement, yard retrofit, and emergency spare coverage.',
    equipmentTitle: String(raw.equipmentTitle || '').trim() || 'Shop by equipment',
    equipmentSubtitle:
      String(raw.equipmentSubtitle || '').trim() || 'Propulsion families operators request most often.',
    stayAheadTitle: String(raw.stayAheadTitle || '').trim() || 'Decide smarter on propulsion stock',
    stayAheadSubtitle: String(raw.stayAheadSubtitle || '').trim(),
    stayAheadCtaLabel: String(raw.stayAheadCtaLabel || '').trim() || 'Start browsing',
    featuredRailTitle: String(raw.featuredRailTitle || '').trim() || 'Featured systems & parts',
    spareRailTitle: String(raw.spareRailTitle || '').trim() || 'Spare parts & seals',
    insightsTitle: String(raw.insightsTitle || '').trim() || 'Insights in focus',
    insightsSubtitle:
      String(raw.insightsSubtitle || '').trim() ||
      'Practical notes for fleet engineers and procurement teams.',
    trustTitle: raw.trustTitle || MARINE_TRUST_DEFAULTS.title,
    trustSubtitle: raw.trustSubtitle || MARINE_TRUST_DEFAULTS.subtitle,
    trustStats: Array.isArray(raw.trustStats) && raw.trustStats.length
      ? raw.trustStats
      : MARINE_TRUST_DEFAULTS.stats,
    insights: Array.isArray(raw.insights) && raw.insights.length ? raw.insights : MARINE_INSIGHTS,
    ctaTitle: raw.ctaTitle || MARINE_CTA_DEFAULTS.title,
    ctaSubtitle: raw.ctaSubtitle || MARINE_CTA_DEFAULTS.subtitle,
    ctaLabel: raw.ctaLabel || MARINE_CTA_DEFAULTS.label,
  };
}

/** Admin / form shape (same resolver). */
export function getMarinePartsConfig(settings = {}) {
  return getMarinePartsStorefrontConfig(settings);
}

/**
 * @param {string} base `/store/{domain}`
 * @param {object} [settings]
 * @param {string} [customCover]
 */
export function getMarinePartsHeroSlides(base, settings = {}, customCover) {
  const cfg = getMarinePartsStorefrontConfig(settings);
  const global = Array.isArray(settings?.storefront?.heroSlides) ? settings.storefront.heroSlides : [];
  const legacy = settings?.storefront?.marine?.slides;
  const hasGlobal = Array.isArray(global) && global.some((s) => s?.image || s?.title);
  const custom = hasGlobal ? global : (Array.isArray(legacy) && legacy.length ? legacy : null);
  const slides = custom || [
    {
      ...MARINE_DEFAULT_SLIDES[0],
      eyebrow: cfg.heroEyebrow,
      title: cfg.heroTitle,
      subtitle: cfg.heroSubtitle,
      ctaLabel: cfg.heroCtaLabel,
      image: cfg.heroPosterUrl,
      videoUrl: cfg.heroVideoUrl,
    },
  ];

  return slides.map((s, i) => ({
    eyebrow: i === 0 ? (s.eyebrow || cfg.heroEyebrow) : (s.eyebrow || ''),
    title: i === 0 ? (s.title || cfg.heroTitle) : (s.title || ''),
    subtitle: i === 0 ? (s.subtitle || cfg.heroSubtitle) : (s.subtitle || ''),
    image:
      i === 0 && customCover
        ? customCover
        : i === 0
          ? (s.image || cfg.heroPosterUrl || MARINE_HERO_POSTER)
          : (s.image || MARINE_HERO_POSTER),
    videoUrl: i === 0 ? (normalizeMarineHeroVideoUrl(s.videoUrl) || cfg.heroVideoUrl) : s.videoUrl,
    ctaLabel: s.ctaLabel || cfg.heroCtaLabel || 'Browse catalogue',
    ctaHref: s.ctaHref || (s.ctaHrefSuffix != null ? `${base}/products${s.ctaHrefSuffix}` : `${base}/products`),
    accent: s.accent || MARINE_ACCENT,
  }));
}

/**
 * @param {object[]} products
 */
export function partitionMarinePartsCatalog(products = []) {
  const norm = (p) => String(p?.category || '').toLowerCase();
  const byCat = (needle) => products.filter((p) => norm(p).includes(needle));

  const condition = (value) =>
    products.filter((p) => {
      const dd = p?.domain_data || {};
      return String(dd.systemcondition || dd.systemCondition || '').toLowerCase() === value;
    });

  return {
    featured: products.filter((p) => p.is_featured),
    newSystems: byCat('new system'),
    usedSystems: [...byCat('used system'), ...condition('used')],
    spareParts: byCat('spare'),
    seals: byCat('seal').concat(byCat('sterntube')),
    thrusters: byCat('thruster'),
    rudderPropellers: byCat('rudder'),
  };
}

/**
 * @param {object[]} products
 * @param {string} base
 * @param {number} [limit]
 */
export function buildMarineFeaturedCards(products, base, limit = 8) {
  const pool = partitionMarinePartsCatalog(products);
  const candidates = [...pool.featured, ...products].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );

  return candidates.slice(0, limit).map((p) => ({
    id: p.id,
    title: p.name,
    price: Number(p.display_price ?? p.price ?? 0),
    image: getEffectiveProductImageUrl(p, 'marine-parts'),
    href: `${base}/products/${p.slug || p.id}`,
    equipmentType: p?.domain_data?.equipmenttype || p?.domain_data?.equipmentType || '',
    condition: p?.domain_data?.systemcondition || p?.domain_data?.systemCondition || '',
  }));
}

/**
 * @param {string | null | undefined} category
 */
export function resolveMarinePartsCanonical(category) {
  const canonical = resolveDomainKey(category);
  return canonical === 'marine-parts' ? canonical : null;
}

/**
 * @param {string | null | undefined} name
 */
export function formatMarineStoreName(name) {
  const raw = String(name || '').trim();
  if (!raw) return 'Tenvo Marine';
  return raw.replace(/\s+Demo$/i, '').trim() || 'Tenvo Marine';
}
