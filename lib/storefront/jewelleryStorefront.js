/**
 * Jewelry storefront helpers — elevated luxury template with 2026 design principles.
 * Immersive visual storytelling, certification trust, and premium micro-interactions.
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { mergeHeroSlidesWithDefaults, sanitizeHeroSlides } from './heroSlides';
import { formatElevatedStoreName, buildQuickSearchTerms, isDemoStoreDomain } from './elevatedStorefrontTenant';

/** Jewelry canonical — uses luxury template but distinct from fashion editorial. */
export const JEWELLERY_CANONICAL = 'gems-jewellery';

/**
 * @param {string | null | undefined} category
 */
export function isJewelleryStore(category) {
  return resolveDomainKey(category) === JEWELLERY_CANONICAL;
}

/**
 * @typedef {object} JewelleryStorefrontConfig
 * @property {boolean} animations Scroll reveals, hover effects, particle shimmer.
 * @property {boolean} showHeroRating Social proof on hero slides.
 * @property {boolean} showCertificationBadges Hallmark/GIA trust badges on products.
 * @property {boolean} showCollections Curated collections carousel (Bridal, Occasions, etc).
 * @property {boolean} showSignaturePieces Featured jewelry showcase.
 * @property {boolean} showJewelleryEdit "The Jewellery Edit" mosaic section.
 * @property {boolean} showCategories Gold/Diamond/Bridal category circles.
 * @property {boolean} showNewArrivals Latest pieces rail.
 * @property {boolean} showOffers Sale & promotional jewelry.
 * @property {boolean} showTrustStrip Certification pillars strip.
 * @property {boolean} showBrandsRow Heritage brands marquee.
 * @property {boolean} showSeoBlock Expandable SEO content.
 * @property {string} searchPlaceholder
 * @property {string} signaturePiecesTitle
 * @property {string} signaturePiecesSubtitle
 * @property {string} categoriesTitle
 * @property {string} newArrivalsTitle
 * @property {string} offersTitle
 * @property {object[] | null} trustPillars
 * @property {object[] | null} brands
 * @property {string[] | null} quickSearchTerms
 * @property {object[]} heroSlides
 */

/**
 * Owner-configurable jewelry storefront settings.
 * Reads `settings.storefront.jewellery.*` with luxury defaults.
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 * @returns {JewelleryStorefrontConfig}
 */
export function getJewelleryStorefrontConfig(settings = {}, businessDomain) {
  const raw = settings?.storefront?.jewellery || {};
  const str = (value) => (typeof value === 'string' ? value.trim() : '');
  const bool = (value, defaultTrue = true) => {
    if (value === undefined || value === null) return defaultTrue;
    return value !== false;
  };

  return {
    animations: bool(raw.animations, true),
    showHeroRating: bool(raw.showHeroRating, true),
    showCertificationBadges: bool(raw.showCertificationBadges, true),
    showCollections: bool(raw.showCollections, true),
    showSignaturePieces: bool(raw.showSignaturePieces, true),
    showJewelleryEdit: bool(raw.showJewelleryEdit, true),
    showCategories: bool(raw.showCategories, true),
    showNewArrivals: bool(raw.showNewArrivals, true),
    showOffers: bool(raw.showOffers, true),
    showTrustStrip: bool(raw.showTrustStrip, true),
    showBrandsRow: bool(raw.showBrandsRow, true),
    showSeoBlock: bool(raw.showSeoBlock, true),
    searchPlaceholder: str(raw.searchPlaceholder) || 'Search gold, diamonds, bridal sets…',
    signaturePiecesTitle: str(raw.signaturePiecesTitle) || 'Signature Pieces',
    signaturePiecesSubtitle: str(raw.signaturePiecesSubtitle) || 'Handcrafted excellence',
    categoriesTitle: str(raw.categoriesTitle) || 'SHOP BY CATEGORY',
    newArrivalsTitle: str(raw.newArrivalsTitle) || 'NEW ARRIVALS',
    offersTitle: str(raw.offersTitle) || 'SPECIAL OFFERS',
    trustPillars: Array.isArray(raw.trustPillars) && raw.trustPillars.length ? raw.trustPillars : null,
    brands: Array.isArray(raw.brands) && raw.brands.length ? raw.brands : null,
    quickSearchTerms: Array.isArray(raw.quickSearchTerms) && raw.quickSearchTerms.length ? raw.quickSearchTerms : null,
    heroSlides: sanitizeHeroSlides(raw.heroSlides),
  };
}

/**
 * Default jewelry storefront settings for registration seed.
 * @returns {{ jewellery: Record<string, boolean | string> }}
 */
export function buildDefaultJewelleryStorefrontSeed() {
  return {
    jewellery: {
      animations: true,
      showHeroRating: true,
      showCertificationBadges: true,
      showCollections: true,
      showSignaturePieces: true,
      showJewelleryEdit: true,
      showCategories: true,
      showNewArrivals: true,
      showOffers: true,
      showTrustStrip: true,
      showBrandsRow: true,
      showSeoBlock: true,
      searchPlaceholder: 'Search gold, diamonds, bridal sets…',
    },
  };
}

/**
 * Format jewelry store name (strip "Demo" suffix).
 * @param {string | null | undefined} name
 */
export function formatJewelleryStoreName(name) {
  return formatElevatedStoreName(name, 'Our jewelry store');
}

export const JEWELLERY_DEFAULT_TRUST_PILLARS = [
  { id: 'certified', label: 'Certified Gold', desc: 'Hallmark assured 18K-24K purity' },
  { id: 'insured', label: 'Insured Shipping', desc: 'Full coverage on all orders' },
  { id: 'packaging', label: 'Luxury Packaging', desc: 'Elegant gift boxes included' },
  { id: 'authenticity', label: 'Authenticity Guarantee', desc: 'GIA & IGI certifications' },
];

export const JEWELLERY_DEMO_BRANDS = [
  { id: 'heritage-gold', name: 'Heritage Gold', slug: 'heritage-gold' },
  { id: 'lumiere-diamonds', name: 'Lumière Diamonds', slug: 'lumiere-diamonds' },
  { id: 'royal-heritage', name: 'Royal Heritage', slug: 'royal-heritage' },
  { id: 'saddar-jewellers', name: 'Saddar Jewellers', slug: 'saddar-jewellers' },
  { id: 'pearl-co', name: 'Pearl & Co', slug: 'pearl-co' },
  { id: 'silver-craft', name: 'Silver Craft', slug: 'silver-craft' },
];

export const JEWELLERY_DEMO_QUICK_SEARCH = [
  'Gold Rings',
  'Diamond Necklace',
  'Bridal Sets',
  'Gold Bangles',
  'Earrings',
  'Pearls',
];

const JEWELLERY_SEO_BLOCKS = [
  {
    id: 'collections',
    title: 'Discover timeless jewelry collections',
    body: 'Browse certified gold, diamond solitaires, bridal sets, and pearls from trusted jewelers. Filter by carat, clarity, and certification to find pieces that last a lifetime.',
  },
  {
    id: 'craftsmanship',
    title: 'Hallmark quality & craftsmanship',
    body: 'Every piece is hallmark certified with detailed assay certificates. From 18K to 24K gold, GIA diamonds, and sterling silver, our collection meets the highest standards.',
  },
  {
    id: 'occasions',
    title: 'Jewelry for every milestone',
    body: 'Engagement rings, wedding bands, bridal sets, anniversary gifts, and heirloom pieces. Insured delivery and elegant packaging for your special moments.',
  },
];

/**
 * @param {string} storeName
 * @param {string} [city]
 */
export function getJewelleryMetadataCopy(storeName, city = '') {
  const region = city ? ` in ${city}` : '';
  const atStore = storeName ? ` at ${storeName}` : '';
  return {
    description: `Shop certified gold, diamonds, bridal sets, and fine jewelry${atStore}${region}. Hallmark assured 18K-24K gold with GIA certifications and insured delivery.`,
    keywords: `jewelry store, gold jewelry, diamond rings, bridal sets, certified jewelry${city ? `, ${city}` : ''}`,
  };
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveJewellerySearchPlaceholder(settings = {}, businessDomain) {
  const config = getJewelleryStorefrontConfig(settings, businessDomain);
  return config.searchPlaceholder;
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveJewelleryTrustPillars(settings = {}, businessDomain) {
  const config = getJewelleryStorefrontConfig(settings, businessDomain);
  const raw = config.trustPillars || JEWELLERY_DEFAULT_TRUST_PILLARS;
  return (raw || [])
    .filter((pillar) => pillar && typeof pillar === 'object')
    .map((pillar) => ({
      id: pillar.id,
      label: pillar.label || pillar.title,
      desc: pillar.desc || pillar.description,
    }))
    .filter((pillar) => pillar.id && pillar.label);
}

/**
 * @param {object} [settings]
 * @param {object[]} [products]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveJewelleryBrands(settings = {}, products = [], businessDomain) {
  const config = getJewelleryStorefrontConfig(settings, businessDomain);
  if (config.brands) return config.brands;

  const fromProducts = [...new Set((products || []).map((p) => p.brand).filter(Boolean))].slice(0, 12);
  if (fromProducts.length >= 1) {
    return fromProducts.map((name, i) => ({
      id: `brand-${i}`,
      name: String(name),
      slug: String(name).toLowerCase().replace(/\s+/g, '-'),
    }));
  }

  if (isDemoStoreDomain(businessDomain)) return JEWELLERY_DEMO_BRANDS;
  return [];
}

/**
 * @param {object} [settings]
 * @param {object[]} [products]
 * @param {object[]} [categories]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveJewelleryQuickSearchTerms(settings = {}, products = [], categories = [], businessDomain) {
  const config = getJewelleryStorefrontConfig(settings, businessDomain);
  const terms = buildQuickSearchTerms(products, categories, config.quickSearchTerms, 6);
  if (terms.length) return terms;
  if (isDemoStoreDomain(businessDomain)) return JEWELLERY_DEMO_QUICK_SEARCH;
  return (categories || []).slice(0, 6).map((c) => c.name).filter(Boolean);
}

/**
 * @param {string} storeName
 * @param {string} [businessDescription]
 * @param {string} [country]
 */
export function resolveJewellerySeoBlocks(storeName, businessDescription = '', country = '') {
  const displayName = formatJewelleryStoreName(storeName);
  const region = country ? ` in ${country}` : '';
  const intro = String(businessDescription || '').trim();

  return [
    {
      id: 'about',
      title: `${displayName}, fine jewelry online${region}`,
      body: intro || `Discover certified gold, diamonds, and bridal jewelry from ${displayName}. Shop hallmark-assured pieces with GIA certifications, insured delivery, and luxury packaging.`,
    },
    ...JEWELLERY_SEO_BLOCKS,
  ];
}

/**
 * @typedef {object} JewelleryHeroSlide
 * @property {string} eyebrow
 * @property {string} title
 * @property {string} subtitle
 * @property {string} image
 * @property {string} ctaLabel
 * @property {string} ctaHref
 * @property {number} [rating]
 * @property {string} [ratingText]
 * @property {string} [promoTag]
 */

/**
 * @param {string} base `/store/{domain}`
 * @returns {JewelleryHeroSlide[]}
 */
export function getJewelleryEditorialSlides(base) {
  const products = `${base}/products`;

  return [
    {
      eyebrow: 'Trusted by 50,000+ Customers',
      title: 'Timeless Pieces, Crafted to Last',
      subtitle: 'Hallmark-certified gold, GIA diamonds, and bridal sets with insured delivery.',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&q=85&auto=format&fit=crop',
      ctaLabel: 'Shop Gold Jewelry',
      ctaHref: `${products}?category=gold`,
      rating: 4.9,
      ratingText: 'from 12,000+ jewelry buyers',
      promoTag: 'Certified Gold',
    },
    {
      eyebrow: 'GIA Certified Diamonds',
      title: 'Brilliance in Every Cut',
      subtitle: 'VS1 clarity diamonds, precision-cut solitaires, and engagement rings with lifetime warranty.',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1600&q=85&auto=format&fit=crop',
      ctaLabel: 'Explore Diamonds',
      ctaHref: `${products}?category=diamonds`,
      rating: 4.9,
      ratingText: 'from 5,000+ diamond shoppers',
      promoTag: 'Diamonds',
    },
    {
      eyebrow: 'Bridal Heritage',
      title: 'Celebrate Every Milestone',
      subtitle: 'Kundan, polki, and bridal sets handcrafted for weddings, engagements, and anniversaries.',
      image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1600&q=85&auto=format&fit=crop',
      ctaLabel: 'Shop Bridal Sets',
      ctaHref: `${products}?category=bridal`,
      rating: 4.9,
      ratingText: 'from 3,500+ bridal clients',
      promoTag: 'Bridal',
    },
    {
      eyebrow: 'Fine Craftsmanship',
      title: 'Pearls & Precious Gems',
      subtitle: 'South Sea pearls, emeralds, rubies, and sapphires in elegant 18K gold settings.',
      image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=1600&q=85&auto=format&fit=crop',
      ctaLabel: 'Discover Gems',
      ctaHref: `${products}?search=pearls`,
      rating: 4.8,
      ratingText: 'from 8,000+ luxury shoppers',
      promoTag: 'Gemstones',
    },
  ];
}

/**
 * Resolve jewelry hero slides — owner uploads override defaults.
 * @param {string} base `/store/{domain}`
 * @param {object} [settings]
 * @param {{ coverImage?: string | null }} [ctx]
 */
export function getJewelleryHeroSlides(base, settings = {}, ctx = {}) {
  const defaultSlides = getJewelleryEditorialSlides(base);
  const config = getJewelleryStorefrontConfig(settings);
  const ownerSlides = config.heroSlides || [];

  const slides = ownerSlides.length
    ? mergeHeroSlidesWithDefaults(ownerSlides, defaultSlides)
    : defaultSlides;

  return slides.map((s) => ({
    ...s,
    ctaHref: s.ctaHref?.startsWith('http')
      ? s.ctaHref
      : s.ctaHref?.startsWith('/store/')
        ? s.ctaHref
        : s.ctaHref?.startsWith('/')
          ? `${base}${s.ctaHref}`
          : s.ctaHref || `${base}/products`,
  }));
}

/** Jewelry categories for circular showcase. */
export const JEWELLERY_CATEGORY_CIRCLES = [
  { id: 'gold', label: 'GOLD', keywords: ['gold', '22k', '21k', '18k', 'kangan', 'chain'] },
  { id: 'diamonds', label: 'DIAMONDS', keywords: ['diamond', 'solitaire', 'tennis', 'stud'] },
  { id: 'bridal', label: 'BRIDAL', keywords: ['bridal', 'kundan', 'polki', 'wedding', 'engagement'] },
  { id: 'earrings', label: 'EARRINGS', keywords: ['earring', 'jhumka', 'hoop', 'stud', 'drop'] },
  { id: 'necklaces', label: 'NECKLACES', keywords: ['necklace', 'pendant', 'choker', 'collar'] },
  { id: 'rings', label: 'RINGS', keywords: ['ring', 'band', 'cocktail', 'signet'] },
  { id: 'bracelets', label: 'BRACELETS', keywords: ['bracelet', 'bangle', 'cuff', 'tennis'] },
  { id: 'pearls', label: 'PEARLS', keywords: ['pearl', 'south sea', 'freshwater'] },
];

/**
 * Build jewelry specifications from domain_data for PDP tabs.
 * @param {object} [domainData]
 */
export function buildJewellerySpecifications(domainData = {}) {
  const dd = domainData && typeof domainData === 'object' ? domainData : {};
  /** @type {Record<string, string>} */
  const out = {};

  const fields = [
    ['carat', 'Purity / Carat'],
    ['weight', 'Weight'],
    ['clarity', 'Clarity'],
    ['cut', 'Cut'],
    ['certification', 'Certification'],
    ['hallmark', 'Hallmark Number'],
  ];

  for (const [key, label] of fields) {
    const val = dd[key];
    if (val != null && String(val).trim()) {
      let formatted = String(val).trim();
      if (key === 'weight') formatted = `${formatted} g`;
      out[label] = formatted;
    }
  }

  return out;
}

/**
 * @typedef {{ id: string; label: string; icon: string; href: string }} NavCategory
 * @typedef {{ id: string; label: string; categories: NavCategory[] }} NavTab
 */

/**
 * Build jewelry navigation structure with tabs and promo banners.
 * @param {string} base `/store/{domain}`
 * @param {Array<{ slug: string; name: string }>} [storeCategories]
 * @returns {{ tabs: NavTab[]; promos: Array<{ title: string; subtitle?: string; href: string; image: string }> }}
 */
export function getJewelleryEditorialNav(base, storeCategories = []) {
  const products = `${base}/products`;
  const slides = getJewelleryEditorialSlides(base);
  
  // Promo banners from hero slides
  const promos = slides.slice(0, 2).map((s) => ({
    title: s.promoTag || s.ctaLabel,
    subtitle: s.eyebrow,
    href: s.ctaHref,
    image: s.image,
  }));

  // Use store categories if available (4+ categories = use live catalog)
  const fromStore = storeCategories.slice(0, 8).map((c) => ({
    id: c.slug,
    label: c.name,
    icon: 'gem',
    href: `${products}?category=${encodeURIComponent(c.slug)}`,
  }));

  if (fromStore.length >= 4) {
    return {
      promos,
      tabs: [{ id: 'shop', label: 'Shop', categories: fromStore }],
    };
  }

  // Preset jewelry navigation tabs
  /** @type {NavTab[]} */
  const presetTabs = [
    {
      id: 'collections',
      label: 'Collections',
      categories: [
        { id: 'gold', label: 'Gold', icon: 'star', href: `${products}?category=gold` },
        { id: 'diamonds', label: 'Diamonds', icon: 'sparkles', href: `${products}?category=diamonds` },
        { id: 'bridal', label: 'Bridal', icon: 'gift', href: `${products}?category=bridal` },
        { id: 'pearls', label: 'Pearls', icon: 'circle', href: `${products}?category=pearls` },
        { id: 'silver', label: 'Silver', icon: 'circle', href: `${products}?category=silver` },
        { id: 'gifts', label: 'Gifts', icon: 'package', href: `${products}?sort=featured` },
      ],
    },
    {
      id: 'jewelry',
      label: 'Shop by Type',
      categories: [
        { id: 'necklaces', label: 'Necklaces', icon: 'circle', href: `${products}?category=necklaces` },
        { id: 'earrings', label: 'Earrings', icon: 'circle', href: `${products}?category=earrings` },
        { id: 'rings', label: 'Rings', icon: 'circle', href: `${products}?category=rings` },
        { id: 'bracelets', label: 'Bracelets', icon: 'circle', href: `${products}?category=bracelets` },
        { id: 'bangles', label: 'Bangles', icon: 'circle', href: `${products}?category=bangles` },
        { id: 'pendants', label: 'Pendants', icon: 'circle', href: `${products}?category=pendants` },
      ],
    },
    {
      id: 'occasions',
      label: 'Occasions',
      categories: [
        { id: 'engagement', label: 'Engagement', icon: 'heart', href: `${products}?search=engagement` },
        { id: 'wedding', label: 'Wedding', icon: 'gift', href: `${products}?category=bridal` },
        { id: 'anniversary', label: 'Anniversary', icon: 'sparkles', href: `${products}?search=anniversary` },
        { id: 'daily-wear', label: 'Daily Wear', icon: 'star', href: `${products}?search=daily` },
      ],
    },
  ];

  return { tabs: presetTabs, promos };
}
