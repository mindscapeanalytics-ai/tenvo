/**
 * Elevated tyre retail + bay storefront — tenant-aware with Tenvo Tyre Store demo defaults.
 * Isolated to canonical `tyre-shop` vertical.
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import {
  formatElevatedStoreName,
  buildCategoryNavItems,
  buildQuickSearchTerms,
  buildTenantHeroSlides,
  enrichCategoryNavImages,
  filterProductsByCategorySlug,
  isDemoStoreDomain,
  buildPromoBannersFromCatalog,
} from '@/lib/storefront/elevatedStorefrontTenant';
import {
  getEffectiveProductImageUrl,
  getFallbackProductImageUrl,
} from '@/lib/storefront/productImageFallback';
import { isDeadImageUrl } from '@/lib/storefront/deadImageHosts';
import { TYRE_SEED_PRODUCTS } from '@/lib/dataLab/tyreDemoCatalog';
import { isStorefrontProductUuid } from '@/lib/utils/storefrontProductRef';
import {
  TYRE_HERO_IMAGES,
  TYRE_BRAND_LOGOS,
  TYRE_GTR_PRODUCT_IMAGES,
  TYRE_TECHNO_PRODUCT_IMAGES,
  TYRE_BAY_SERVICE_IMAGES,
} from '@/lib/dataLab/tyreArchiveAssets';

export {
  TYRE_HERO_IMAGES,
  TYRE_GTR_PRODUCT_IMAGES,
  TYRE_TECHNO_PRODUCT_IMAGES,
  TYRE_BAY_SERVICE_IMAGES,
};
export const TYRE_ELEVATED_CANONICALS = new Set(['tyre-shop']);

export const TYRE_ASPHALT = '#0a0a0a';
export const TYRE_ASPHALT_DARK = '#050505';
export const TYRE_CRIMSON = '#CC1532';
export const TYRE_CRIMSON_DARK = '#9f1027';
export const TYRE_SURFACE = '#f4f4f5';

export const TYRE_ACCENTS = {
  accent: TYRE_CRIMSON,
  accentDark: TYRE_CRIMSON_DARK,
  accentLight: '#fef2f2',
};

/**
 * @param {string | null | undefined} category
 */
export function isTyreElevatedStore(category) {
  return TYRE_ELEVATED_CANONICALS.has(resolveDomainKey(category));
}

/**
 * @param {string | null | undefined} name
 */
export function formatTyreStoreName(name) {
  return formatElevatedStoreName(name, 'Our tyre store');
}

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function normalizeTyreVideoUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function getTyreConfig(settings = {}, businessDomain) {
  const raw = settings?.storefront?.tyre || {};
  const isDemo = isDemoStoreDomain(businessDomain);

  const brandStoriesFromFlat = [1, 2]
    .map((n) => {
      const title = typeof raw[`brandStory${n}Title`] === 'string' ? raw[`brandStory${n}Title`].trim() : '';
      const image = typeof raw[`brandStory${n}Image`] === 'string' ? raw[`brandStory${n}Image`].trim() : '';
      if (!title && !image) return null;
      return {
        id: `brand-${n}`,
        eyebrow: typeof raw[`brandStory${n}Eyebrow`] === 'string' ? raw[`brandStory${n}Eyebrow`].trim() : '',
        title,
        subtitle: typeof raw[`brandStory${n}Subtitle`] === 'string' ? raw[`brandStory${n}Subtitle`].trim() : '',
        image,
        ctaLabel: typeof raw[`brandStory${n}Cta`] === 'string' ? raw[`brandStory${n}Cta`].trim() : '',
        href: typeof raw[`brandStory${n}Href`] === 'string' ? raw[`brandStory${n}Href`].trim() : '',
      };
    })
    .filter(Boolean);

  const brandStories =
    Array.isArray(raw.brandStories) && raw.brandStories.length
      ? raw.brandStories
      : brandStoriesFromFlat.length
        ? brandStoriesFromFlat
        : null;

  return {
    locationLabel: raw.locationLabel || 'Deliver to',
    defaultLocation: raw.defaultLocation || '',
    searchPlaceholder: raw.searchPlaceholder || 'Search size, brand, or model…',
    bayLabel: raw.bayLabel || 'Book fitting bay',
    showTrustStrip: raw.showTrustStrip !== false,
    showExploreSection: raw.showExploreSection !== false,
    showVehicleTiles: raw.showVehicleTiles !== false,
    showBrandWall: raw.showBrandWall !== false,
    showAlloyRail: raw.showAlloyRail !== false,
    showServices: raw.showServices !== false,
    showBayCta: raw.showBayCta !== false,
    showLifestyleSpotlight: raw.showLifestyleSpotlight !== false,
    showBrandStories: raw.showBrandStories !== false,
    showPromoMosaic: raw.showPromoMosaic === true,
    showOemPartners: raw.showOemPartners !== false,
    showSafetyBand: raw.showSafetyBand !== false,
    showCareTips: raw.showCareTips !== false,
    showTestimonials: raw.showTestimonials === true || (raw.showTestimonials === undefined && isDemo),
    showMarketingBanners: raw.showMarketingBanners !== false,
    featuredRailTitle: raw.featuredRailTitle || '',
    featuredRailSubtitle: raw.featuredRailSubtitle || '',
    exploreTitle: typeof raw.exploreTitle === 'string' ? raw.exploreTitle.trim() : '',
    exploreSubtitle: typeof raw.exploreSubtitle === 'string' ? raw.exploreSubtitle.trim() : '',
    exploreBackgroundImage:
      typeof raw.exploreBackgroundImage === 'string' ? raw.exploreBackgroundImage.trim() : '',
    heroVideoUrl: normalizeTyreVideoUrl(raw.heroVideoUrl) || '',
    bayCtaTitle: typeof raw.bayCtaTitle === 'string' ? raw.bayCtaTitle.trim() : '',
    bayCtaSubtitle: typeof raw.bayCtaSubtitle === 'string' ? raw.bayCtaSubtitle.trim() : '',
    heroSlides: Array.isArray(raw.heroSlides) && raw.heroSlides.length ? raw.heroSlides : null,
    vehicleTiles: Array.isArray(raw.vehicleTiles) && raw.vehicleTiles.length ? raw.vehicleTiles : null,
    exploreSegments: Array.isArray(raw.exploreSegments) && raw.exploreSegments.length ? raw.exploreSegments : null,
    brands: Array.isArray(raw.brands) && raw.brands.length ? raw.brands : null,
    trustPillars: Array.isArray(raw.trustPillars) && raw.trustPillars.length ? raw.trustPillars : null,
    services: Array.isArray(raw.services) && raw.services.length ? raw.services : null,
    promoBanners: Array.isArray(raw.promoBanners) && raw.promoBanners.length ? raw.promoBanners : null,
    editorialBanners: Array.isArray(raw.editorialBanners) && raw.editorialBanners.length ? raw.editorialBanners : null,
    brandStories,
    quickSearchTerms: Array.isArray(raw.quickSearchTerms) && raw.quickSearchTerms.length ? raw.quickSearchTerms : null,
    testimonials: Array.isArray(raw.testimonials) && raw.testimonials.length ? raw.testimonials : null,
    finderDefaults: raw.finderDefaults && typeof raw.finderDefaults === 'object' ? raw.finderDefaults : null,
  };
}

export const TYRE_DEMO_QUICK_SEARCH_TERMS = [
  '185/65R15',
  '205/55R16',
  'Michelin',
  'GTR',
  'SUV',
  'Alloy rims',
];

export const TYRE_FINDER_WIDTHS = ['155', '165', '175', '185', '195', '205', '215', '225', '235', '245', '255', '265'];
export const TYRE_FINDER_PROFILES = ['40', '45', '50', '55', '60', '65', '70', '75'];
export const TYRE_FINDER_RIMS = ['13', '14', '15', '16', '17', '18', '19', '20'];

/**
 * Build products URL query for size finder.
 * @param {string} base
 * @param {{ width?: string; profile?: string; rim?: string }} size
 */
export function buildTyreFinderHref(base, size = {}) {
  const products = `${base}/products`;
  const width = String(size.width || '').trim();
  const profile = String(size.profile || '').trim();
  const rim = String(size.rim || '').trim();
  if (width && profile && rim) {
    const sizeStr = `${width}/${profile}R${rim}`;
    return `${products}?search=${encodeURIComponent(sizeStr)}&width=${encodeURIComponent(width)}&profile=${encodeURIComponent(profile)}&rim=${encodeURIComponent(rim)}`;
  }
  const parts = [];
  if (width) parts.push(`width=${encodeURIComponent(width)}`);
  if (profile) parts.push(`profile=${encodeURIComponent(profile)}`);
  if (rim) parts.push(`rim=${encodeURIComponent(rim)}`);
  return parts.length ? `${products}?${parts.join('&')}` : products;
}

/**
 * @param {string} base
 */
export function getTyreNavLinks(base, categories = []) {
  const fromDb = buildCategoryNavItems(categories, base, { max: 6, includeDeals: true });
  if (fromDb.length) {
    return fromDb.map((item) => ({ id: item.id, label: item.label, href: item.href }));
  }
  const products = `${base}/products`;
  return [
    { id: 'all', label: 'All tyres', href: products },
    { id: 'sale', label: 'Offers', href: `${products}?onSale=true` },
    { id: 'bay', label: 'Fitting bay', href: `${base}/contact` },
  ];
}

export const TYRE_DEMO_VEHICLE_TILES = [
  {
    id: 'passenger',
    label: 'Passenger Car',
    slug: 'passenger-car',
    desc: 'Touring & performance PCR',
    image: TYRE_GTR_PRODUCT_IMAGES.luxoPlus,
  },
  {
    id: 'suv',
    label: 'SUV / Crossover',
    slug: 'suv-crossover',
    desc: 'Highway & all-terrain',
    image: TYRE_GTR_PRODUCT_IMAGES.raptor,
  },
  {
    id: 'light-truck',
    label: 'Light Truck',
    slug: 'light-truck',
    desc: 'Commercial light load',
    image: TYRE_GTR_PRODUCT_IMAGES.cargo,
  },
  {
    id: 'commercial',
    label: 'Commercial / OTR',
    slug: 'commercial-otr',
    desc: 'Truck, bus & off-road',
    image: TYRE_GTR_PRODUCT_IMAGES.rhinoPower,
  },
  {
    id: 'motorcycle',
    label: 'Motorcycle / Rickshaw',
    slug: 'motorcycle-rickshaw',
    desc: 'Two & three wheelers',
    image: TYRE_GTR_PRODUCT_IMAGES.gqt,
  },
  {
    id: 'agri',
    label: 'Tractor / Agri',
    slug: 'tractor-agri',
    desc: 'Farm & implement tyres',
    image: TYRE_GTR_PRODUCT_IMAGES.agriGold,
  },
];

export const TYRE_DEMO_BRANDS = [
  { id: 'gtr', label: 'GTR', sourcing: 'local', hrefSuffix: '?search=GTR', image: TYRE_GTR_PRODUCT_IMAGES.econo },
  { id: 'michelin', label: 'Michelin', sourcing: 'imported', hrefSuffix: '?search=Michelin', image: TYRE_BRAND_LOGOS.michelin },
  { id: 'bridgestone', label: 'Bridgestone', sourcing: 'imported', hrefSuffix: '?search=Bridgestone', image: TYRE_GTR_PRODUCT_IMAGES.falcon },
  { id: 'yokohama', label: 'Yokohama', sourcing: 'imported', hrefSuffix: '?search=Yokohama', image: TYRE_BRAND_LOGOS.yokohama },
  { id: 'gt-radial', label: 'GT Radial', sourcing: 'imported', hrefSuffix: '?search=GT%20Radial', image: TYRE_BRAND_LOGOS.gtRadial },
  { id: 'otani', label: 'Otani', sourcing: 'imported', hrefSuffix: '?search=Otani', image: TYRE_GTR_PRODUCT_IMAGES.maxSport },
  { id: 'hankook', label: 'Hankook', sourcing: 'imported', hrefSuffix: '?search=Hankook', image: TYRE_GTR_PRODUCT_IMAGES.aquaGrip },
  { id: 'continental', label: 'Continental', sourcing: 'imported', hrefSuffix: '?search=Continental', image: TYRE_GTR_PRODUCT_IMAGES.challenger },
];

export const TYRE_DEFAULT_TRUST_PILLARS = [
  { id: 'dot', label: 'Fresh DOT stock', desc: 'Batch-aware inventory for safer rubber' },
  { id: 'bay', label: 'Fitting bay ready', desc: 'Mount, balance, and alignment on site' },
  { id: 'warranty', label: 'Warranty support', desc: 'Claim guidance on covered products' },
  { id: 'sourcing', label: 'Local + imported', desc: 'GTR and global brands in one bay' },
];

export const TYRE_DEMO_SERVICES = [
  {
    id: 'fit',
    title: 'Fitting & balancing',
    subtitle: 'Full set mount with computer balance',
    ctaLabel: 'Book fitting',
    hrefSuffix: '?search=Fitting',
    image: TYRE_BAY_SERVICE_IMAGES.fitting,
  },
  {
    id: 'align',
    title: 'Wheel alignment',
    subtitle: 'Four-wheel computerized alignment',
    ctaLabel: 'Book alignment',
    hrefSuffix: '?search=Alignment',
    image: TYRE_BAY_SERVICE_IMAGES.alignment,
  },
  {
    id: 'puncture',
    title: 'Puncture repair',
    subtitle: 'Tubeless plug or patch service',
    ctaLabel: 'Repair puncture',
    hrefSuffix: '?search=Puncture',
    image: TYRE_BAY_SERVICE_IMAGES.puncture,
  },
  {
    id: 'rims',
    title: 'Alloy wheels',
    subtitle: 'Upgrade looks and handling',
    ctaLabel: 'Shop alloys',
    hrefSuffix: '?category=alloy-rims',
    image: TYRE_BAY_SERVICE_IMAGES.alloy,
  },
];

export const TYRE_BAY_CTA_IMAGE = TYRE_BAY_SERVICE_IMAGES.bayCta;

export const TYRE_EXPLORE_SEGMENTS = [
  { id: 'light-truck', tabLabel: 'Light truck tyres', slug: 'light-truck', icon: 'truck' },
  { id: 'motorcycle', tabLabel: 'Motorcycle / rickshaw tyres', slug: 'motorcycle-rickshaw', icon: 'bike' },
  { id: 'passenger', tabLabel: 'Passenger car tyres', slug: 'passenger-car', icon: 'car' },
  { id: 'suv', tabLabel: 'SUV / crossover tyres', slug: 'suv-crossover', icon: 'car-front' },
  { id: 'agri', tabLabel: 'Tractor tyres', slug: 'tractor-agri', icon: 'sprout' },
  { id: 'commercial', tabLabel: 'Truck & bus / OTR tyres', slug: 'commercial-otr', icon: 'hard-hat' },
];

/** Slug → match tokens for DB category names/slugs (archive terms + seed labels). */
export const TYRE_EXPLORE_SLUG_MATCHERS = Object.freeze({
  'light-truck': ['light-truck', 'light truck', 'light-truck-tyres', 'lt'],
  'motorcycle-rickshaw': [
    'motorcycle-rickshaw',
    'motorcycle',
    'rickshaw',
    'motorcycle / rickshaw',
    'motorcycle-rickshaw-tyres',
  ],
  'passenger-car': ['passenger-car', 'passenger car', 'passenger', 'pcr', 'passenger-car-tyres'],
  'suv-crossover': [
    'suv-crossover',
    'suv-crossovers',
    'suv / crossover',
    'suv/crossover',
    'suv',
    'crossover',
    'suv-crossovers-tyres',
  ],
  'tractor-agri': ['tractor-agri', 'tractor / agri', 'tractor', 'agri', 'tractor-tyres'],
  'commercial-otr': [
    'commercial-otr',
    'commercial / otr',
    'commercial',
    'otr',
    'truck & bus',
    'truck-bus',
    'truck bus',
    'truck-bus-otr-tyres',
  ],
});

/** OEM partner strip — local transparent logo marks (not lifestyle banners). */
export const TYRE_OEM_PARTNERS = [
  { id: 'honda', label: 'Honda', image: '/storefront/tyre/oem/honda.svg' },
  { id: 'toyota', label: 'Toyota', image: '/storefront/tyre/oem/toyota.svg' },
  { id: 'suzuki', label: 'Suzuki', image: '/storefront/tyre/oem/suzuki.svg' },
  { id: 'kia', label: 'Kia', image: '/storefront/tyre/oem/kia.svg' },
  { id: 'hyundai', label: 'Hyundai', image: '/storefront/tyre/oem/hyundai.svg' },
];

/** Archive-style tyre care tips. */
export const TYRE_CARE_TIPS = [
  {
    id: 'pressure',
    title: 'Why tyre pressure matters',
    body: 'Correct pressure improves grip, wear life, and fuel use. Check cold tyres monthly.',
  },
  {
    id: 'rotate',
    title: 'Rotate on schedule',
    body: 'Rotate every 8,000–10,000 km so front and rear wear stay even across the set.',
  },
  {
    id: 'align',
    title: 'Alignment after impacts',
    body: 'Pulling, uneven shoulder wear, or a hard curb hit means book a four-wheel alignment.',
  },
  {
    id: 'age',
    title: 'Watch age and DOT',
    body: 'Even with tread left, aged rubber hardens. Ask the bay to read DOT week/year on the sidewall.',
  },
];

export const TYRE_EXPLORE_BACKGROUND = TYRE_HERO_IMAGES.exploreOurTyres;

/** Demo editorial + promo blocks (furniture-style company storytelling). */
export const TYRE_DEMO_EDITORIAL_BANNERS = [
  {
    id: 'suv-confidence',
    eyebrow: 'SUV & crossover',
    title: 'All-season SUV confidence',
    subtitle: 'Stable highway manners and wet grip for family crossovers and 4x4s.',
    image: TYRE_GTR_PRODUCT_IMAGES.raptor,
    href: '?category=suv-crossover',
  },
  {
    id: 'imported-touring',
    eyebrow: 'Imported touring',
    title: 'Premium imported lines',
    subtitle: 'Michelin, Yokohama, and GT Radial with accurate load and speed ratings.',
    image: TYRE_TECHNO_PRODUCT_IMAGES.p05,
    href: '?search=Michelin',
  },
  {
    id: 'commercial-fleet',
    eyebrow: 'Commercial fleet',
    title: 'Built for load and mileage',
    subtitle: 'Light-truck and OTR ranges with bay fitting and fleet-friendly pricing.',
    image: TYRE_GTR_PRODUCT_IMAGES.cargo,
    href: '?category=light-truck',
  },
];

export const TYRE_DEMO_PROMO_BANNERS = [
  {
    id: 'offers',
    title: 'Season offers',
    subtitle: 'Sized deals ready for same-day fitting',
    image: TYRE_GTR_PRODUCT_IMAGES.maxSport,
    href: '?onSale=true',
    tone: 'light',
  },
  {
    id: 'alloys',
    title: 'Alloy wheel sets',
    subtitle: 'Complete the look with rim upgrades',
    image: TYRE_TECHNO_PRODUCT_IMAGES.p04,
    href: '?category=alloy-rims',
    tone: 'light',
  },
];

export const TYRE_DEMO_BRAND_STORIES = [
  {
    id: 'local-gtr',
    eyebrow: 'Local manufacturing',
    title: 'Engineered for Pakistani roads',
    subtitle:
      'GTR ranges built for heat, load, and daily commuting with warranty-backed support and bay-ready fitting.',
    image: TYRE_GTR_PRODUCT_IMAGES.maxSport,
    imageFit: 'contain',
    ctaLabel: 'Shop GTR',
    href: '?search=GTR',
  },
  {
    id: 'imported-lines',
    eyebrow: 'Imported touring',
    title: 'Global brands, fitted with care',
    subtitle:
      'Michelin, Yokohama, and GT Radial lines with accurate size details and professional mount & balance.',
    image: TYRE_TECHNO_PRODUCT_IMAGES.p05,
    imageFit: 'contain',
    ctaLabel: 'Browse imports',
    href: '?search=Michelin',
  },
];

const TYRE_BRAND_STORIES_MAX = 2;
const TYRE_PROMO_MOSAIC_MAX = 2;

export const TYRE_DEMO_TESTIMONIALS = [
  {
    id: '1',
    quote: 'Found my Civic size in minutes, fitted the same day. Local GTR set felt solid on the motorway.',
    product: 'GTR BG Luxo Plus',
    author: 'Karachi sedan owner',
  },
  {
    id: '2',
    quote: 'Imported Michelin SUV tyres with alignment in one visit. Clear pricing and no pressure upsell.',
    product: 'Michelin Primacy SUV+',
    author: 'Lahore SUV driver',
  },
  {
    id: '3',
    quote: 'Fleet light-truck replacements with proper load ratings. Bay turned us around quickly.',
    product: 'GTR BG Cargo',
    author: 'Logistics manager',
  },
];

const TYRE_DEMO_HERO_SLIDES = [
  {
    eyebrow: '{storeName} · Local & imported',
    title: 'Find the right tyre. Fit it today.',
    subtitle: 'Size-first search across passenger, SUV, commercial, and agri ranges with bay-ready fitting.',
    image: TYRE_HERO_IMAGES.banner1,
    ctaLabel: 'Shop tyres',
    ctaHref: '/products',
  },
  {
    eyebrow: 'Trusted brands',
    title: 'GTR, Michelin, Yokohama, and more',
    subtitle: 'Local manufacturers and imported touring lines with accurate size and load details.',
    image: TYRE_HERO_IMAGES.toyota,
    ctaLabel: 'Browse brands',
    ctaHref: '/products?search=Michelin',
  },
  {
    eyebrow: 'Fitting bay',
    title: 'Mount, balance, and align in one stop',
    subtitle: 'Book a bay visit or message us on WhatsApp with your size and vehicle.',
    image: TYRE_HERO_IMAGES.rubber,
    ctaLabel: 'Contact bay',
    ctaHref: '/contact',
  },
];

/** Marketing / homepage gallery hero */
export const TYRE_MARKETING_HERO_IMAGE = TYRE_DEMO_HERO_SLIDES[0]?.image || TYRE_HERO_IMAGES.banner1;

/**
 * @param {string} base
 * @param {object} [settings]
 * @param {{ storeName?: string; businessDomain?: string; businessDescription?: string; coverImage?: string | null; products?: object[] }} [ctx]
 */
export function getTyreHeroSlides(base, settings = {}, ctx = {}) {
  const config = getTyreConfig(settings, ctx.businessDomain);
  const storeName = ctx.storeName || formatTyreStoreName('');
  const featured = (ctx.products || []).filter((p) => p.is_featured && p.image_url);
  const slides = buildTenantHeroSlides({
    settings,
    settingsSlides: config.heroSlides,
    base,
    storeName,
    businessDescription: ctx.businessDescription,
    coverImage: ctx.coverImage,
    demoSlides: TYRE_DEMO_HERO_SLIDES,
    isDemo: isDemoStoreDomain(ctx.businessDomain),
    featuredProducts: featured.length ? featured : (ctx.products || []).filter((p) => p.image_url).slice(0, 4),
  });
  if (config.heroVideoUrl && slides[0]) {
    return slides.map((s, i) => (i === 0 ? { ...s, videoUrl: config.heroVideoUrl } : s));
  }
  return slides;
}

function productComparePrice(p) {
  return p?.compare_price ?? p?.compare_at_price;
}

function isServiceProduct(p) {
  const cat = String(p?.category_name || p?.category || '').toLowerCase();
  return /service|fitting|alignment|puncture/.test(cat);
}

function isAlloyProduct(p) {
  const cat = String(p?.category_name || p?.category || '').toLowerCase();
  const name = String(p?.name || '').toLowerCase();
  return /alloy|rim|wheel/.test(cat) || /alloy rim|alloy wheel/.test(name);
}

/**
 * @param {object[]} products
 */
export function partitionTyreProducts(products = []) {
  const sorted = [...(products || [])].sort((a, b) => {
    const aIn = a.stock == null || Number(a.stock) > 0 ? 0 : 1;
    const bIn = b.stock == null || Number(b.stock) > 0 ? 0 : 1;
    if (aIn !== bIn) return aIn - bIn;
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });
  const pool = sorted;
  const retail = pool.filter((p) => !isServiceProduct(p));
  const onSale = retail.filter((p) => {
    const compare = productComparePrice(p);
    return compare && Number(compare) > Number(p.price);
  });
  const featured = retail.filter((p) => p.is_featured);
  const topPicks = (featured.length ? featured : retail).slice(0, 12);
  const topIds = new Set(topPicks.map((p) => p.id || p.sku));
  const deals = (onSale.length ? onSale : retail.filter((p) => productComparePrice(p)))
    .filter((p) => !topIds.has(p.id || p.sku))
    .slice(0, 12);
  const alloy = retail.filter(isAlloyProduct).slice(0, 12);
  const services = pool.filter(isServiceProduct).slice(0, 8);

  return { topPicks, deals, alloy, services };
}

export function filterTyreByCategorySlug(products = [], slug) {
  return filterProductsByCategorySlug(products, slug);
}

function isUsableImage(url) {
  if (typeof url !== 'string' || !url.trim()) return false;
  if (isDeadImageUrl(url)) return false;
  if (url.includes('ui-avatars.com')) return false;
  if (url.startsWith('data:')) return false;
  return true;
}

/**
 * @param {object[]} [products]
 * @param {{ slug?: string; label?: string }} item
 */
function pickCategoryImage(products, item, businessCategory) {
  const slug = String(item?.slug || '').toLowerCase();
  const label = String(item?.label || '').toLowerCase();
  const matches = (products || []).filter((p) => {
    const pSlug = String(p?.category_slug || '').toLowerCase();
    const pName = String(p?.category_name || p?.category || '').toLowerCase();
    if (slug && pSlug === slug) return true;
    if (label && pName === label) return true;
    if (slug && pName.replace(/\s+/g, '-') === slug) return true;
    return false;
  });
  for (const p of matches) {
    const image = getEffectiveProductImageUrl(p, businessCategory || 'tyre-shop');
    if (isUsableImage(image)) return image;
  }
  return '';
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ categories?: object[]; products?: object[]; businessDomain?: string; businessCategory?: string }} [ctx]
 */
export function resolveTyreVehicleTiles(settings, storeBase, ctx = {}) {
  const config = getTyreConfig(settings, ctx.businessDomain);
  if (!config.showVehicleTiles) return [];
  const productsUrl = `${storeBase}/products`;
  const mapItem = (item) => {
    const fromInv = pickCategoryImage(ctx.products, item, ctx.businessCategory);
    return {
      ...item,
      image: fromInv || item.image || getFallbackProductImageUrl({ name: item.label }, 'tyre-shop'),
      href: item.href || `${productsUrl}${item.slug ? `?category=${encodeURIComponent(item.slug)}` : ''}`,
    };
  };

  if (config.vehicleTiles) return config.vehicleTiles.map(mapItem);

  const fromDb = buildCategoryNavItems(ctx.categories, storeBase, { max: 6, includeDeals: false })
    .filter((c) => c.label && !/service|fitting|deal/i.test(c.label))
    .slice(0, 6)
    .map((c) =>
      mapItem({
        id: c.id,
        label: c.label,
        slug: c.slug || '',
        desc: '',
        image: c.image || '',
        href: c.href,
      })
    );

  if (fromDb.length >= 4) return fromDb;

  const demo = isDemoStoreDomain(ctx.businessDomain) || fromDb.length === 0;
  if (!demo) return fromDb;

  const demoMapped = TYRE_DEMO_VEHICLE_TILES.map(mapItem);
  const merged = [...fromDb];
  for (const tile of demoMapped) {
    if (merged.length >= 6) break;
    if (merged.some((t) => t.slug === tile.slug || t.label === tile.label)) continue;
    merged.push(tile);
  }
  return merged.slice(0, 6);
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessDomain?: string; products?: object[] }} [ctx]
 */
export function resolveTyreBrandWall(settings, storeBase, ctx = {}) {
  const config = getTyreConfig(settings, ctx.businessDomain);
  if (!config.showBrandWall) return [];
  const productsUrl = `${storeBase}/products`;
  if (config.brands) {
    return config.brands.map((b) => ({
      ...b,
      href: b.href || `${productsUrl}${b.hrefSuffix || `?search=${encodeURIComponent(b.label || '')}`}`,
    }));
  }

  const brandCounts = new Map();
  for (const p of ctx.products || []) {
    const brand =
      String(p?.brand || p?.domain_data?.brand || '').trim() ||
      '';
    if (!brand || /tenvo tyre|tenvo wheels/i.test(brand)) continue;
    brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
  }
  const fromCatalog = [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label], i) => {
      const demo = TYRE_DEMO_BRANDS.find((d) => d.label.toLowerCase() === label.toLowerCase());
      return {
        id: `brand-${i}`,
        label,
        sourcing: demo?.sourcing || 'imported',
        image: demo?.image || TYRE_GTR_PRODUCT_IMAGES.econo,
        href: `${productsUrl}?search=${encodeURIComponent(label)}`,
      };
    });

  if (fromCatalog.length >= 4) return fromCatalog;
  if (!isDemoStoreDomain(ctx.businessDomain) && fromCatalog.length) return fromCatalog;
  return TYRE_DEMO_BRANDS.map((b) => ({
    ...b,
    href: `${productsUrl}${b.hrefSuffix}`,
  }));
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveTyreTrustPillars(settings, businessDomain) {
  const config = getTyreConfig(settings, businessDomain);
  if (!config.showTrustStrip) return [];
  return config.trustPillars || TYRE_DEFAULT_TRUST_PILLARS;
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessDomain?: string }} [ctx]
 */
export function resolveTyreServices(settings, storeBase, ctx = {}) {
  const config = getTyreConfig(settings, ctx.businessDomain);
  if (!config.showServices) return [];
  const productsUrl = `${storeBase}/products`;
  const list = config.services || TYRE_DEMO_SERVICES;
  const catalog = Array.isArray(ctx.products) ? ctx.products : [];
  const defaultsById = new Map(TYRE_DEMO_SERVICES.map((s) => [s.id, s]));

  return list.map((s) => {
    const fallback = defaultsById.get(s.id) || {};
    const searchHint = String(s.title || fallback.title || '')
      .split(/[&/]| and /i)[0]
      .trim();
    const fromCatalog = catalog.find((p) => {
      const name = String(p.name || '').toLowerCase();
      const cat = String(p.category || p.category_name || '').toLowerCase();
      const needle = searchHint.toLowerCase();
      if (!needle) return false;
      if (s.id === 'rims') return /alloy|rim/.test(name) || /alloy|rim/.test(cat);
      return name.includes(needle) || (cat.includes('service') && name.includes(needle.split(' ')[0]));
    });
    const catalogImage =
      fromCatalog &&
      (getEffectiveProductImageUrl(fromCatalog, ctx.businessCategory) ||
        fromCatalog.image_url ||
        fromCatalog.image);
    const image =
      (isUsableImage(s.image) && s.image) ||
      (isUsableImage(catalogImage) && catalogImage) ||
      fallback.image ||
      TYRE_BAY_SERVICE_IMAGES.fitting;

    return {
      ...fallback,
      ...s,
      image,
      ctaLabel: s.ctaLabel || fallback.ctaLabel || 'Learn more',
      href: s.href || `${productsUrl}${s.hrefSuffix || fallback.hrefSuffix || ''}`,
    };
  });
}

/**
 * Lifestyle image for the fitting-bay CTA band.
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveTyreBayCtaImage(settings, businessDomain) {
  const raw = settings?.storefront?.tyre?.bayCtaImage;
  if (isUsableImage(raw)) return String(raw).trim();
  return TYRE_BAY_CTA_IMAGE;
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveTyreTestimonials(settings, businessDomain) {
  const config = getTyreConfig(settings, businessDomain);
  if (!config.showTestimonials) return [];
  if (config.testimonials) return config.testimonials;
  if (isDemoStoreDomain(businessDomain)) return TYRE_DEMO_TESTIMONIALS;
  return [];
}

/**
 * @param {object} [settings]
 * @param {object[]} [products]
 * @param {object[]} [categories]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveTyreQuickSearchTerms(settings, products = [], categories = [], businessDomain) {
  const config = getTyreConfig(settings, businessDomain);
  if (config.quickSearchTerms) return config.quickSearchTerms.slice(0, 8);
  const fromCatalog = buildQuickSearchTerms(products, categories, { max: 6 });
  if (fromCatalog.length) return fromCatalog;
  return isDemoStoreDomain(businessDomain) ? TYRE_DEMO_QUICK_SEARCH_TERMS : [];
}

function sanitizeTyreBrandStory(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const image = typeof raw.image === 'string' ? raw.image.trim() : '';
  if (!title && !image) return null;
  const hrefRaw = typeof raw.href === 'string' ? raw.href.trim() : '';
  return {
    id: String(raw.id || `brand-${index}`),
    eyebrow: typeof raw.eyebrow === 'string' ? raw.eyebrow.trim() : '',
    title: title || 'Explore our range',
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle.trim() : '',
    image,
    imageFit: raw.imageFit === 'cover' ? 'cover' : 'contain',
    ctaLabel: typeof raw.ctaLabel === 'string' && raw.ctaLabel.trim() ? raw.ctaLabel.trim() : 'Shop now',
    href:
      hrefRaw.startsWith('?') || hrefRaw.startsWith('/')
        ? hrefRaw
        : hrefRaw
          ? `?search=${encodeURIComponent(hrefRaw)}`
          : '',
  };
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ categories?: object[]; products?: object[]; businessDomain?: string; businessCategory?: string }} [ctx]
 */
export function resolveTyreExploreSegments(settings, storeBase, ctx = {}) {
  const config = getTyreConfig(settings, ctx.businessDomain);
  if (!config.showExploreSection) return [];
  const productsUrl = `${storeBase}/products`;
  const tiles = resolveTyreVehicleTiles(settings, storeBase, ctx);
  const tileBySlug = new Map(tiles.map((t) => [String(t.slug || '').toLowerCase(), t]));
  const source = config.exploreSegments || TYRE_EXPLORE_SEGMENTS;

  return source.map((seg) => {
    const slug = String(seg.slug || '').toLowerCase();
    const tile = tileBySlug.get(slug);
    return {
      ...seg,
      tabLabel: seg.tabLabel || tile?.label || seg.label || 'Tyres',
      href: tile?.href || `${productsUrl}?category=${encodeURIComponent(seg.slug || slug)}`,
      backdropImage: tile?.image || '',
    };
  });
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveTyreExplorePresentation(settings, businessDomain) {
  const config = getTyreConfig(settings, businessDomain);
  return {
    title: config.exploreTitle || 'Explore our tyres',
    subtitle:
      config.exploreSubtitle || 'Choose a vehicle type to discover tyres suited for it from our live catalogue.',
    backgroundImage: config.exploreBackgroundImage || TYRE_HERO_IMAGES.rubber || TYRE_EXPLORE_BACKGROUND,
  };
}

/**
 * Retail tyres for the explore carousel (never services/alloys-only unless category matches).
 * Soft-matches archive/seed category labels so tabs are not intermittently empty.
 * @param {object[]} [products]
 * @param {string} [slug]
 */
export function filterTyreExploreProducts(products = [], slug = '') {
  const retail = (products || []).filter((p) => !isServiceProduct(p) && !isAlloyProduct(p));
  if (!retail.length) return [];
  if (!slug) return retail.slice(0, 12);

  const tokens = TYRE_EXPLORE_SLUG_MATCHERS[String(slug).toLowerCase()] || [
    String(slug).toLowerCase(),
    String(slug).toLowerCase().replace(/-/g, ' '),
  ];

  const matched = retail.filter((p) => {
    const hay = [
      p.category_slug,
      p.category_name,
      p.category,
      p.name,
      p.brand,
      typeof p.domain_data === 'object' ? p.domain_data?.vehicle_type : '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const slugNorm = String(p.category_slug || '')
      .toLowerCase()
      .replace(/_/g, '-');
    const nameSlug = String(p.category_name || p.category || '')
      .toLowerCase()
      .replace(/[\/&]+/g, ' ')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    return tokens.some((token) => {
      const t = String(token).toLowerCase();
      if (!t) return false;
      if (slugNorm === t || nameSlug === t) return true;
      if (slugNorm.includes(t) || t.includes(slugNorm)) return true;
      if (hay.includes(t)) return true;
      const spaced = t.replace(/-/g, ' ');
      return spaced !== t && hay.includes(spaced);
    });
  });

  // Prefer true matches; never blank the rail when the homepage catalog has retail stock.
  return (matched.length ? matched : retail).slice(0, 12);
}

/**
 * First explore segment that currently has matching retail stock.
 * @param {object[]} segments
 * @param {object[]} products
 */
export function pickTyreExploreSegmentWithStock(segments = [], products = []) {
  const retail = (products || []).filter((p) => !isServiceProduct(p) && !isAlloyProduct(p));
  if (!segments.length) return null;
  if (!retail.length) return segments[0];
  for (const seg of segments) {
    const tokens = TYRE_EXPLORE_SLUG_MATCHERS[String(seg.slug || '').toLowerCase()] || [
      String(seg.slug || '').toLowerCase(),
    ];
    const has = retail.some((p) => {
      const hay = [p.category_slug, p.category_name, p.category, p.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return tokens.some((t) => {
        const tok = String(t).toLowerCase();
        return Boolean(tok) && (hay.includes(tok) || hay.includes(tok.replace(/-/g, ' ')));
      });
    });
    if (has) return seg;
  }
  return segments[0];
}

export function resolveTyreOemPartners(settings, businessDomain) {
  const config = getTyreConfig(settings, businessDomain);
  if (!config.showOemPartners) return [];
  return TYRE_OEM_PARTNERS;
}

export function resolveTyreCareTips(settings, businessDomain) {
  const config = getTyreConfig(settings, businessDomain);
  if (!config.showCareTips) return [];
  return TYRE_CARE_TIPS;
}

export function resolveTyreEditorialBanners(settings = {}, products = [], businessDomain, businessCategory) {
  const config = getTyreConfig(settings, businessDomain);
  if (config.editorialBanners) return config.editorialBanners;
  if (isDemoStoreDomain(businessDomain)) return TYRE_DEMO_EDITORIAL_BANNERS;
  const pool = (products || [])
    .filter((p) => !isServiceProduct(p) && isUsableImage(getEffectiveProductImageUrl(p, businessCategory || 'tyre-shop')))
    .slice(0, 3);
  return pool.map((p, i) => ({
    id: String(p.id || i),
    eyebrow: p.category_name || p.category || '',
    title: p.name,
    subtitle: p.description?.slice(0, 100) || '',
    image: getEffectiveProductImageUrl(p, businessCategory || 'tyre-shop'),
    href: `?search=${encodeURIComponent(String(p.name || '').split(/\s+/)[0] || '')}`,
  }));
}

export function resolveTyreLifestyleSpotlight(settings, products, businessDomain, businessCategory) {
  const config = getTyreConfig(settings, businessDomain);
  if (!config.showLifestyleSpotlight) return null;
  return resolveTyreEditorialBanners(settings, products, businessDomain, businessCategory)[0] || null;
}

export function resolveTyrePromoMosaic(settings, products, businessDomain, businessCategory) {
  const config = getTyreConfig(settings, businessDomain);
  if (!config.showPromoMosaic) return [];
  return resolveTyrePromoBanners(settings, products, businessDomain, businessCategory).slice(
    0,
    TYRE_PROMO_MOSAIC_MAX
  );
}

export function resolveTyrePromoBanners(settings = {}, products = [], businessDomain, businessCategory) {
  const config = getTyreConfig(settings, businessDomain);
  return buildPromoBannersFromCatalog(
    products,
    config.promoBanners,
    TYRE_DEMO_PROMO_BANNERS,
    { isDemo: isDemoStoreDomain(businessDomain), businessCategory: businessCategory || 'tyre-shop' }
  ).map((b, i) => ({ ...b, tone: b.tone || 'light' }));
}

export function resolveTyreBrandStories(
  settings = {},
  products = [],
  businessDomain,
  businessCategory,
  ctx = {}
) {
  const config = getTyreConfig(settings, businessDomain);
  if (config.showBrandStories === false) return [];

  if (config.brandStories) {
    return config.brandStories
      .map((row, i) => sanitizeTyreBrandStory(row, i))
      .filter(Boolean)
      .slice(0, TYRE_BRAND_STORIES_MAX);
  }

  if (isDemoStoreDomain(businessDomain)) {
    return TYRE_DEMO_BRAND_STORIES.slice(0, TYRE_BRAND_STORIES_MAX);
  }

  const storeName = formatTyreStoreName(ctx.storeName);
  const editorial = resolveTyreEditorialBanners(settings, products, businessDomain, businessCategory);
  const fromEditorial = editorial
    .slice(1, 1 + TYRE_BRAND_STORIES_MAX)
    .map((b, i) =>
      sanitizeTyreBrandStory(
        {
          id: b.id || `editorial-${i}`,
          eyebrow: b.eyebrow,
          title: b.title,
          subtitle: b.subtitle,
          image: b.image,
          href: b.href,
          ctaLabel: 'Shop range',
        },
        i
      )
    )
    .filter(Boolean);

  if (fromEditorial.length) return fromEditorial;

  return (products || [])
    .filter((p) => !isServiceProduct(p) && isUsableImage(getEffectiveProductImageUrl(p, businessCategory || 'tyre-shop')))
    .slice(0, TYRE_BRAND_STORIES_MAX)
    .map((p, i) =>
      sanitizeTyreBrandStory(
        {
          id: String(p.id || i),
          eyebrow: storeName,
          title: p.name,
          subtitle: (p.description && String(p.description).slice(0, 120)) || 'A standout tyre from our catalogue.',
          image: getEffectiveProductImageUrl(p, businessCategory || 'tyre-shop'),
          href: `?search=${encodeURIComponent(String(p.name || '').split(/\s+/)[0] || '')}`,
          ctaLabel: 'View tyre',
        },
        i
      )
    )
    .filter(Boolean);
}

const TYRE_SEED_BY_SKU = new Map(
  TYRE_SEED_PRODUCTS.map((s) => [String(s.sku || '').toUpperCase(), s])
);
const TYRE_SEED_BY_NAME = new Map(
  TYRE_SEED_PRODUCTS.map((s) => [String(s.name || '').trim().toLowerCase(), s])
);

function resolveTyreSeedMatch(product) {
  const sku = String(product?.sku || '').toUpperCase();
  if (sku && TYRE_SEED_BY_SKU.has(sku)) return TYRE_SEED_BY_SKU.get(sku);
  const name = String(product?.name || '').trim().toLowerCase();
  if (name && TYRE_SEED_BY_NAME.has(name)) return TYRE_SEED_BY_NAME.get(name);
  return null;
}

function shouldEnrichTyreProductImage(product) {
  const raw = String(product?.image_url || product?.image || '').trim();
  if (!raw) return true;
  if (isDeadImageUrl(raw)) return true;
  if (raw.includes('images.unsplash.com')) return true;
  if (raw.includes('ui-avatars.com')) return true;
  return !isUsableImage(raw);
}

/**
 * Enrich live DB rows with archive/seed photos when tenant image is missing.
 * Merchant uploads always win — never replace Supabase or valid HTTPS product photos.
 * @param {object[]} products
 * @param {string | null | undefined} [businessDomain]
 */
export function enrichTyreProductsWithSeedImages(products = [], businessDomain) {
  return (products || []).map((product) => {
    if (!shouldEnrichTyreProductImage(product)) return product;
    const seed = resolveTyreSeedMatch(product);
    if (!seed?.image_url) return product;
    return {
      ...product,
      image_url: seed.image_url,
      image: seed.image_url,
      brand: product.brand || seed.brand,
      category_name: product.category_name || product.category || seed.category,
    };
  });
}

/**
 * DB-first tyre showcase: UUID inventory only, optional seed image enrich.
 * @param {object[]} products
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveTyreShowcaseProducts(products = [], businessDomain) {
  const list = Array.isArray(products) ? products.filter(Boolean) : [];
  const dbOnly = list.filter((p) => isStorefrontProductUuid(p?.id) && !p.catalog_preview);
  return enrichTyreProductsWithSeedImages(dbOnly, businessDomain);
}

/**
 * Registration / demo storefront defaults.
 * @param {string} [canonical]
 */
export function buildDefaultTyreStorefrontSeed(canonical = 'tyre-shop') {
  if (!isTyreElevatedStore(canonical)) return {};
  return {
    tyre: {
      showTrustStrip: true,
      showExploreSection: true,
      showVehicleTiles: true,
      showBrandWall: true,
      showAlloyRail: true,
      showServices: true,
      showBayCta: true,
      showLifestyleSpotlight: true,
      showBrandStories: true,
      showOemPartners: true,
      showSafetyBand: true,
      showCareTips: true,
      showPromoMosaic: false,
      showTestimonials: true,
      searchPlaceholder: 'Search size, brand, or model…',
      bayLabel: 'Book fitting bay',
    },
  };
}
