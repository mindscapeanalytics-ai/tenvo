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
} from '@/lib/storefront/elevatedStorefrontTenant';
import {
  getEffectiveProductImageUrl,
  getFallbackProductImageUrl,
} from '@/lib/storefront/productImageFallback';
import { isDeadImageUrl } from '@/lib/storefront/deadImageHosts';
import {
  TYRE_HERO_IMAGES,
  TYRE_BRAND_LOGOS,
  TYRE_GTR_PRODUCT_IMAGES,
  TYRE_BAY_SERVICE_IMAGES,
} from '@/lib/dataLab/tyreArchiveAssets';

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
  return {
    locationLabel: raw.locationLabel || 'Deliver to',
    defaultLocation: raw.defaultLocation || '',
    searchPlaceholder: raw.searchPlaceholder || 'Search size, brand, or model…',
    bayLabel: raw.bayLabel || 'Book fitting bay',
    showTrustStrip: raw.showTrustStrip !== false,
    showVehicleTiles: raw.showVehicleTiles !== false,
    showBrandWall: raw.showBrandWall !== false,
    showAlloyRail: raw.showAlloyRail !== false,
    showServices: raw.showServices !== false,
    showBayCta: raw.showBayCta !== false,
    showTestimonials: raw.showTestimonials === true || (raw.showTestimonials === undefined && isDemo),
    showMarketingBanners: raw.showMarketingBanners !== false,
    featuredRailTitle: raw.featuredRailTitle || '',
    featuredRailSubtitle: raw.featuredRailSubtitle || '',
    heroVideoUrl: normalizeTyreVideoUrl(raw.heroVideoUrl) || '',
    bayCtaTitle: typeof raw.bayCtaTitle === 'string' ? raw.bayCtaTitle.trim() : '',
    bayCtaSubtitle: typeof raw.bayCtaSubtitle === 'string' ? raw.bayCtaSubtitle.trim() : '',
    heroSlides: Array.isArray(raw.heroSlides) && raw.heroSlides.length ? raw.heroSlides : null,
    vehicleTiles: Array.isArray(raw.vehicleTiles) && raw.vehicleTiles.length ? raw.vehicleTiles : null,
    brands: Array.isArray(raw.brands) && raw.brands.length ? raw.brands : null,
    trustPillars: Array.isArray(raw.trustPillars) && raw.trustPillars.length ? raw.trustPillars : null,
    services: Array.isArray(raw.services) && raw.services.length ? raw.services : null,
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
  const inStock = (products || []).filter((p) => p.stock == null || Number(p.stock) > 0);
  const pool = inStock.length ? inStock : products || [];
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

/**
 * Enrich live DB rows with seed images by SKU / name (never inject seed ids into cart).
 * @param {object[]} products
 * @param {object[]} [seedProducts]
 */
export function resolveTyreShowcaseProducts(products = [], seedProducts = []) {
  if (!Array.isArray(products) || !products.length) return products || [];
  const bySku = new Map(
    (seedProducts || []).map((s) => [String(s.sku || '').toUpperCase(), s])
  );
  return products.map((p) => {
    const sku = String(p.sku || '').toUpperCase();
    const seed = bySku.get(sku);
    if (!seed?.image_url) return p;
    if (isUsableImage(p.image_url) || isUsableImage(p.image)) return p;
    return { ...p, image_url: seed.image_url, image: seed.image_url };
  });
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
      showVehicleTiles: true,
      showBrandWall: true,
      showAlloyRail: true,
      showServices: true,
      showBayCta: true,
      showTestimonials: true,
      searchPlaceholder: 'Search size, brand, or model…',
      bayLabel: 'Book fitting bay',
    },
  };
}
