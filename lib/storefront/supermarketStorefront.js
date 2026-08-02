/**
 * Elevated supermarket / grocery storefront — tenant-aware with demo defaults.
 * Isolated to storefront vertical `supermarket` (grocery, fmcg, dairy, etc.).
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { resolveStorefrontVertical } from '@/lib/config/storefrontDomains';
import {
  formatElevatedStoreName,
  buildCategoryNavItems,
  buildQuickSearchTerms,
  buildPromoBannersFromCatalog,
  buildTenantHeroSlides,
  enrichCategoryNavImages,
  isDemoStoreDomain,
} from '@/lib/storefront/elevatedStorefrontTenant';
import {
  SUPERMARKET_DEFAULT_HERO_SLIDES,
  SUPERMARKET_DEFAULT_BRANDS,
  SUPERMARKET_DEFAULT_SECTION_TITLES,
  SUPERMARKET_DEFAULT_SUB_NAV,
  SUPERMARKET_FOOTER_TRUST,
  SUPERMARKET_HOME_RAILS,
  SUPERMARKET_HOME_TRUST_PILLARS,
  SUPERMARKET_MID_PROMO_TILES,
  SUPERMARKET_POPULAR_CATEGORIES,
  SUPERMARKET_PROMO_STRIP,
  SUPERMARKET_PROMO_TILES,
  SUPERMARKET_SIDEBAR_DEPARTMENTS,
  SUPERMARKET_THEME,
  SUPERMARKET_UPPER_PROMO_TILES,
  SUPERMARKET_DELIVERY_NOTICE,
} from '@/lib/storefront/supermarketCatalogDefaults';
import {
  isMilkShopStore,
  getMilkShopConfig,
  resolveMilkShopInventoryCategories,
  buildMilkShopSidebarFromInventory,
  buildMilkShopCategoryIconsFromInventory,
  buildMilkShopBrandRowsFromProducts,
  buildMilkShopHomeRailsFromInventory,
  MILK_SHOP_QUICK_SEARCH,
  MILK_SHOP_SIDEBAR_DEPARTMENTS,
  MILK_SHOP_POPULAR_CATEGORIES,
  MILK_SHOP_DEFAULT_BRANDS,
  MILK_SHOP_SECTION_TITLES,
  MILK_SHOP_DEFAULT_HERO_SLIDES,
  MILK_SHOP_HOME_RAILS,
  MILK_SHOP_HOME_TRUST,
  MILK_SHOP_ACCENTS,
} from '@/lib/storefront/milkShopStorefront';
import {
  isWaterShopStore,
  getWaterShopConfig,
  WATER_SHOP_QUICK_SEARCH,
  WATER_SHOP_SIDEBAR_DEPARTMENTS,
  WATER_SHOP_POPULAR_CATEGORIES,
  WATER_SHOP_DEFAULT_BRANDS,
  WATER_SHOP_SECTION_TITLES,
  WATER_SHOP_DEFAULT_HERO_SLIDES,
  WATER_SHOP_HOME_RAILS,
  WATER_SHOP_HOME_TRUST,
  WATER_SHOP_ACCENTS,
} from '@/lib/storefront/waterShopStorefront';

export const SUPERMARKET_GREEN = SUPERMARKET_THEME.accent;
export const SUPERMARKET_GREEN_DARK = SUPERMARKET_THEME.accentDark;
export const SUPERMARKET_GREEN_LIGHT = SUPERMARKET_THEME.accentLight;

export const SUPERMARKET_ACCENTS = {
  accent: SUPERMARKET_THEME.accent,
  accentDark: SUPERMARKET_THEME.accentDark,
  accentLight: SUPERMARKET_THEME.accentLight,
  promoBar: SUPERMARKET_THEME.promoBar,
};

/**
 * Chrome theme for supermarket-family headers (owner brand wins; milk/water vertical defaults).
 * @param {object} [settings]
 * @param {string | null | undefined} [businessCategory]
 */
export function getSupermarketChromeTheme(settings = {}, businessCategory) {
  const milkShop = isMilkShopStore(businessCategory);
  const waterShop = isWaterShopStore(businessCategory);
  const owner = typeof settings?.brand?.primaryColor === 'string' ? settings.brand.primaryColor.trim() : '';
  if (milkShop) {
    const accent = owner || MILK_SHOP_ACCENTS.accent;
    return {
      accent,
      accentDark: MILK_SHOP_ACCENTS.accentDark,
      accentLight: MILK_SHOP_ACCENTS.accentLight,
      promoBar: MILK_SHOP_ACCENTS.promoBar,
      milkShop: true,
      waterShop: false,
    };
  }
  if (waterShop) {
    const accent = owner || WATER_SHOP_ACCENTS.accent;
    return {
      accent,
      accentDark: WATER_SHOP_ACCENTS.accentDark,
      accentLight: WATER_SHOP_ACCENTS.accentLight,
      promoBar: WATER_SHOP_ACCENTS.promoBar,
      milkShop: false,
      waterShop: true,
    };
  }
  const accent = owner || SUPERMARKET_THEME.accent;
  return {
    accent,
    accentDark: SUPERMARKET_THEME.accentDark,
    accentLight: SUPERMARKET_THEME.accentLight,
    promoBar: SUPERMARKET_THEME.promoBar,
    milkShop: false,
    waterShop: false,
  };
}

/**
 * @param {string | null | undefined} category
 */
export function isSupermarketElevatedStore(category) {
  const key = resolveDomainKey(category);
  return resolveStorefrontVertical(key) === 'supermarket';
}

/**
 * @param {string | null | undefined} name
 */
export function formatSupermarketStoreName(name) {
  return formatElevatedStoreName(name, 'Our store');
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 * @param {string | null | undefined} [businessCategory]
 */
function shouldUseSupermarketArchiveDefaults(settings = {}, businessDomain, businessCategory) {
  const saved = settings?.storefront?.heroSlides;
  if (Array.isArray(saved) && saved.length) return false;
  if (isDemoStoreDomain(businessDomain)) return true;
  return isSupermarketElevatedStore(businessCategory);
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 * @param {string | null | undefined} [businessCategory]
 */
function isSupermarketFamilyTenant(businessDomain, businessCategory) {
  return isDemoStoreDomain(businessDomain) || isSupermarketElevatedStore(businessCategory);
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 * @param {string | null | undefined} [businessCategory]
 */
export function getSupermarketConfig(settings = {}, businessDomain, businessCategory) {
  const raw = settings?.storefront?.supermarket || {};
  const isFamily = isSupermarketFamilyTenant(businessDomain, businessCategory);
  const milkShop = isMilkShopStore(businessCategory);
  const waterShop = isWaterShopStore(businessCategory);
  const milkCfg = milkShop ? getMilkShopConfig(settings) : null;
  const waterCfg = waterShop ? getWaterShopConfig(settings) : null;
  const sectionTitles = {
    ...SUPERMARKET_DEFAULT_SECTION_TITLES,
    ...(milkShop ? MILK_SHOP_SECTION_TITLES : {}),
    ...(waterShop ? WATER_SHOP_SECTION_TITLES : {}),
    ...(raw.sectionTitles || {}),
  };
  return {
    locationLabel: raw.locationLabel || 'Deliver to',
    defaultLocation: raw.defaultLocation || '',
    searchPlaceholder:
      raw.searchPlaceholder ||
      milkCfg?.searchPlaceholder ||
      waterCfg?.searchPlaceholder ||
      'Search groceries, brands, aisles…',
    deliveryNotice:
      raw.deliveryNotice
      || (milkShop ? 'Fresh milk by kg · Morning chilled delivery in your area.' : '')
      || (waterShop
        ? waterCfg?.deliveryNotice ||
          'Fixed-day rider delivery · Empty bottle return · Weekly & monthly hisab bills'
        : ''),
    promoStripLabel: raw.promoStripLabel || SUPERMARKET_PROMO_STRIP.label,
    promoStripHref: raw.promoStripHref || SUPERMARKET_PROMO_STRIP.href,
    sectionTitles,
    showAisleCarousel: raw.showAisleCarousel !== false,
    showFreshRail: raw.showFreshRail !== false,
    showDealsRail: raw.showDealsRail !== false,
    showTopSellersRail: raw.showTopSellersRail !== false,
    showBrandsRow: raw.showBrandsRow !== false,
    brandsAutoScroll: raw.brandsAutoScroll !== false,
    homeRailsAutoScroll: raw.homeRailsAutoScroll !== false,
    // Milk shops: hide grocery lifestyle banners unless the owner opts in / uploads tiles.
    showUpperPromoTiles: milkShop
      ? raw.showUpperPromoTiles === true
      : raw.showUpperPromoTiles !== false,
    showMidPromoTiles: milkShop
      ? raw.showMidPromoTiles === true
      : raw.showMidPromoTiles !== false,
    showTrustStrip: raw.showTrustStrip !== false,
    showMarketingBanners: raw.showMarketingBanners !== false,
    showPromoBanners: raw.showPromoBanners !== false,
    showDeliveryBanner: raw.showDeliveryBanner !== false,
    showFooterTrustStrip: raw.showFooterTrustStrip !== false,
    showHomeRails: raw.showHomeRails !== false,
    /** Desktop homepage left DEPARTMENTS rail (drawer still available via Categories). */
    showFeedSidebar: raw.showFeedSidebar !== false,
    featuredRailTitle: raw.featuredRailTitle || '',
    dealsRailTitle: raw.dealsRailTitle || '',
    freshRailTitle: raw.freshRailTitle || '',
    categoryIcons: Array.isArray(raw.categoryIcons) && raw.categoryIcons.length ? raw.categoryIcons : null,
    promoBanners: Array.isArray(raw.promoBanners) && raw.promoBanners.length ? raw.promoBanners : null,
    quickSearchTerms: Array.isArray(raw.quickSearchTerms) && raw.quickSearchTerms.length ? raw.quickSearchTerms : null,
    trustPillars: Array.isArray(raw.trustPillars) && raw.trustPillars.length ? raw.trustPillars : null,
    showWeeklyEssentials: raw.showWeeklyEssentials !== false && (raw.showWeeklyEssentials === true || isFamily),
    weeklyEssentialsTitle: raw.weeklyEssentialsTitle || sectionTitles.weeklyEssentials,
    deliveryBannerTitle: raw.deliveryBannerTitle || sectionTitles.deliveryBanner,
  };
}

/**
 * Merged supermarket settings for the owner admin form (defaults pre-filled).
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function getSupermarketAdminFormSettings(settings = {}, businessDomain, businessCategory) {
  const raw = settings?.storefront?.supermarket || {};
  const toggles = getSupermarketConfig(settings, businessDomain, businessCategory);
  const milkShop = isMilkShopStore(businessCategory);
  const waterShop = isWaterShopStore(businessCategory);
  // Milk/water: leave catalog lists empty so public chrome stays inventory-driven until the owner overrides.
  const pick = (key, fallback) =>
    Array.isArray(raw[key]) && raw[key].length ? raw[key] : milkShop || waterShop ? [] : fallback;

  return {
    ...toggles,
    categoryIcons: pick('categoryIcons', SUPERMARKET_POPULAR_CATEGORIES.map((item) => ({ ...item }))),
    brands: pick('brands', SUPERMARKET_DEFAULT_BRANDS.map((item) => ({ ...item }))),
    upperPromoTiles: pick('upperPromoTiles', SUPERMARKET_UPPER_PROMO_TILES.map((item) => ({ ...item }))),
    midPromoTiles: pick('midPromoTiles', SUPERMARKET_MID_PROMO_TILES.map((item) => ({ ...item }))),
    promoTiles: pick('promoTiles', SUPERMARKET_PROMO_TILES.map((item) => ({ ...item }))),
    homeRails: pick('homeRails', SUPERMARKET_HOME_RAILS.map((item) => ({ ...item, enabled: item.enabled !== false }))),
    trustPillars: pick(
      'trustPillars',
      milkShop
        ? MILK_SHOP_HOME_TRUST.map((item) => ({ ...item }))
        : waterShop
          ? WATER_SHOP_HOME_TRUST.map((item) => ({ ...item }))
          : SUPERMARKET_HOME_TRUST_PILLARS.map((item) => ({ ...item }))
    ),
    footerTrustPillars: pick('footerTrustPillars', SUPERMARKET_FOOTER_TRUST.map((item) => ({ ...item }))),
    sidebarDepartments: pick('sidebarDepartments', SUPERMARKET_SIDEBAR_DEPARTMENTS.map((item) => ({ ...item }))),
    subNavLinks: pick('subNavLinks', SUPERMARKET_DEFAULT_SUB_NAV.map((item) => ({ ...item }))),
    sectionTitles: {
      ...SUPERMARKET_DEFAULT_SECTION_TITLES,
      ...(milkShop ? MILK_SHOP_SECTION_TITLES : {}),
      ...(waterShop ? WATER_SHOP_SECTION_TITLES : {}),
      ...(raw.sectionTitles || {}),
    },
    deliveryNotice:
      raw.deliveryNotice || (milkShop || waterShop ? '' : SUPERMARKET_DELIVERY_NOTICE),
    promoStripLabel: raw.promoStripLabel || SUPERMARKET_PROMO_STRIP.label,
    promoStripHref: raw.promoStripHref || SUPERMARKET_PROMO_STRIP.href,
    searchPlaceholder:
      raw.searchPlaceholder ||
      (milkShop ? 'Search milk, dahi, lassi, brands…' : toggles.searchPlaceholder),
  };
}

function mapCatalogCategoryIcons(items, productsUrl) {
  return items.map((item) => ({
    ...item,
    href: `${productsUrl}${item.hrefSuffix || (item.slug ? `?category=${encodeURIComponent(item.slug)}` : '')}`,
  }));
}

function mapCatalogPromoTiles(tiles, productsUrl) {
  return tiles.map((tile) => ({
    ...tile,
    href: tile.href.startsWith('?') ? `${productsUrl}${tile.href}` : tile.href,
  }));
}

export const SUPERMARKET_DEMO_CATEGORY_ICONS = SUPERMARKET_POPULAR_CATEGORIES;

export const SUPERMARKET_DEMO_TRUST_PILLARS = SUPERMARKET_HOME_TRUST_PILLARS;

export const SUPERMARKET_DEMO_QUICK_SEARCH = ['Milk', 'Bread', 'Rice', 'Eggs', 'Cooking oil', 'Tea'];

function productComparePrice(p) {
  return p?.compare_price ?? p?.compare_at_price;
}

/**
 * @param {string} base
 * @param {object} [settings]
 * @param {{ storeName?: string; businessDomain?: string; businessDescription?: string; coverImage?: string | null; products?: object[] }} [ctx]
 */
export function getSupermarketHeroSlides(base, settings = {}, ctx = {}) {
  const storeName = ctx.storeName || formatSupermarketStoreName('');
  const featured = (ctx.products || []).filter((p) => p.is_featured && p.image_url);
  const milkShop = isMilkShopStore(ctx.businessCategory);
  const waterShop = isWaterShopStore(ctx.businessCategory);
  const demoSlides = milkShop
    ? MILK_SHOP_DEFAULT_HERO_SLIDES
    : waterShop
      ? WATER_SHOP_DEFAULT_HERO_SLIDES
      : SUPERMARKET_DEFAULT_HERO_SLIDES;

  return buildTenantHeroSlides({
    settings,
    settingsSlides: settings?.storefront?.heroSlides,
    base,
    storeName,
    businessDescription: ctx.businessDescription,
    coverImage: ctx.coverImage,
    demoSlides,
    isDemo: shouldUseSupermarketArchiveDefaults(settings, ctx.businessDomain, ctx.businessCategory),
    featuredProducts: featured.length ? featured : (ctx.products || []).filter((p) => p.image_url).slice(0, 4),
  });
}

/**
 * @param {object[]} products
 */
export function partitionSupermarketProducts(products = []) {
  const inStock = (products || []).filter((p) => p.stock == null || Number(p.stock) > 0);
  const pool = inStock.length ? inStock : products;
  const onSale = pool.filter((p) => {
    const compare = productComparePrice(p);
    return compare && Number(compare) > Number(p.price);
  });
  const featured = pool.filter((p) => p.is_featured);
  const fresh = pool.filter((p) => {
    const cat = String(p.category || p.category_name || '').toLowerCase();
    return /fresh|produce|fruit|vegetable|dairy|bakery|meat|milk|yogurt|dahi|lassi|ghee|paneer|khoya|cream|butter|egg/.test(
      cat
    );
  });

  return {
    topSellers: featured.length ? featured : pool.slice(0, 12),
    deals: onSale.length ? onSale : pool.filter((p) => productComparePrice(p)).slice(0, 12),
    fresh: fresh.length ? fresh : pool.slice(0, 12),
  };
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ categories?: object[]; businessDomain?: string; products?: object[]; businessCategory?: string }} [ctx]
 */
export function resolveSupermarketCategoryIcons(settings, storeBase, ctx = {}) {
  const config = getSupermarketConfig(settings, ctx.businessDomain, ctx.businessCategory);
  const productsUrl = `${storeBase}/products`;
  const milkShop = isMilkShopStore(ctx.businessCategory);
  const waterShop = isWaterShopStore(ctx.businessCategory);
  const canon = ctx.businessCategory;

  const withImages = (tiles) =>
    enrichCategoryNavImages(tiles, ctx.products || [], canon).map((item) => ({
      id: item.id,
      label: item.label,
      slug: item.slug || '',
      image: item.image || '',
      href:
        item.href ||
        `${productsUrl}${item.hrefSuffix || (item.slug ? `?category=${encodeURIComponent(item.slug)}` : '')}`,
    }));

  if (config.categoryIcons) {
    return withImages(
      config.categoryIcons.map((item) => ({
        ...item,
        href: `${productsUrl}${item.hrefSuffix || (item.slug ? `?category=${encodeURIComponent(item.slug)}` : '')}`,
      }))
    );
  }

  if (milkShop) {
    const inventoryCats = resolveMilkShopInventoryCategories(ctx.categories || [], ctx.products || []);
    const fromInventory = withImages(
      buildMilkShopCategoryIconsFromInventory(inventoryCats).map((item) => ({
        ...item,
        href: `${productsUrl}?category=${encodeURIComponent(item.slug)}`,
      }))
    );
    if (fromInventory.length) return fromInventory;
    return withImages(mapCatalogCategoryIcons(MILK_SHOP_POPULAR_CATEGORIES, productsUrl));
  }

  if (waterShop) {
    const fromDb = withImages(
      buildCategoryNavItems(ctx.categories || [], storeBase, { max: 8, includeDeals: false })
    );
    if (fromDb.length >= 4) return fromDb;
    return withImages(mapCatalogCategoryIcons(WATER_SHOP_POPULAR_CATEGORIES, productsUrl));
  }

  const fromDb = withImages(
    buildCategoryNavItems(ctx.categories || [], storeBase, { max: 8, includeDeals: true })
  );
  if (fromDb.length >= 4) return fromDb;

  return withImages(mapCatalogCategoryIcons(SUPERMARKET_POPULAR_CATEGORIES, productsUrl));
}

function slugifyDeptToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Collect inventory category tokens (slug + name) for sidebar matching.
 * @param {object[]} categories
 * @param {object[]} products
 */
export function collectSupermarketInventoryCategoryTokens(categories = [], products = []) {
  const bySlug = new Map();
  const add = (slug, label) => {
    const key = slugifyDeptToken(slug || label);
    if (!key || bySlug.has(key)) return;
    bySlug.set(key, {
      id: key,
      label: String(label || slug || key).trim(),
      slug: key,
    });
  };
  for (const cat of categories || []) {
    if (!cat?.name && !cat?.slug) continue;
    add(cat.slug || cat.name, cat.name || cat.slug);
  }
  for (const p of products || []) {
    const label = p?.category_name || p?.category;
    if (!label) continue;
    add(p.category_slug || label, label);
  }
  return bySlug;
}

/**
 * Build nested departments from product_categories.parent_id when present.
 * @param {Array<{ id?: string; name?: string; slug?: string; parent_id?: string | null }>} categories
 */
export function buildSupermarketSidebarFromCategoryTree(categories = []) {
  const rows = (categories || []).filter((c) => c?.name || c?.slug);
  if (!rows.length) return [];
  const byId = new Map(rows.map((c) => [String(c.id), c]));
  const childrenByParent = new Map();
  const roots = [];

  for (const cat of rows) {
    const parentId = cat.parent_id != null ? String(cat.parent_id) : '';
    if (parentId && byId.has(parentId)) {
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(cat);
    } else {
      roots.push(cat);
    }
  }

  if (![...childrenByParent.values()].some((list) => list.length)) return [];

  const mapNode = (cat) => {
    const id = String(cat.slug || cat.id || cat.name);
    const kids = childrenByParent.get(String(cat.id)) || [];
    return {
      id,
      label: cat.name || cat.slug,
      slug: slugifyDeptToken(cat.slug || cat.name),
      children: kids.length ? kids.map(mapNode) : undefined,
    };
  };

  return roots.map(mapNode);
}

/**
 * Append live inventory categories missing from the curated department tree.
 * @param {object[]} departments
 * @param {Map<string, { id: string; label: string; slug: string }>} inventoryBySlug
 */
export function appendMissingInventoryDepartments(departments = [], inventoryBySlug) {
  if (!inventoryBySlug?.size) return departments;
  const covered = new Set();
  const walk = (nodes) => {
    for (const node of nodes || []) {
      const slug = slugifyDeptToken(node.slug || node.label);
      if (slug) covered.add(slug);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(departments);

  const extras = [];
  for (const [slug, row] of inventoryBySlug) {
    if (covered.has(slug)) continue;
    if (slug === 'deals' || slug === 'deals-offers') continue;
    extras.push({ id: row.id, label: row.label, slug: row.slug });
  }
  if (!extras.length) return departments;

  const withoutDeals = departments.filter(
    (d) => !(d.hrefSuffix?.includes('onSale') || slugifyDeptToken(d.label) === 'deals-offers')
  );
  const deals = departments.find(
    (d) => d.hrefSuffix?.includes('onSale') || slugifyDeptToken(d.label) === 'deals-offers'
  );
  return [...withoutDeals, ...extras, ...(deals ? [deals] : [])];
}

/**
 * Point department links at real inventory slugs when curated tokens differ
 * (e.g. baby → kids-babies). Unmatched aisle children fall back to search.
 * @param {object} dept
 * @param {Map<string, { slug: string }>} inventoryBySlug
 * @param {{ parentSlug?: string }} [opts]
 */
function resolveDepartmentLinkFields(dept, inventoryBySlug, opts = {}) {
  if (dept.hrefSuffix) {
    return { hrefSuffix: dept.hrefSuffix, slug: dept.slug || '' };
  }
  const rawSlug = slugifyDeptToken(dept.slug || dept.label);
  if (rawSlug && inventoryBySlug.has(rawSlug)) {
    return { slug: inventoryBySlug.get(rawSlug).slug, hrefSuffix: undefined };
  }
  // Alias common curated tokens onto demo / live inventory labels.
  const ALIASES = {
    baby: 'kids-babies',
    'kids-and-babies': 'kids-babies',
    'beauty-personal-care': 'personal-care',
    'household-laundry': 'household',
    'chocolates-snacks': 'snacks',
    'cooking-oil-ghee': 'cooking-oil',
    meat: 'fresh-produce',
    seafood: 'fresh-produce',
    vegetables: 'fresh-produce',
    fruits: 'fresh-produce',
    'meat-poultry': 'fresh-produce',
    'frozen-chicken': 'frozen',
    'frozen-snacks': 'frozen',
    milk: 'dairy',
    cheese: 'dairy',
    yoghurt: 'dairy',
    yogurt: 'dairy',
    rice: 'food-staples',
    spices: 'food-staples',
    'cooking-oil': 'cooking-oil',
  };
  const aliased = ALIASES[rawSlug];
  if (aliased && inventoryBySlug.has(aliased)) {
    // Nested children that only alias to the parent aisle open that inventory category.
    if (opts.parentSlug && aliased === opts.parentSlug) {
      return { slug: opts.parentSlug, hrefSuffix: undefined };
    }
    return { slug: aliased, hrefSuffix: undefined };
  }
  // Nested aisle with no inventory row: fall back to parent category when available.
  if (opts.parentSlug) {
    return { slug: opts.parentSlug, hrefSuffix: undefined };
  }
  if (rawSlug) return { slug: rawSlug, hrefSuffix: undefined };
  if (dept.label) return { slug: '', hrefSuffix: `?search=${encodeURIComponent(dept.label)}` };
  return { slug: '', hrefSuffix: undefined };
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessDomain?: string; businessCategory?: string; categories?: object[]; products?: object[] }} [ctx]
 */
export function resolveSupermarketSidebarDepartments(settings, storeBase, ctx = {}) {
  const raw = settings?.storefront?.supermarket?.sidebarDepartments;
  const productsUrl = `${storeBase}/products`;
  const milkShop = isMilkShopStore(ctx.businessCategory) || isMilkShopStore(ctx.businessDomain);
  const waterShop = isWaterShopStore(ctx.businessCategory) || isWaterShopStore(ctx.businessDomain);
  const inventoryBySlug = collectSupermarketInventoryCategoryTokens(ctx.categories || [], ctx.products || []);

  let source;
  if (Array.isArray(raw) && raw.length) {
    // Owner-curated tree wins; still append any inventory aisles they have not listed.
    source = appendMissingInventoryDepartments(
      raw.map((item) => ({
        ...item,
        children: item.children?.map((child) => ({ ...child })),
      })),
      inventoryBySlug
    );
  } else if (milkShop) {
    const inventoryCats = resolveMilkShopInventoryCategories(ctx.categories || [], ctx.products || []);
    const fromInventory = buildMilkShopSidebarFromInventory(inventoryCats);
    source = fromInventory.length ? fromInventory : MILK_SHOP_SIDEBAR_DEPARTMENTS;
  } else if (waterShop) {
    const fromTree = buildSupermarketSidebarFromCategoryTree(ctx.categories || []);
    source = fromTree.length ? fromTree : WATER_SHOP_SIDEBAR_DEPARTMENTS;
  } else {
    const fromTree = buildSupermarketSidebarFromCategoryTree(ctx.categories || []);
    if (fromTree.length) {
      source = appendMissingInventoryDepartments(fromTree, inventoryBySlug);
      if (!source.some((d) => d.hrefSuffix?.includes('onSale'))) {
        source = [
          ...source,
          { id: 'deals', label: 'Deals & Offers', slug: '', hrefSuffix: '?onSale=true' },
        ];
      }
    } else {
      // Keep the Naheed/DSM nested DEPARTMENTS tree by default (never flatten to inventory-only).
      source = appendMissingInventoryDepartments(
        SUPERMARKET_SIDEBAR_DEPARTMENTS.map((item) => ({
          ...item,
          children: item.children?.map((child) => ({ ...child })),
        })),
        inventoryBySlug
      );
    }
  }

  const mapDept = (dept, parentSlug = '') => {
    const link = resolveDepartmentLinkFields(dept, inventoryBySlug, { parentSlug });
    const children = Array.isArray(dept.children)
      ? dept.children.map((child) => mapDept(child, link.slug || parentSlug))
      : undefined;
    return {
      ...dept,
      children,
      hrefSuffix: link.hrefSuffix,
      slug: link.slug,
      href: link.hrefSuffix
        ? `${productsUrl}${link.hrefSuffix}`
        : link.slug
          ? `${productsUrl}?category=${encodeURIComponent(link.slug)}`
          : productsUrl,
    };
  };

  return source.map((dept) => mapDept(dept));
}

export function resolveSupermarketBrands(settings = {}, storeBase, ctx = {}) {
  const raw = settings?.storefront?.supermarket?.brands;
  const productsUrl = `${storeBase}/products`;
  const milkShop = isMilkShopStore(ctx.businessCategory) || isMilkShopStore(ctx.businessDomain);

  let source;
  if (Array.isArray(raw) && raw.length) {
    source = raw;
  } else if (milkShop) {
    const fromProducts = buildMilkShopBrandRowsFromProducts(ctx.products || []);
    source = fromProducts.length >= 2 ? fromProducts : MILK_SHOP_DEFAULT_BRANDS;
  } else if (isWaterShopStore(ctx.businessCategory) || isWaterShopStore(ctx.businessDomain)) {
    const fromProducts = [...new Set((ctx.products || []).map((p) => p.brand).filter(Boolean))]
      .slice(0, 12)
      .map((label, i) => ({
        id: `brand-${i}`,
        label,
        hrefSuffix: `?search=${encodeURIComponent(label)}`,
      }));
    source = fromProducts.length >= 2 ? fromProducts : WATER_SHOP_DEFAULT_BRANDS;
  } else {
    const fromProducts = [...new Set((ctx.products || []).map((p) => p.brand).filter(Boolean))]
      .slice(0, 12)
      .map((label, i) => ({
        id: `brand-${i}`,
        label,
        hrefSuffix: `?search=${encodeURIComponent(label)}`,
      }));
    source = fromProducts.length >= 2 ? fromProducts : SUPERMARKET_DEFAULT_BRANDS;
  }

  return source.map((brand) => ({
    ...brand,
    href: brand.href
      || `${productsUrl}${brand.hrefSuffix || `?search=${encodeURIComponent(brand.label)}`}`,
  }));
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessCategory?: string; products?: object[] }} [ctx]
 */
export function resolveSupermarketMidPromoTiles(settings, storeBase, ctx = {}) {
  const raw = settings?.storefront?.supermarket?.midPromoTiles;
  const productsUrl = `${storeBase}/products`;
  if (Array.isArray(raw) && raw.length) {
    return mapCatalogPromoTiles(raw, productsUrl);
  }
  if (isMilkShopStore(ctx.businessCategory)) return [];
  if (isWaterShopStore(ctx.businessCategory)) return [];
  return mapCatalogPromoTiles(SUPERMARKET_MID_PROMO_TILES, productsUrl);
}

/**
 * @param {object} [settings]
 */
export function resolveSupermarketFooterTrust(settings = {}, businessCategory) {
  const raw = settings?.storefront?.supermarket?.footerTrustPillars;
  if (Array.isArray(raw) && raw.length) return raw;
  if (isMilkShopStore(businessCategory)) {
    return MILK_SHOP_HOME_TRUST.map((item) => ({
      id: item.id,
      label: item.label,
      desc: item.desc,
      icon: item.id === 'cod' ? 'credit' : item.id === 'kg' ? 'truck' : item.id === 'daily' ? 'shield' : 'truck',
    }));
  }
  if (isWaterShopStore(businessCategory)) {
    return WATER_SHOP_HOME_TRUST.map((item) => ({
      id: item.id,
      label: item.label,
      desc: item.desc,
      icon:
        item.id === 'pay' ? 'credit' : item.id === 'cycle' ? 'shield' : item.id === 'psqca' ? 'shield' : 'truck',
    }));
  }
  return SUPERMARKET_FOOTER_TRUST;
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ categories?: object[] }} [ctx]
 */
export function resolveSupermarketSubNav(settings, storeBase, ctx = {}) {
  const raw = settings?.storefront?.supermarket?.subNavLinks;
  const productsUrl = `${storeBase}/products`;
  const milkShop = isMilkShopStore(ctx.businessCategory) || isMilkShopStore(ctx.businessDomain);

  if (Array.isArray(raw) && raw.length) {
    return raw.map((link) => ({
      ...link,
      href: link.href
        || `${productsUrl}${link.hrefSuffix || (link.slug ? `?category=${encodeURIComponent(link.slug)}` : '')}`,
    }));
  }

  if (milkShop) {
    const inventoryCats = resolveMilkShopInventoryCategories(ctx.categories || [], ctx.products || []);
    const source = inventoryCats.length
      ? inventoryCats
      : MILK_SHOP_SIDEBAR_DEPARTMENTS.map((d) => ({ id: d.id, name: d.label, slug: d.slug }));
    return source.slice(0, 8).map((c) => ({
      id: String(c.id || c.slug),
      label: c.name || c.label,
      slug: c.slug || c.name || c.label,
      href: `${productsUrl}?category=${encodeURIComponent(c.slug || c.name || c.label)}`,
    }));
  }

  if ((ctx.categories || []).length >= 4) {
    return buildCategoryNavItems(ctx.categories || [], storeBase, { max: 8, includeDeals: true }).map((item) => ({
      id: item.id,
      label: item.label,
      slug: item.slug || '',
      href: item.href,
    }));
  }

  return SUPERMARKET_DEFAULT_SUB_NAV.map((link) => ({
    ...link,
    href: link.href
      || `${productsUrl}${link.hrefSuffix || (link.slug ? `?category=${encodeURIComponent(link.slug)}` : '')}`,
  }));
}

/**
 * @param {string} base
 * @param {{ businessCategory?: string }} [ctx]
 */
export function getSupermarketFooterColumns(base, ctx = {}) {
  const products = `${base}/products`;
  if (isMilkShopStore(ctx.businessCategory)) {
    return [
      {
        title: 'Shop',
        links: [
          { label: 'All products', href: products },
          { label: 'Fresh milk', href: `${products}?category=${encodeURIComponent('Fresh Milk')}` },
          { label: 'Dahi and yogurt', href: `${products}?category=${encodeURIComponent('Yogurt / Dahi')}` },
          { label: 'Lassi and drinks', href: `${products}?category=${encodeURIComponent('Lassi & Drinks')}` },
          { label: 'Packaged dairy', href: `${products}?category=${encodeURIComponent('Packaged Dairy')}` },
        ],
      },
      {
        title: 'Customer service',
        links: [
          { label: 'Track order', href: `${base}/orders` },
          { label: 'Contact us', href: `${base}/contact` },
          { label: 'Shipping', href: `${base}/shipping` },
          { label: 'Returns', href: `${base}/returns` },
        ],
      },
      {
        title: 'Information',
        links: [
          { label: 'About us', href: `${base}/about` },
          { label: 'Privacy policy', href: `${base}/privacy` },
          { label: 'Terms & conditions', href: `${base}/terms` },
        ],
      },
    ];
  }
  return [
    {
      title: 'Shop',
      links: [
        { label: 'All products', href: products },
        { label: 'New arrivals', href: `${products}?sort=newest` },
        { label: 'Deals & offers', href: `${products}?onSale=true` },
        { label: 'Fresh produce', href: `${products}?category=fresh-produce` },
        { label: 'Beverages', href: `${products}?category=beverages` },
      ],
    },
    {
      title: 'Customer service',
      links: [
        { label: 'Track order', href: `${base}/orders` },
        { label: 'Contact us', href: `${base}/contact` },
        { label: 'FAQs', href: `${base}/faqs` },
        { label: 'Shipping', href: `${base}/shipping` },
        { label: 'Returns', href: `${base}/returns` },
      ],
    },
    {
      title: 'Information',
      links: [
        { label: 'About us', href: `${base}/about` },
        { label: 'Privacy policy', href: `${base}/privacy` },
        { label: 'Terms & conditions', href: `${base}/terms` },
      ],
    },
  ];
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessCategory?: string; products?: object[] }} [ctx]
 */
export function resolveSupermarketPromoTiles(settings, storeBase, ctx = {}) {
  const raw = settings?.storefront?.supermarket?.promoTiles;
  const productsUrl = `${storeBase}/products`;
  if (Array.isArray(raw) && raw.length) {
    return mapCatalogPromoTiles(raw, productsUrl);
  }
  if (isMilkShopStore(ctx.businessCategory)) {
    const built = buildPromoBannersFromCatalog(ctx.products || [], null, null, {
      businessCategory: ctx.businessCategory,
    });
    return built.map((tile) => ({
      ...tile,
      href: tile.href?.startsWith('?') ? `${productsUrl}${tile.href}` : tile.href || productsUrl,
    }));
  }
  return mapCatalogPromoTiles(SUPERMARKET_PROMO_TILES, productsUrl);
}

/**
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ businessCategory?: string }} [ctx]
 */
export function resolveSupermarketUpperPromoTiles(settings, storeBase, ctx = {}) {
  const raw = settings?.storefront?.supermarket?.upperPromoTiles;
  const productsUrl = `${storeBase}/products`;
  if (Array.isArray(raw) && raw.length) {
    return mapCatalogPromoTiles(raw, productsUrl);
  }
  if (isMilkShopStore(ctx.businessCategory)) return [];
  if (isWaterShopStore(ctx.businessCategory)) return [];
  return mapCatalogPromoTiles(SUPERMARKET_UPPER_PROMO_TILES, productsUrl);
}

/**
 * @param {object} [settings]
 * @param {string} [businessCategory]
 * @param {{ categories?: object[]; products?: object[] }} [ctx]
 */
export function resolveSupermarketHomeRails(settings = {}, businessCategory, ctx = {}) {
  const raw = settings?.storefront?.supermarket?.homeRails;
  if (Array.isArray(raw) && raw.length) {
    return raw.filter((rail) => rail.enabled !== false);
  }
  if (isMilkShopStore(businessCategory)) {
    const inventoryCats = resolveMilkShopInventoryCategories(ctx.categories || [], ctx.products || []);
    const fromInventory = buildMilkShopHomeRailsFromInventory(inventoryCats, ctx.products || []);
    if (fromInventory.length) return fromInventory;
    return MILK_SHOP_HOME_RAILS.filter((rail) => rail.enabled !== false);
  }
  if (isWaterShopStore(businessCategory)) {
    return WATER_SHOP_HOME_RAILS.filter((rail) => rail.enabled !== false);
  }
  return SUPERMARKET_HOME_RAILS.filter((rail) => rail.enabled !== false);
}

/**
 * @param {object} [settings]
 * @param {object[]} products
 * @param {string} [businessDomain]
 * @param {string} [businessCategory]
 */
export function resolveSupermarketPromoBanners(settings, products = [], businessDomain, businessCategory) {
  const config = getSupermarketConfig(settings, businessDomain, businessCategory);
  if (config.promoBanners) return config.promoBanners;
  const built = buildPromoBannersFromCatalog(products, null, null, {
    businessCategory,
    isDemo: isDemoStoreDomain(businessDomain),
  });
  if (built.length) return built;
  if (isMilkShopStore(businessCategory)) return [];
  if (isWaterShopStore(businessCategory)) return [];
  const productsUrl = `/store/${businessDomain}/products`;
  return mapCatalogPromoTiles(SUPERMARKET_PROMO_TILES.slice(0, 4), productsUrl).map((tile) => ({
    id: tile.id,
    title: tile.title,
    subtitle: tile.subtitle,
    image: tile.image,
    href: tile.href.replace(productsUrl, ''),
    tone: 'orange',
  }));
}

/**
 * @param {object} [settings]
 * @param {string} [businessDomain]
 * @param {string} [businessCategory]
 */
export function resolveSupermarketTrustPillars(settings, businessDomain, businessCategory) {
  const config = getSupermarketConfig(settings, businessDomain, businessCategory);
  if (config.trustPillars) return config.trustPillars;
  if (isMilkShopStore(businessCategory)) return MILK_SHOP_HOME_TRUST;
  if (isWaterShopStore(businessCategory)) return WATER_SHOP_HOME_TRUST;
  return SUPERMARKET_HOME_TRUST_PILLARS;
}

/**
 * @param {object} [settings]
 * @param {object[]} [products]
 * @param {object[]} [categories]
 * @param {string} [businessDomain]
 * @param {string} [businessCategory]
 */
export function resolveSupermarketQuickSearchTerms(settings = {}, products = [], categories = [], businessDomain, businessCategory) {
  const config = getSupermarketConfig(settings, businessDomain, businessCategory);
  const milkCfg = isMilkShopStore(businessCategory) ? getMilkShopConfig(settings) : null;
  const ownerTerms = config.quickSearchTerms?.length
    ? config.quickSearchTerms
    : milkCfg?.quickSearchTerms;
  if (ownerTerms?.length) return ownerTerms.slice(0, 8);

  const fromCatalog = buildQuickSearchTerms(products, categories, null, 8);
  if (fromCatalog.length) return fromCatalog;

  if (isMilkShopStore(businessCategory)) return MILK_SHOP_QUICK_SEARCH.slice(0, 8);
  if (isWaterShopStore(businessCategory)) return WATER_SHOP_QUICK_SEARCH.slice(0, 8);
  if (isDemoStoreDomain(businessDomain) || isSupermarketElevatedStore(businessCategory)) {
    return SUPERMARKET_DEMO_QUICK_SEARCH;
  }
  return ['Milk', 'Bread', 'Rice'].filter(Boolean);
}
