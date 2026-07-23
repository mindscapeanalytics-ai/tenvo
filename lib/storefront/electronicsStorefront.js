/**
 * Elevated electronics / home appliances storefront — tenant-aware with Tenvo Electronics demo defaults.
 * Isolated to canonical `electronics-goods` vertical.
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
import { isStorefrontProductUuid } from '@/lib/utils/storefrontProductRef';
import {
  ELECTRONICS_DEMO_HERO_SLIDES,
  ELECTRONICS_SEED_PRODUCTS,
  ELECTRONICS_MARKETING_HERO_IMAGE,
} from '@/lib/dataLab/electronicsDemoCatalog';

export const ELECTRONICS_ELEVATED_CANONICALS = new Set(['electronics-goods']);

export const ELECTRONICS_GRAPHITE = '#0a0a0a';
export const ELECTRONICS_GRAPHITE_DARK = '#050505';
export const ELECTRONICS_BLUE = '#2563eb';
export const ELECTRONICS_BLUE_DARK = '#1d4ed8';
export const ELECTRONICS_SURFACE = '#f8fafc';

export const ELECTRONICS_ACCENTS = {
  accent: ELECTRONICS_BLUE,
  accentDark: ELECTRONICS_BLUE_DARK,
  accentLight: '#eff6ff',
};

export { ELECTRONICS_MARKETING_HERO_IMAGE };

/**
 * @param {string | null | undefined} category
 */
export function isElectronicsElevatedStore(category) {
  return ELECTRONICS_ELEVATED_CANONICALS.has(resolveDomainKey(category));
}

/**
 * @param {string | null | undefined} name
 */
export function formatElectronicsStoreName(name) {
  return formatElevatedStoreName(name, 'Our electronics store');
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function getElectronicsConfig(settings = {}, businessDomain) {
  const raw = settings?.storefront?.electronics || {};
  const isDemo = isDemoStoreDomain(businessDomain);
  return {
    locationLabel: raw.locationLabel || 'Deliver to',
    defaultLocation: raw.defaultLocation || (isDemo ? 'Karachi' : ''),
    searchPlaceholder: raw.searchPlaceholder || 'Search appliances, brands, gadgets…',
    installmentLabel: raw.installmentLabel || 'Installment enquiry',
    showTrustStrip: raw.showTrustStrip !== false,
    showCategoryTiles: raw.showCategoryTiles !== false,
    showBrandWall: raw.showBrandWall !== false,
    showFeaturedRail: raw.showFeaturedRail !== false,
    showDealsRail: raw.showDealsRail !== false,
    showGadgetsRail: raw.showGadgetsRail !== false,
    showAppliancesRail: raw.showAppliancesRail !== false,
    showInstallmentCta: raw.showInstallmentCta !== false,
    showVisitCta: raw.showVisitCta !== false,
    showFeedSidebar: raw.showFeedSidebar !== false,
    featuredRailTitle: raw.featuredRailTitle || '',
    featuredRailSubtitle: raw.featuredRailSubtitle || '',
    dealsRailTitle: raw.dealsRailTitle || '',
    gadgetsRailTitle: raw.gadgetsRailTitle || '',
    appliancesRailTitle: raw.appliancesRailTitle || '',
    installmentTitle: raw.installmentTitle || '',
    installmentSubtitle: raw.installmentSubtitle || '',
    visitTitle: raw.visitTitle || '',
    visitSubtitle: raw.visitSubtitle || '',
    heroSlides: Array.isArray(raw.heroSlides) && raw.heroSlides.length ? raw.heroSlides : null,
    categoryTiles: Array.isArray(raw.categoryTiles) && raw.categoryTiles.length ? raw.categoryTiles : null,
    brandWall: Array.isArray(raw.brandWall) && raw.brandWall.length ? raw.brandWall : null,
    trustPillars: Array.isArray(raw.trustPillars) && raw.trustPillars.length ? raw.trustPillars : null,
    quickSearchTerms: Array.isArray(raw.quickSearchTerms) && raw.quickSearchTerms.length ? raw.quickSearchTerms : null,
    sidebarDepartments:
      Array.isArray(raw.sidebarDepartments) && raw.sidebarDepartments.length ? raw.sidebarDepartments : null,
  };
}

export const ELECTRONICS_DEMO_QUICK_SEARCH_TERMS = [
  'Air Conditioner',
  'LED TV',
  'YOLO',
  'PEL',
  'Smart Watch',
];

/** Supermarket-style department sidebar for homepage + shop chrome. */
export const ELECTRONICS_SIDEBAR_DEPARTMENTS = [
  { id: 'deals', label: 'Deals & offers', hrefSuffix: '?onSale=true' },
  { id: 'ac', label: 'Air Conditioners', slug: 'air-conditioners' },
  { id: 'fridge', label: 'Refrigerators', slug: 'refrigerators' },
  { id: 'tv', label: 'LED TVs', slug: 'led-tvs' },
  { id: 'wash', label: 'Washing Machines', slug: 'washing-machines' },
  { id: 'freezer', label: 'Deep Freezers', slug: 'deep-freezers' },
  { id: 'kitchen', label: 'Kitchen Appliances', slug: 'kitchen-appliances' },
  { id: 'water', label: 'Water Dispensers', slug: 'water-dispensers' },
  { id: 'fans', label: 'Cooling & Fans', slug: 'cooling-fans' },
  { id: 'gadgets', label: 'Gadgets & Wearables', slug: 'gadgets-wearables' },
  { id: 'small', label: 'Small Appliances', slug: 'small-appliances' },
];

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {object} [ctx]
 */
export function resolveElectronicsSidebarDepartments(settings = {}, storeBase, ctx = {}) {
  const config = getElectronicsConfig(settings, ctx.businessDomain);
  const productsUrl = `${storeBase}/products`;
  const fromOwner = Array.isArray(config.sidebarDepartments) ? config.sidebarDepartments : null;
  const rows = fromOwner?.length ? fromOwner : ELECTRONICS_SIDEBAR_DEPARTMENTS;
  return rows.map((dept) => ({
    ...dept,
    href:
      dept.href ||
      (dept.hrefSuffix
        ? `${productsUrl}${dept.hrefSuffix}`
        : dept.slug
          ? `${productsUrl}?category=${encodeURIComponent(dept.slug)}`
          : productsUrl),
  }));
}

/**
 * @param {string} base
 * @param {object} [settings]
 * @param {object} [ctx]
 */
export function getElectronicsHeroSlides(base, settings = {}, ctx = {}) {
  const config = getElectronicsConfig(settings, ctx.businessDomain);
  const storeName = ctx.storeName || formatElectronicsStoreName('');
  const featured = (ctx.products || []).filter((p) => p.is_featured && p.image_url);

  return buildTenantHeroSlides({
    settings,
    settingsSlides: config.heroSlides,
    base,
    storeName,
    businessDescription: ctx.businessDescription,
    coverImage: ctx.coverImage,
    demoSlides: ELECTRONICS_DEMO_HERO_SLIDES,
    isDemo: isDemoStoreDomain(ctx.businessDomain),
    featuredProducts: featured.length
      ? featured
      : (ctx.products || []).filter((p) => p.image_url).slice(0, 4),
  });
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveElectronicsQuickSearchTerms(settings, businessDomain) {
  const config = getElectronicsConfig(settings, businessDomain);
  if (config.quickSearchTerms?.length) return config.quickSearchTerms;
  return isDemoStoreDomain(businessDomain) ? ELECTRONICS_DEMO_QUICK_SEARCH_TERMS : [];
}

export const ELECTRONICS_DEMO_TRUST_PILLARS = [
  { id: 'warranty', title: 'Official warranty', subtitle: 'Brand-backed coverage on appliances and gadgets', icon: 'shield' },
  { id: 'genuine', title: 'Genuine products', subtitle: 'Authorized brands and sealed stock', icon: 'star' },
  { id: 'delivery', title: 'Insured delivery', subtitle: 'Safe shipping across Karachi', icon: 'truck' },
  { id: 'installment', title: 'Installment enquiry', subtitle: 'Ask our team about easy plans', icon: 'refresh' },
];

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveElectronicsTrustPillars(settings, businessDomain) {
  const config = getElectronicsConfig(settings, businessDomain);
  if (config.trustPillars?.length) return config.trustPillars;
  return ELECTRONICS_DEMO_TRUST_PILLARS;
}

export const ELECTRONICS_DEMO_CATEGORY_TILES = [
  { id: 'ac', label: 'Air Conditioners', slug: 'air-conditioners', description: 'Inverter hot & cold' },
  { id: 'fridge', label: 'Refrigerators', slug: 'refrigerators', description: 'Home & kitchen cooling' },
  { id: 'tv', label: 'LED TVs', slug: 'led-tvs', description: 'Smart entertainment' },
  { id: 'wash', label: 'Washing Machines', slug: 'washing-machines', description: 'Auto & semi-auto' },
  { id: 'kitchen', label: 'Kitchen Appliances', slug: 'kitchen-appliances', description: 'Everyday essentials' },
  { id: 'gadgets', label: 'Gadgets & Wearables', slug: 'gadgets-wearables', description: 'Watches & speakers' },
];

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {object} [ctx]
 */
export function resolveElectronicsCategoryTiles(settings, storeBase, ctx = {}) {
  const config = getElectronicsConfig(settings, ctx.businessDomain);
  const productsUrl = `${storeBase}/products`;
  const mapHref = (item) => ({
    ...item,
    href:
      item.href ||
      `${productsUrl}${item.slug ? `?category=${encodeURIComponent(item.slug)}` : ''}`,
  });

  const fromOwner = config.categoryTiles?.map(mapHref);
  if (fromOwner?.length) {
    return enrichCategoryNavImages(fromOwner, ctx.products, ctx.businessCategory || 'electronics-goods');
  }

  const fromDb = buildCategoryNavItems(ctx.categories || [], storeBase, {
    max: 8,
    includeDeals: false,
  }).map((item) => ({
    id: item.id,
    label: item.label,
    slug: item.slug || '',
    href: item.href,
    description: '',
  }));

  const tiles =
    fromDb.length >= 4
      ? fromDb
      : ELECTRONICS_DEMO_CATEGORY_TILES.map(mapHref);

  return enrichCategoryNavImages(tiles, ctx.products, ctx.businessCategory || 'electronics-goods');
}

export const ELECTRONICS_DEMO_BRANDS = [
  'PEL',
  'YOLO',
  'Samsung',
  'LG',
  'Haier',
  'Dawlance',
  'Orient',
  'TCL',
  'Gree',
  'Kenwood',
];

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {object} [ctx]
 */
export function resolveElectronicsBrandWall(settings, storeBase, ctx = {}) {
  const config = getElectronicsConfig(settings, ctx.businessDomain);
  const productsUrl = `${storeBase}/products`;
  if (config.brandWall?.length) {
    return config.brandWall.map((b) => ({
      ...b,
      href: b.href || `${productsUrl}?search=${encodeURIComponent(b.label || b.name || '')}`,
    }));
  }

  const fromProducts = [
    ...new Set(
      (ctx.products || [])
        .map((p) => String(p.brand || p.domain_data?.brand || '').trim())
        .filter(Boolean)
    ),
  ].slice(0, 12);

  const brands = fromProducts.length
    ? fromProducts
    : isDemoStoreDomain(ctx.businessDomain)
      ? ELECTRONICS_DEMO_BRANDS
      : [];

  return brands.map((label) => ({
    id: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    href: `${productsUrl}?search=${encodeURIComponent(label)}`,
  }));
}

function productComparePrice(p) {
  return p.compare_price ?? p.comparePrice ?? null;
}

/**
 * @param {Array} [products]
 */
export function partitionElectronicsProducts(products = []) {
  const inStock = (products || []).filter((p) => p.stock == null || Number(p.stock) > 0);
  const pool = inStock.length ? inStock : products;
  const onSale = pool.filter((p) => {
    const compare = productComparePrice(p);
    return compare && Number(compare) > Number(p.price);
  });
  const featured = pool.filter((p) => p.is_featured);
  const gadgets = pool.filter((p) => /gadget|wearable|watch|speaker|audio/i.test(String(p.category || '')));
  const appliances = pool.filter((p) =>
    /air.?cond|refrigerat|led.?tv|washing|freezer|kitchen|dispenser|cooler|fan|appliance/i.test(
      String(p.category || '')
    )
  );

  return {
    topPicks: featured.length ? featured : pool.slice(0, 12),
    deals: onSale.length ? onSale : pool.filter((p) => productComparePrice(p)).slice(0, 12),
    gadgets: gadgets.length ? gadgets : pool.filter((p) => /yolo/i.test(String(p.brand || p.name))).slice(0, 12),
    appliances: appliances.length ? appliances : pool.filter((p) => /pel|haier|dawlance|orient/i.test(String(p.brand || ''))).slice(0, 12),
    newArrivals: pool.slice(0, 12),
  };
}

export function filterElectronicsByCategorySlug(products = [], slug) {
  return filterProductsByCategorySlug(products, slug);
}

/**
 * Seed image enrich for DB rows (never inject catalog_preview into orderable UI).
 * @param {Array} products
 */
export function enrichElectronicsProductsWithSeedImages(products = []) {
  if (!Array.isArray(products) || !products.length) return products;
  const bySku = new Map(
    ELECTRONICS_SEED_PRODUCTS.map((p) => [String(p.sku || '').toLowerCase(), p])
  );
  const byName = new Map(
    ELECTRONICS_SEED_PRODUCTS.map((p) => [String(p.name || '').toLowerCase(), p])
  );

  return products.map((product) => {
    const sku = String(product.sku || '').toLowerCase();
    const name = String(product.name || '').toLowerCase();
    const seed = bySku.get(sku) || byName.get(name);
    if (!seed?.image_url) return product;
    const current = getEffectiveProductImageUrl(product);
    if (current && !isDeadImageUrl(current)) return product;
    return {
      ...product,
      image_url: seed.image_url,
      images: product.images?.length ? product.images : [seed.image_url],
    };
  });
}

/**
 * UUID-only showcase for homepage rails.
 * @param {Array} products
 * @param {string | null | undefined} businessDomain
 */
export function resolveElectronicsShowcaseProducts(products = [], businessDomain) {
  const uuidOnly = (products || []).filter((p) => isStorefrontProductUuid(p.id));
  const pool = uuidOnly.length ? uuidOnly : [];
  return enrichElectronicsProductsWithSeedImages(pool);
}

/**
 * @param {string} [canonical]
 */
export function buildDefaultElectronicsStorefrontSeed(canonical = 'electronics-goods') {
  if (!isElectronicsElevatedStore(canonical)) return {};
  return {
    electronics: {
      showTrustStrip: true,
      showCategoryTiles: true,
      showBrandWall: true,
      showFeaturedRail: true,
      showDealsRail: true,
      showGadgetsRail: true,
      showAppliancesRail: true,
      showInstallmentCta: true,
      showVisitCta: true,
      showFeedSidebar: true,
      searchPlaceholder: 'Search appliances, brands, gadgets…',
      installmentLabel: 'Installment enquiry',
      featuredRailTitle: 'Top picks',
      featuredRailSubtitle: 'Featured appliances and gadgets',
      dealsRailTitle: 'Deals & offers',
      gadgetsRailTitle: 'Gadgets & wearables',
      appliancesRailTitle: 'Home appliances',
      installmentTitle: 'Ask about installment plans',
      installmentSubtitle: 'Send an enquiry and our team will guide you. No online loan approval.',
      visitTitle: 'Visit our showroom',
      visitSubtitle: 'See appliances in person and talk to our team about warranty and delivery.',
      defaultLocation: 'Karachi',
    },
  };
}

/**
 * Fallback image for category tiles when product photos missing.
 * @param {object} item
 * @param {string} [businessCategory]
 */
export function resolveElectronicsCategoryFallbackImage(item, businessCategory = 'electronics-goods') {
  return getFallbackProductImageUrl(
    { name: item?.label || item?.id || 'electronics', id: item?.id || 'electronics' },
    businessCategory
  );
}
