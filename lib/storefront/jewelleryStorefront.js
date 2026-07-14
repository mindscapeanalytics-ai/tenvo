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
  const resolved = resolveDomainKey(category);
  return resolved === JEWELLERY_CANONICAL || resolved === 'salon-spa';
}

/**
 * Detects whether the store should render in jewelry or beauty mode.
 * @param {string | null | undefined} category
 * @returns {'jewellery' | 'beauty'}
 */
export function getStoreMode(category) {
  return resolveDomainKey(category) === 'salon-spa' ? 'beauty' : 'jewellery';
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
export function getJewelleryStorefrontConfig(settings = {}, businessDomain, businessCategory) {
  const raw = settings?.storefront?.jewellery || {};
  const mode = getStoreMode(businessCategory);
  const str = (value) => (typeof value === 'string' ? value.trim() : '');
  const bool = (value, defaultTrue = true) => {
    if (value === undefined || value === null) return defaultTrue;
    return value !== false;
  };

  const defaultPlaceholder = mode === 'beauty'
    ? 'Search nail polish, gel kits, press-ons, skin care…'
    : 'Search gold, diamonds, bridal sets…';

  const defaultSignatureTitle = mode === 'beauty' ? 'Best Sellers' : 'Signature Pieces';
  const defaultSignatureSubtitle = mode === 'beauty' ? 'Handcrafted premium essentials' : 'Handcrafted excellence';

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
    searchPlaceholder: str(raw.searchPlaceholder) || defaultPlaceholder,
    signaturePiecesTitle: str(raw.signaturePiecesTitle) || defaultSignatureTitle,
    signaturePiecesSubtitle: str(raw.signaturePiecesSubtitle) || defaultSignatureSubtitle,
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

export const BEAUTY_DEFAULT_TRUST_PILLARS = [
  { id: 'certified', label: 'TPO & 21-Free', desc: 'Dermatologically tested clean formulas' },
  { id: 'insured', label: 'Fast Delivery', desc: 'Secure shipping with care' },
  { id: 'packaging', label: 'Premium Packaging', desc: 'Perfect for gifts and salon storage' },
  { id: 'authenticity', label: 'Cruelty-Free & Vegan', desc: '100% ethical ingredients' },
];

export const JEWELLERY_DEMO_BRANDS = [
  { id: 'heritage-gold', name: 'Heritage Gold', slug: 'heritage-gold' },
  { id: 'lumiere-diamonds', name: 'Lumière Diamonds', slug: 'lumiere-diamonds' },
  { id: 'royal-heritage', name: 'Royal Heritage', slug: 'royal-heritage' },
  { id: 'saddar-jewellers', name: 'Saddar Jewellers', slug: 'saddar-jewellers' },
  { id: 'pearl-co', name: 'Pearl & Co', slug: 'pearl-co' },
  { id: 'silver-craft', name: 'Silver Craft', slug: 'silver-craft' },
];

export const BEAUTY_DEMO_BRANDS = [
  { id: 'olive-june', name: 'Olive & June', slug: 'olive-june' },
  { id: 'best-nails', name: 'The Best Nails', slug: 'best-nails' },
  { id: 'opi', name: 'O.P.I', slug: 'opi' },
  { id: 'essie', name: 'Essie', slug: 'essie' },
  { id: 'sally-hansen', name: 'Sally Hansen', slug: 'sally-hansen' },
  { id: 'gelish', name: 'Gelish', slug: 'gelish' },
];

export const JEWELLERY_DEMO_QUICK_SEARCH = [
  'Gold Rings',
  'Diamond Necklace',
  'Bridal Sets',
  'Gold Bangles',
  'Earrings',
  'Pearls',
];

export const BEAUTY_DEMO_QUICK_SEARCH = [
  'Nail Polish',
  'Gel Kit',
  'Press-on Nails',
  'Top Coat',
  'Base Coat',
  'Cuticle Serum',
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

const BEAUTY_SEO_BLOCKS = [
  {
    id: 'collections',
    title: 'Explore premium beauty & manicure collections',
    body: 'Browse salon-quality gel polishes, long-lasting top coats, base coats, press-on nails, and complete starter kits. Get the perfect DIY manicure at home with clean, TPO-free formulas.',
  },
  {
    id: 'quality',
    title: 'Clean, safe & 21-Free formulas',
    body: 'We prioritize health and beauty. All our nail polishes and cosmetics are free from harmful chemicals, cruelty-free, and vegan, meeting the highest standards of safety and sustainability.',
  },
  {
    id: 'gifting',
    title: 'Perfect gifts for beauty lovers',
    body: 'From curated gift sets and holiday bundles to professional salon accessories. Secure shipping, beautiful packaging, and easy returns for all orders.',
  },
];

/**
 * @param {string} storeName
 * @param {string} [city]
 * @param {string} [businessCategory]
 */
export function getJewelleryMetadataCopy(storeName, city = '', businessCategory) {
  const region = city ? ` in ${city}` : '';
  const atStore = storeName ? ` at ${storeName}` : '';
  const mode = getStoreMode(businessCategory);

  if (mode === 'beauty') {
    return {
      description: `Shop premium nail polishes, manicure kits, press-on nails, and cosmetic products${atStore}${region}. 21-Free formulas, dermatologically tested and vegan-friendly.`,
      keywords: `nail polish, gel kits, press-on nails, cosmetics, vegan beauty${city ? `, ${city}` : ''}`,
    };
  }

  return {
    description: `Shop certified gold, diamonds, bridal sets, and fine jewelry${atStore}${region}. Hallmark assured 18K-24K gold with GIA certifications and insured delivery.`,
    keywords: `jewelry store, gold jewelry, diamond rings, bridal sets, certified jewelry${city ? `, ${city}` : ''}`,
  };
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 * @param {string | null | undefined} [businessCategory]
 */
export function resolveJewellerySearchPlaceholder(settings = {}, businessDomain, businessCategory) {
  const config = getJewelleryStorefrontConfig(settings, businessDomain, businessCategory);
  return config.searchPlaceholder;
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 * @param {string | null | undefined} [businessCategory]
 */
export function resolveJewelleryTrustPillars(settings = {}, businessDomain, businessCategory) {
  const config = getJewelleryStorefrontConfig(settings, businessDomain, businessCategory);
  const mode = getStoreMode(businessCategory);
  const defaultPillars = mode === 'beauty' ? BEAUTY_DEFAULT_TRUST_PILLARS : JEWELLERY_DEFAULT_TRUST_PILLARS;
  const raw = config.trustPillars || defaultPillars;
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
 * @param {string | null | undefined} [businessCategory]
 */
export function resolveJewelleryBrands(settings = {}, products = [], businessDomain, businessCategory) {
  const config = getJewelleryStorefrontConfig(settings, businessDomain, businessCategory);
  if (config.brands) return config.brands;

  const fromProducts = [...new Set((products || []).map((p) => p.brand).filter(Boolean))].slice(0, 12);
  if (fromProducts.length >= 1) {
    return fromProducts.map((name, i) => ({
      id: `brand-${i}`,
      name: String(name),
      slug: String(name).toLowerCase().replace(/\s+/g, '-'),
    }));
  }

  if (isDemoStoreDomain(businessDomain)) {
    const mode = getStoreMode(businessCategory);
    return mode === 'beauty' ? BEAUTY_DEMO_BRANDS : JEWELLERY_DEMO_BRANDS;
  }
  return [];
}

/**
 * @param {object} [settings]
 * @param {object[]} [products]
 * @param {object[]} [categories]
 * @param {string | null | undefined} [businessDomain]
 * @param {string | null | undefined} [businessCategory]
 */
export function resolveJewelleryQuickSearchTerms(settings = {}, products = [], categories = [], businessDomain, businessCategory) {
  const config = getJewelleryStorefrontConfig(settings, businessDomain, businessCategory);
  const terms = buildQuickSearchTerms(products, categories, config.quickSearchTerms, 6);
  if (terms.length) return terms;

  if (isDemoStoreDomain(businessDomain)) {
    const mode = getStoreMode(businessCategory);
    return mode === 'beauty' ? BEAUTY_DEMO_QUICK_SEARCH : JEWELLERY_DEMO_QUICK_SEARCH;
  }
  return (categories || []).slice(0, 6).map((c) => c.name).filter(Boolean);
}

/**
 * @param {string} storeName
 * @param {string} [businessDescription]
 * @param {string} [country]
 * @param {string} [businessCategory]
 */
export function resolveJewellerySeoBlocks(storeName, businessDescription = '', country = '', businessCategory) {
  const mode = getStoreMode(businessCategory);
  const displayName = mode === 'beauty'
    ? formatElevatedStoreName(storeName, 'Our beauty store')
    : formatJewelleryStoreName(storeName);
  const region = country ? ` in ${country}` : '';
  const intro = String(businessDescription || '').trim();
  const defaultSeo = mode === 'beauty' ? BEAUTY_SEO_BLOCKS : JEWELLERY_SEO_BLOCKS;

  return [
    {
      id: 'about',
      title: `${displayName}, premium beauty products${region}`,
      body: intro || (mode === 'beauty'
        ? `Discover clean, vegan nail polishes, manicure sets, and cosmetics from ${displayName}. Shop dermatologically tested formulas with premium packaging and fast delivery.`
        : `Discover certified gold, diamonds, and bridal jewelry from ${displayName}. Shop hallmark-assured pieces with GIA certifications, insured delivery, and luxury packaging.`),
    },
    ...defaultSeo,
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
 * @param {string} [businessCategory]
 * @returns {JewelleryHeroSlide[]}
 */
export function getJewelleryEditorialSlides(base, businessCategory) {
  const products = `${base}/products`;
  const mode = getStoreMode(businessCategory);

  if (mode === 'beauty') {
    return [
      {
        eyebrow: 'Loved by 20,000+ nail lovers',
        title: 'Nail Salon Quality, Done at Home',
        subtitle: 'Patented 21-free clean formulas, gel kits, and press-on nails with free delivery.',
        image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1600&q=85&auto=format&fit=crop',
        ctaLabel: 'Shop Polish & Gel',
        ctaHref: `${products}?category=polish`,
        rating: 4.9,
        ratingText: 'from 8,500+ nail reviews',
        promoTag: 'TPO & 21-Free',
      },
      {
        eyebrow: 'Everything you need in one box',
        title: 'Complete Manicure Systems',
        subtitle: 'Our award-winning Mani Systems include clean polishes, top coats, base coats, and professional tools.',
        image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=1600&q=85&auto=format&fit=crop',
        ctaLabel: 'Shop Mani Systems',
        ctaHref: `${products}?category=kits`,
        rating: 4.9,
        ratingText: 'from 4,200+ system buyers',
        promoTag: 'Mani Systems',
      },
      {
        eyebrow: 'Zero dry time, perfect application',
        title: 'Instant Press-On Manicures',
        subtitle: 'Pop on in seconds, lasts up to two weeks. Choose from custom colors and premium finishes.',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&q=85&auto=format&fit=crop',
        ctaLabel: 'Explore Press-Ons',
        ctaHref: `${products}?category=press-on`,
        rating: 4.8,
        ratingText: 'from 3,000+ press-on fans',
        promoTag: 'Press-On Nails',
      },
    ];
  }

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
 * @param {string} [businessCategory]
 */
export function getJewelleryHeroSlides(base, settings = {}, ctx = {}, businessCategory) {
  const defaultSlides = getJewelleryEditorialSlides(base, businessCategory);
  const config = getJewelleryStorefrontConfig(settings, null, businessCategory);
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

/** Beauty categories for circular showcase. */
export const BEAUTY_CATEGORY_CIRCLES = [
  { id: 'polish', label: 'POLISH & GEL', keywords: ['polish', 'gel', 'lacquer', 'liquid'] },
  { id: 'press-on', label: 'PRESS-ONS', keywords: ['press-on', 'nails', 'tips'] },
  { id: 'kits', label: 'MANI KITS', keywords: ['kit', 'system', 'set', 'starter'] },
  { id: 'tools', label: 'TOOLS', keywords: ['tool', 'clipper', 'file', 'remover', 'buffer'] },
  { id: 'care', label: 'CARE & SERUM', keywords: ['care', 'serum', 'oil', 'strengthener'] },
  { id: 'lamps', label: 'LED LAMPS', keywords: ['lamp', 'led', 'uv', 'dryer'] },
  { id: 'gifts', label: 'GIFTS', keywords: ['gift', 'bundle', 'holiday'] },
];

/**
 * Build jewelry and beauty specifications from domain_data for PDP tabs.
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
    ['volume', 'Volume'],
    ['ingredients', 'Ingredients'],
    ['skinType', 'Skin Type'],
    ['finish', 'Finish'],
    ['sourcing', 'Sourcing'],
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
 * Build jewelry/beauty navigation structure with tabs and promo banners.
 * @param {string} base `/store/{domain}`
 * @param {Array<{ slug: string; name: string }>} [storeCategories]
 * @param {string} [businessCategory]
 * @returns {{ tabs: NavTab[]; promos: Array<{ title: string; subtitle?: string; href: string; image: string }> }}
 */
export function getJewelleryEditorialNav(base, storeCategories = [], businessCategory) {
  const products = `${base}/products`;
  const slides = getJewelleryEditorialSlides(base, businessCategory);
  const mode = getStoreMode(businessCategory);
  
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

  // Preset navigation tabs depending on store mode (jewelry vs beauty)
  /** @type {NavTab[]} */
  const presetTabs = mode === 'beauty'
    ? [
        {
          id: 'collections',
          label: 'Collections',
          categories: [
            { id: 'polish', label: 'Polish & Gel', icon: 'star', href: `${products}?category=polish` },
            { id: 'press-on', label: 'Press-on Nails', icon: 'sparkles', href: `${products}?category=press-on` },
            { id: 'kits', label: 'Mani Systems', icon: 'gift', href: `${products}?category=kits` },
            { id: 'care', label: 'Care & Serum', icon: 'heart', href: `${products}?category=care` },
            { id: 'tools', label: 'Nail Tools', icon: 'circle', href: `${products}?category=tools` },
            { id: 'lamps', label: 'LED Lamps', icon: 'circle', href: `${products}?category=lamps` },
          ],
        },
        {
          id: 'beauty',
          label: 'Shop by Need',
          categories: [
            { id: 'diy', label: 'DIY Manicure', icon: 'circle', href: `${products}?search=manicure` },
            { id: 'pedicure', label: 'Pedicure', icon: 'circle', href: `${products}?search=pedicure` },
            { id: 'gifts', label: 'Gifts & Bundles', icon: 'package', href: `${products}?sort=featured` },
          ],
        },
      ]
    : [
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
