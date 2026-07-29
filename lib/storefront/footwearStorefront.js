/**
 * Elevated footwear / shoe retail storefront — tenant-aware with Tenvo Footwear demo defaults.
 * Isolated to canonical `leather-footwear` (aliases: shoes, footwear, sneakers).
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import {
  formatElevatedStoreName,
  buildCategoryNavItems,
  buildQuickSearchTerms,
  buildTenantHeroSlides,
  isDemoStoreDomain,
} from '@/lib/storefront/elevatedStorefrontTenant';
import { isDeadImageUrl } from '@/lib/storefront/deadImageHosts';
import { FOOTWEAR_SEED_PRODUCTS } from '@/lib/dataLab/footwearDemoCatalog';
import {
  FOOTWEAR_HERO_IMAGES,
  FOOTWEAR_CATEGORY_IMAGES,
  FOOTWEAR_CONDITION_IMAGES,
  FOOTWEAR_VISUAL_NAV_IMAGES,
  FOOTWEAR_CAMPAIGN_IMAGES,
  FOOTWEAR_BRAND_TILE_IMAGES,
  FOOTWEAR_SALE_STACK_IMAGES,
  FOOTWEAR_THREE_UP_IMAGES,
  FOOTWEAR_BRAND_YELLOW,
  FOOTWEAR_BRAND_YELLOW_DARK,
  FOOTWEAR_LOCAL_BRANDS,
  FOOTWEAR_IMPORTED_BRANDS,
} from '@/lib/dataLab/footwearArchiveAssets';
import { isStorefrontProductUuid } from '@/lib/utils/storefrontProductRef';

export {
  FOOTWEAR_HERO_IMAGES,
  FOOTWEAR_CATEGORY_IMAGES,
  FOOTWEAR_CONDITION_IMAGES,
  FOOTWEAR_VISUAL_NAV_IMAGES,
  FOOTWEAR_CAMPAIGN_IMAGES,
  FOOTWEAR_BRAND_TILE_IMAGES,
  FOOTWEAR_SALE_STACK_IMAGES,
  FOOTWEAR_THREE_UP_IMAGES,
  FOOTWEAR_BRAND_YELLOW,
  FOOTWEAR_LOCAL_BRANDS,
  FOOTWEAR_IMPORTED_BRANDS,
};

export const FOOTWEAR_ELEVATED_CANONICALS = new Set(['leather-footwear']);

export const FOOTWEAR_INK = '#111111';
export const FOOTWEAR_INK_SOFT = '#1c1c1c';
export const FOOTWEAR_ACCENT = FOOTWEAR_BRAND_YELLOW;
export const FOOTWEAR_ACCENT_DARK = FOOTWEAR_BRAND_YELLOW_DARK;
export const FOOTWEAR_SURFACE = '#ffffff';

export const FOOTWEAR_ACCENTS = {
  accent: FOOTWEAR_ACCENT,
  accentDark: FOOTWEAR_ACCENT_DARK,
  accentLight: '#FFF8CC',
};

/**
 * @param {string | null | undefined} category
 */
export function isFootwearElevatedStore(category) {
  return FOOTWEAR_ELEVATED_CANONICALS.has(resolveDomainKey(category));
}

/**
 * @param {string | null | undefined} name
 */
export function formatFootwearStoreName(name) {
  return formatElevatedStoreName(name, 'Our shoe store');
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function getFootwearConfig(settings = {}, businessDomain) {
  const raw = settings?.storefront?.footwear || {};
  const isDemo = isDemoStoreDomain(businessDomain);

  return {
    searchPlaceholder: raw.searchPlaceholder || 'Search brand, style, or size…',
    sizeGuideLabel: raw.sizeGuideLabel || 'Size guide',
    showSaleHero: raw.showSaleHero !== false,
    showPromoStrip: raw.showPromoStrip !== false,
    showJustForYou: raw.showJustForYou !== false,
    showEnergyBand: raw.showEnergyBand !== false,
    showRotationMosaic: raw.showRotationMosaic !== false,
    showThreeUp: raw.showThreeUp !== false,
    showFeatureSplit: raw.showFeatureSplit !== false,
    showTrendingRail: raw.showTrendingRail !== false,
    showCategoryTiles: raw.showCategoryTiles !== false,
    showBrandGrid: raw.showBrandGrid !== false,
    showRewardsCta: raw.showRewardsCta !== false,
    showTrustStrip: raw.showTrustStrip !== false,
    showSizeFinder: raw.showSizeFinder !== false,
    // Legacy toggles kept for Settings backward-compat (map onto FL modules).
    showVisualNav: raw.showBrandGrid !== false && raw.showVisualNav !== false,
    showCampaignBands: raw.showThreeUp !== false && raw.showCampaignBands !== false,
    showGenderTiles: raw.showCategoryTiles !== false && raw.showGenderTiles !== false,
    showBrandWall: raw.showBrandGrid !== false && raw.showBrandWall !== false,
    showConditionGuide: false,
    showNewArrivals: raw.showJustForYou !== false,
    showDealsRail: raw.showJustForYou !== false,
    showSportsRail: false,
    showLifestyleSpotlight: raw.showEnergyBand !== false,
    showTestimonials: false,
    featuredRailTitle: typeof raw.featuredRailTitle === 'string' ? raw.featuredRailTitle.trim() : '',
    featuredRailSubtitle: typeof raw.featuredRailSubtitle === 'string' ? raw.featuredRailSubtitle.trim() : '',
    trendingRailTitle: typeof raw.trendingRailTitle === 'string' ? raw.trendingRailTitle.trim() : '',
    trendingRailSubtitle: typeof raw.trendingRailSubtitle === 'string' ? raw.trendingRailSubtitle.trim() : '',
    saleHeroTitle: typeof raw.saleHeroTitle === 'string' ? raw.saleHeroTitle.trim() : '',
    saleHeroSubtitle: typeof raw.saleHeroSubtitle === 'string' ? raw.saleHeroSubtitle.trim() : '',
    promoStripText: typeof raw.promoStripText === 'string' ? raw.promoStripText.trim() : '',
    energyTitle: typeof raw.energyTitle === 'string' ? raw.energyTitle.trim() : '',
    energySubtitle: typeof raw.energySubtitle === 'string' ? raw.energySubtitle.trim() : '',
    rotationTitle: typeof raw.rotationTitle === 'string' ? raw.rotationTitle.trim() : '',
    rotationSubtitle: typeof raw.rotationSubtitle === 'string' ? raw.rotationSubtitle.trim() : '',
    featureSplitTitle: typeof raw.featureSplitTitle === 'string' ? raw.featureSplitTitle.trim() : '',
    featureSplitSubtitle: typeof raw.featureSplitSubtitle === 'string' ? raw.featureSplitSubtitle.trim() : '',
    rewardsTitle: typeof raw.rewardsTitle === 'string' ? raw.rewardsTitle.trim() : '',
    rewardsSubtitle: typeof raw.rewardsSubtitle === 'string' ? raw.rewardsSubtitle.trim() : '',
    heroSlides: Array.isArray(raw.heroSlides) && raw.heroSlides.length ? raw.heroSlides : null,
    genderTiles: Array.isArray(raw.genderTiles) && raw.genderTiles.length ? raw.genderTiles : null,
    brands: Array.isArray(raw.brands) && raw.brands.length ? raw.brands : null,
    threeUp: Array.isArray(raw.threeUp) && raw.threeUp.length ? raw.threeUp : null,
    trustPillars: Array.isArray(raw.trustPillars) && raw.trustPillars.length ? raw.trustPillars : null,
    quickSearchTerms:
      Array.isArray(raw.quickSearchTerms) && raw.quickSearchTerms.length ? raw.quickSearchTerms : null,
    finderDefaults: raw.finderDefaults && typeof raw.finderDefaults === 'object' ? raw.finderDefaults : null,
  };
}

export const FOOTWEAR_DEMO_QUICK_SEARCH_TERMS = [
  'Nike',
  'Adidas',
  'Men',
  'Women',
  'Running',
  'Size 42',
];

export const FOOTWEAR_FINDER_GENDERS = [
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'kids', label: 'Kids' },
  { id: 'unisex', label: 'Unisex' },
];

export const FOOTWEAR_FINDER_STYLES = [
  'Casual',
  'Sports',
  'Formal',
  'Boot',
  'Sandal',
  'Orthopedic',
];

export const FOOTWEAR_FINDER_SIZES = [
  '36',
  '37',
  '38',
  '39',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
];

/**
 * Build products URL for size / gender / style finder.
 * @param {string} base
 * @param {{ gender?: string; style?: string; size?: string; brand?: string }} filters
 */
export function buildFootwearFinderHref(base, filters = {}) {
  const products = `${base}/products`;
  const params = new URLSearchParams();
  const gender = String(filters.gender || '').trim();
  const style = String(filters.style || '').trim();
  const size = String(filters.size || '').trim();
  const brand = String(filters.brand || '').trim();
  const search = String(filters.search || '').trim();
  if (brand) params.set('brand', brand);
  if (gender && gender !== 'unisex') params.set('gender', gender);
  if (style) params.set('style', style);
  if (size) params.set('size', size);
  if (search) params.set('search', search);
  const qs = params.toString();
  return qs ? `${products}?${qs}` : products;
}

/**
 * @param {string} base
 */
export function getFootwearNavLinks(base, categories = []) {
  const fromDb = buildCategoryNavItems(categories, base, { max: 7, includeDeals: true });
  if (fromDb.length) {
    return fromDb.map((item) => ({ id: item.id, label: item.label, href: item.href }));
  }
  const products = `${base}/products`;
  return [
    { id: 'men', label: 'Men', href: `${products}?gender=men` },
    { id: 'women', label: 'Women', href: `${products}?gender=women` },
    { id: 'kids', label: 'Kids', href: `${products}?gender=kids` },
    { id: 'sports', label: 'Sports', href: `${products}?style=Sports` },
    { id: 'sale', label: 'Sale', href: `${products}?onSale=true` },
  ];
}

export const FOOTWEAR_DEMO_GENDER_TILES = [
  {
    id: 'men',
    label: "Men's",
    slug: 'mens-shoes',
    desc: '',
    image: FOOTWEAR_CATEGORY_IMAGES.men,
    hrefSuffix: '?gender=men',
  },
  {
    id: 'women',
    label: "Women's",
    slug: 'womens-shoes',
    desc: '',
    image: FOOTWEAR_CATEGORY_IMAGES.women,
    hrefSuffix: '?gender=women',
  },
  {
    id: 'kids',
    label: "Kids'",
    slug: 'kids-shoes',
    desc: '',
    image: FOOTWEAR_CATEGORY_IMAGES.kids,
    hrefSuffix: '?gender=kids',
  },
  {
    id: 'accessories',
    label: 'Clothing & Accessories',
    slug: 'accessories',
    desc: '',
    image: FOOTWEAR_CATEGORY_IMAGES.accessories,
    hrefSuffix: '?search=Accessories',
  },
];

export const FOOTWEAR_DEMO_BRANDS = [
  { id: 'nike', label: 'Nike', sourcing: 'imported', hrefSuffix: '?brand=Nike', image: FOOTWEAR_BRAND_TILE_IMAGES.nike },
  { id: 'jordan', label: 'Jordan', sourcing: 'imported', hrefSuffix: '?brand=Jordan', image: FOOTWEAR_BRAND_TILE_IMAGES.jordan },
  { id: 'new-balance', label: 'New Balance', sourcing: 'imported', hrefSuffix: '?brand=New%20Balance', image: FOOTWEAR_BRAND_TILE_IMAGES.newBalance },
  { id: 'adidas', label: 'Adidas', sourcing: 'imported', hrefSuffix: '?brand=Adidas', image: FOOTWEAR_BRAND_TILE_IMAGES.adidas },
  { id: 'asics', label: 'ASICS', sourcing: 'imported', hrefSuffix: '?brand=Asics', image: FOOTWEAR_BRAND_TILE_IMAGES.asics },
  { id: 'on', label: 'On', sourcing: 'imported', hrefSuffix: '?brand=On', image: FOOTWEAR_BRAND_TILE_IMAGES.on },
  { id: 'timberland', label: 'Timberland', sourcing: 'imported', hrefSuffix: '?search=Timberland', image: FOOTWEAR_BRAND_TILE_IMAGES.timberland },
  { id: 'ugg', label: 'UGG', sourcing: 'imported', hrefSuffix: '?search=UGG', image: FOOTWEAR_BRAND_TILE_IMAGES.ugg },
];

export const FOOTWEAR_DEMO_THREE_UP = [
  {
    id: 'apparel',
    title: 'First Day Fresh',
    subtitle: 'Dial in apparel & accessories',
    ctaLabel: 'Shop apparel',
    hrefSuffix: '?search=Accessories',
    image: FOOTWEAR_THREE_UP_IMAGES.apparel,
  },
  {
    id: 'running',
    title: 'Best Foot Forward',
    subtitle: 'Running-inspired everyday sneakers',
    ctaLabel: 'Shop running',
    hrefSuffix: '?style=Sports',
    image: FOOTWEAR_THREE_UP_IMAGES.running,
  },
  {
    id: 'trends',
    title: 'Back to School Trends',
    subtitle: 'Stand-out styles for the first day',
    ctaLabel: 'Shop trends',
    hrefSuffix: '?sort=newest',
    image: FOOTWEAR_THREE_UP_IMAGES.trends,
  },
];

export const FOOTWEAR_DEFAULT_TRUST_PILLARS = [
  { id: 'authentic', label: 'Fast shipping', desc: 'Quick dispatch on in-stock pairs' },
  { id: 'condition', label: 'Free exchanges', desc: 'Easy size swaps on unused pairs' },
  { id: 'size', label: 'Size-first search', desc: 'Find your UK / EU size fast' },
  { id: 'returns', label: 'Authentic brands', desc: 'Local + imported, graded clearly' },
];

/** @deprecated Zappos-era campaign bands — unused in Foot Locker layout. */
export const FOOTWEAR_DEMO_VISUAL_NAV = FOOTWEAR_DEMO_BRANDS.slice(0, 6).map((b) => ({
  id: b.id,
  label: b.label,
  hrefSuffix: b.hrefSuffix,
  image: b.image,
}));

export const FOOTWEAR_DEMO_CAMPAIGN_BANDS = [];

export const FOOTWEAR_DEMO_CONDITION_TILES = [];

export const FOOTWEAR_DEMO_TESTIMONIALS = [];

const FOOTWEAR_DEMO_HERO_SLIDES = [
  {
    eyebrow: '{storeName}',
    title: 'Huge savings. Up to 40% off.',
    subtitle: 'Nike, Adidas, New Balance and more — shop the sale with size-first filters.',
    image: FOOTWEAR_HERO_IMAGES.sale,
    ctaLabel: 'Shop the sale',
    ctaHref: '/products?onSale=true',
  },
  {
    eyebrow: 'Just in',
    title: 'Refresh the rotation',
    subtitle: 'Court classics and everyday sneakers ready for first day energy.',
    image: FOOTWEAR_HERO_IMAGES.lifestyle1,
    ctaLabel: 'Shop new',
    ctaHref: '/products?sort=newest',
  },
  {
    eyebrow: 'Featured drop',
    title: 'New Balance almost here',
    subtitle: 'Exclusive colorways and performance pairs on the floor.',
    image: FOOTWEAR_HERO_IMAGES.lifestyle2,
    ctaLabel: 'Shop New Balance',
    ctaHref: '/products?brand=New%20Balance',
  },
];

/** Marketing / homepage gallery hero */
export const FOOTWEAR_MARKETING_HERO_IMAGE =
  FOOTWEAR_DEMO_HERO_SLIDES[0]?.image || FOOTWEAR_HERO_IMAGES.hero1;

/**
 * @param {string} base
 * @param {object} [settings]
 * @param {{ storeName?: string; businessDomain?: string; businessDescription?: string; coverImage?: string | null; products?: object[] }} [ctx]
 */
export function getFootwearHeroSlides(base, settings = {}, ctx = {}) {
  const config = getFootwearConfig(settings, ctx.businessDomain);
  const storeName = ctx.storeName || formatFootwearStoreName('');
  const featured = (ctx.products || []).filter((p) => p.is_featured && p.image_url);
  return buildTenantHeroSlides({
    settings,
    settingsSlides: config.heroSlides,
    base,
    storeName,
    businessDescription: ctx.businessDescription,
    coverImage: ctx.coverImage,
    demoSlides: FOOTWEAR_DEMO_HERO_SLIDES,
    isDemo: isDemoStoreDomain(ctx.businessDomain),
    featuredProducts: featured.length
      ? featured
      : (ctx.products || []).filter((p) => p.image_url).slice(0, 4),
  });
}

function productComparePrice(p) {
  return p?.compare_price ?? p?.compare_at_price;
}

function productDomainData(p) {
  return p?.domain_data && typeof p.domain_data === 'object' ? p.domain_data : {};
}

function isSportsProduct(p) {
  const cat = String(p?.category_name || p?.category || '').toLowerCase();
  const style = String(productDomainData(p).style || '').toLowerCase();
  const name = String(p?.name || '').toLowerCase();
  return /sport|running|training/.test(cat) || style === 'sports' || /pegasus|runner|gowalk|mercurial/.test(name);
}

/**
 * @param {object[]} products
 */
export function partitionFootwearProducts(products = []) {
  const sorted = [...(products || [])].sort((a, b) => {
    const aIn = a.stock == null || Number(a.stock) > 0 ? 0 : 1;
    const bIn = b.stock == null || Number(b.stock) > 0 ? 0 : 1;
    if (aIn !== bIn) return aIn - bIn;
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });
  const onSale = sorted.filter((p) => {
    const compare = productComparePrice(p);
    return compare && Number(compare) > Number(p.price);
  });
  const featured = sorted.filter((p) => p.is_featured);
  const topPicks = (featured.length ? featured : sorted).slice(0, 12);
  const topIds = new Set(topPicks.map((p) => p.id || p.sku));
  const deals = (onSale.length ? onSale : sorted.filter((p) => productComparePrice(p)))
    .filter((p) => !topIds.has(p.id || p.sku))
    .slice(0, 12);
  const sports = sorted.filter(isSportsProduct).slice(0, 12);
  const newArrivals = sorted.slice(0, 12);
  const usedIds = new Set([...topPicks, ...deals].map((p) => p.id || p.sku));
  const trending = sorted.filter((p) => !usedIds.has(p.id || p.sku)).slice(0, 10);
  const mosaicPool = [];
  const mosaicSeen = new Set();
  for (const p of [...(deals.length ? deals : []), ...sorted]) {
    const id = p.id || p.sku;
    if (!id || mosaicSeen.has(id)) continue;
    mosaicSeen.add(id);
    mosaicPool.push(p);
    if (mosaicPool.length >= 4) break;
  }

  return { topPicks, deals, sports, newArrivals, trending, mosaicPool };
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessDomain?: string; products?: object[]; categories?: object[] }} [ctx]
 */
export function resolveFootwearGenderTiles(settings, storeBase, ctx = {}) {
  const config = getFootwearConfig(settings, ctx.businessDomain);
  if (!config.showGenderTiles) return [];
  const productsUrl = `${storeBase}/products`;
  const list = config.genderTiles || FOOTWEAR_DEMO_GENDER_TILES;
  const products = ctx.products || [];

  const pickImageForTile = (tile) => {
    const id = String(tile.id || '').toLowerCase();
    const label = String(tile.label || '').toLowerCase();
    const match = products.find((p) => {
      if (!p?.image_url) return false;
      const gender = String(productDomainData(p).gender || '').toLowerCase();
      const cat = String(p.category_name || p.category || '').toLowerCase();
      const style = String(productDomainData(p).style || '').toLowerCase();
      const name = String(p.name || '').toLowerCase();
      if (id === 'men' || label === 'men') return gender === 'men' || /men'?s/.test(cat);
      if (id === 'women' || label === 'women') return gender === 'women' || /women'?s/.test(cat);
      if (id === 'kids' || label === 'kids') return gender === 'kids' || /kids/.test(cat);
      if (id === 'sports' || label === 'sports') return style === 'sports' || /sport|running/.test(cat) || /pegasus|runner/.test(name);
      if (id === 'casual' || label === 'casual') return style === 'casual' || /casual/.test(cat);
      if (id === 'boots' || label === 'boots') return style === 'boot' || /boot/.test(cat) || /boot/.test(name);
      if (id === 'orthopedic' || label === 'orthopedic') return style === 'orthopedic' || /ortho/.test(cat);
      if (id === 'accessories' || label === 'accessories') return /accessor|sock|care/.test(cat) || /sock|lace|cleaner/.test(name);
      return false;
    });
    return match?.image_url || tile.image || FOOTWEAR_CATEGORY_IMAGES[tile.id] || FOOTWEAR_HERO_IMAGES.hero1;
  };

  return list.map((tile) => ({
    ...tile,
    href: tile.href || `${productsUrl}${tile.hrefSuffix || `?search=${encodeURIComponent(tile.label || '')}`}`,
    image: pickImageForTile(tile),
  }));
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessDomain?: string; products?: object[] }} [ctx]
 */
export function resolveFootwearBrandWall(settings, storeBase, ctx = {}) {
  const config = getFootwearConfig(settings, ctx.businessDomain);
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
    const brand = String(p?.brand || productDomainData(p).brand || '').trim();
    if (!brand || /tenvo footwear|tenvo shoes/i.test(brand)) continue;
    brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
  }
  const fromCatalog = [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([label], i) => {
      const demo = FOOTWEAR_DEMO_BRANDS.find((d) => d.label.toLowerCase() === label.toLowerCase());
      const productWithBrand = (ctx.products || []).find(
        (p) => String(p?.brand || productDomainData(p).brand || '').toLowerCase() === label.toLowerCase() && p.image_url
      );
      return {
        id: `brand-${i}`,
        label,
        sourcing: demo?.sourcing || (FOOTWEAR_LOCAL_BRANDS.includes(label) ? 'local' : 'imported'),
        href: `${productsUrl}?search=${encodeURIComponent(label)}`,
        image: demo?.image || productWithBrand?.image_url || FOOTWEAR_HERO_IMAGES.lifestyle1,
      };
    });

  if (fromCatalog.length >= 4) return fromCatalog;
  return FOOTWEAR_DEMO_BRANDS.slice(0, 12).map((b) => ({
    ...b,
    href: `${productsUrl}${b.hrefSuffix}`,
  }));
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} businessDomain
 */
export function resolveFootwearTrustPillars(settings, businessDomain) {
  const config = getFootwearConfig(settings, businessDomain);
  if (!config.showTrustStrip) return [];
  return config.trustPillars || FOOTWEAR_DEFAULT_TRUST_PILLARS;
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessDomain?: string }} [ctx]
 */
export function resolveFootwearConditionTiles(settings, storeBase, ctx = {}) {
  const config = getFootwearConfig(settings, ctx.businessDomain);
  if (!config.showConditionGuide) return [];
  const productsUrl = `${storeBase}/products`;
  const list = config.conditionTiles || FOOTWEAR_DEMO_CONDITION_TILES;
  const products = ctx.products || [];
  return list.map((tile) => {
    const condKey = String(tile.id || '').toLowerCase();
    const match = products.find((p) => {
      if (!p?.image_url) return false;
      const c = String(productDomainData(p).condition || '').toLowerCase();
      return c === condKey || c.replace(/_/g, '') === condKey.replace(/_/g, '');
    });
    return {
      ...tile,
      href: tile.href || `${productsUrl}${tile.hrefSuffix || ''}`,
      image: tile.image || match?.image_url || FOOTWEAR_CONDITION_IMAGES.premium,
    };
  });
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} businessDomain
 */
export function resolveFootwearTestimonials(settings, businessDomain) {
  const config = getFootwearConfig(settings, businessDomain);
  if (!config.showTestimonials) return [];
  return config.testimonials || FOOTWEAR_DEMO_TESTIMONIALS;
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessDomain?: string; products?: object[] }} [ctx]
 */
export function resolveFootwearVisualNav(settings, storeBase, ctx = {}) {
  const config = getFootwearConfig(settings, ctx.businessDomain);
  if (!config.showVisualNav) return [];
  const productsUrl = `${storeBase}/products`;
  const list = config.visualNav || FOOTWEAR_DEMO_VISUAL_NAV;
  return list.map((tile) => ({
    ...tile,
    href: tile.href || `${productsUrl}${tile.hrefSuffix || `?search=${encodeURIComponent(tile.label || '')}`}`,
    image: tile.image || FOOTWEAR_VISUAL_NAV_IMAGES.nike,
  }));
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessDomain?: string; products?: object[] }} [ctx]
 */
export function resolveFootwearCampaignBands(settings, storeBase, ctx = {}) {
  const config = getFootwearConfig(settings, ctx.businessDomain);
  if (!config.showCampaignBands) return [];
  const productsUrl = `${storeBase}/products`;
  const list = config.campaignBands || FOOTWEAR_DEMO_CAMPAIGN_BANDS;
  const products = ctx.products || [];

  return list.map((band, i) => {
    const match = products.find((p) => {
      if (!p?.image_url) return false;
      const q = String(band.hrefSuffix || band.title || '')
        .replace(/^\?search=/i, '')
        .replace(/%20/g, ' ')
        .toLowerCase();
      const blob = `${p.name || ''} ${p.brand || ''} ${p.category || ''}`.toLowerCase();
      return q && blob.includes(q.split('&')[0].trim());
    });
    return {
      ...band,
      href: band.href || `${productsUrl}${band.hrefSuffix || ''}`,
      image: band.image || match?.image_url || FOOTWEAR_CAMPAIGN_IMAGES.asics,
      backgroundColor: band.backgroundColor || FOOTWEAR_DEMO_CAMPAIGN_BANDS[i % FOOTWEAR_DEMO_CAMPAIGN_BANDS.length].backgroundColor,
      textColor: band.textColor || '#111111',
      layout: band.layout || 'image-right',
    };
  });
}

/**
 * @param {object} [settings]
 * @param {object[]} [products]
 * @param {string | null | undefined} businessDomain
 */
export function resolveFootwearLifestyleSpotlight(settings, products = [], businessDomain) {
  const config = getFootwearConfig(settings, businessDomain);
  if (!config.showLifestyleSpotlight) return null;
  const featured = (products || []).find((p) => p.is_featured && p.image_url) || (products || []).find((p) => p.image_url);
  return {
    eyebrow: 'New season edit',
    title: 'Street-ready sneakers and everyday comfort',
    subtitle: 'Shop trending drops and trusted local lines with clear size and condition labels.',
    image: featured?.image_url || FOOTWEAR_HERO_IMAGES.lifestyle1,
    ctaLabel: 'Shop new arrivals',
    hrefSuffix: '?sort=newest',
  };
}

/**
 * @param {object} [settings]
 * @param {object[]} [products]
 * @param {object[]} [categories]
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveFootwearQuickSearchTerms(settings, products = [], categories = [], businessDomain) {
  const config = getFootwearConfig(settings, businessDomain);
  if (config.quickSearchTerms?.length) return config.quickSearchTerms.slice(0, 8);

  const fromCatalog = buildQuickSearchTerms(products, categories, null, 6);
  if (fromCatalog.length) return fromCatalog;

  const brandTerms = [...new Set(
    (products || [])
      .map((p) => String(p?.brand || p?.domain_data?.brand || '').trim())
      .filter((b) => b && !/tenvo/i.test(b))
  )].slice(0, 6);
  if (brandTerms.length) return brandTerms;

  return isDemoStoreDomain(businessDomain) ? FOOTWEAR_DEMO_QUICK_SEARCH_TERMS : [];
}

function resolveFootwearSeedMatch(product) {
  const sku = String(product?.sku || '').trim().toUpperCase();
  if (sku) {
    const bySku = FOOTWEAR_SEED_PRODUCTS.find((s) => String(s.sku || '').toUpperCase() === sku);
    if (bySku) return bySku;
  }
  const name = String(product?.name || '')
    .trim()
    .toLowerCase();
  if (!name) return null;
  return (
    FOOTWEAR_SEED_PRODUCTS.find((s) => String(s.name || '').trim().toLowerCase() === name) || null
  );
}

function shouldEnrichFootwearProductImage(product) {
  const url = String(product?.image_url || product?.image || '').trim();
  if (!url) return true;
  if (isDeadImageUrl(url)) return true;
  if (/unsplash\.com|placehold|via\.placeholder/i.test(url)) return true;
  return false;
}

/**
 * @param {object[]} products
 * @param {string | null | undefined} [businessDomain]
 */
export function enrichFootwearProductsWithSeedImages(products = [], businessDomain) {
  return (products || []).map((product) => {
    if (!shouldEnrichFootwearProductImage(product)) return product;
    const seed = resolveFootwearSeedMatch(product);
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
 * DB-first footwear showcase: UUID inventory only, optional seed image enrich.
 * @param {object[]} products
 * @param {string | null | undefined} [businessDomain]
 */
export function resolveFootwearShowcaseProducts(products = [], businessDomain) {
  const list = Array.isArray(products) ? products.filter(Boolean) : [];
  const dbOnly = list.filter((p) => isStorefrontProductUuid(p?.id) && !p.catalog_preview);
  return enrichFootwearProductsWithSeedImages(dbOnly, businessDomain);
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessDomain?: string }} [ctx]
 */
export function resolveFootwearThreeUp(settings, storeBase, ctx = {}) {
  const config = getFootwearConfig(settings, ctx.businessDomain);
  if (!config.showThreeUp) return [];
  const productsUrl = `${storeBase}/products`;
  const list = config.threeUp || FOOTWEAR_DEMO_THREE_UP;
  return list.map((tile) => ({
    ...tile,
    href: tile.href || `${productsUrl}${tile.hrefSuffix || ''}`,
    image: tile.image || FOOTWEAR_THREE_UP_IMAGES.trends,
  }));
}

/**
 * Foot Locker-style brand grid (8 tiles).
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessDomain?: string; products?: object[] }} [ctx]
 */
export function resolveFootwearBrandGrid(settings, storeBase, ctx = {}) {
  const config = getFootwearConfig(settings, ctx.businessDomain);
  if (!config.showBrandGrid) return [];
  return resolveFootwearBrandWall(settings, storeBase, ctx).slice(0, 8);
}

/**
 * Registration / demo storefront defaults — Foot Locker homepage modules.
 * @param {string} [canonical]
 */
export function buildDefaultFootwearStorefrontSeed(canonical = 'leather-footwear') {
  if (!isFootwearElevatedStore(canonical)) return {};
  return {
    footwear: {
      showSaleHero: true,
      showPromoStrip: true,
      showJustForYou: true,
      showEnergyBand: true,
      showRotationMosaic: true,
      showThreeUp: true,
      showFeatureSplit: true,
      showTrendingRail: true,
      showCategoryTiles: true,
      showBrandGrid: true,
      showRewardsCta: true,
      showTrustStrip: true,
      showSizeFinder: true,
      showMarketingBanners: false,
      searchPlaceholder: 'Search brand, style, or size…',
      sizeGuideLabel: 'Size guide',
      featuredRailTitle: 'Just for you',
      trendingRailTitle: 'Trending now',
      trendingRailSubtitle: 'Styles shoppers are adding this week',
      saleHeroTitle: 'Huge savings: up to 40% off',
      saleHeroSubtitle: 'Nike, Adidas, New Balance and more. Exclusions apply.',
      promoStripText: 'Members get exclusive drops, size alerts, and sale access',
      energyTitle: 'Bring the energy',
      energySubtitle: 'Make a stylish first impression with sneakers that stand out.',
      rotationTitle: 'Refresh the rotation',
      rotationSubtitle: 'Get first-day-ready with court classics and everyday pairs.',
      featureSplitTitle: 'New Balance almost here',
      featureSplitSubtitle: 'Exclusive colorways as seen on the floor. Shop the drop.',
      rewardsTitle: 'Get more with member rewards',
      rewardsSubtitle: 'Exclusive savings, early access, and size alerts.',
    },
  };
}
