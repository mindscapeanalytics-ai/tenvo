/**
 * Elevated tiles, marble & stone storefront — tenant-aware with Tenvo Marbles demo defaults.
 * Isolated to canonical `ceramics-tiles` vertical.
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import {
  formatElevatedStoreName,
  buildCategoryNavItems,
  buildCuratedTabsFromCategories,
  buildQuickSearchTerms,
  buildPromoBannersFromCatalog,
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
import { getTilesDemoImage } from '@/lib/dataLab/tilesDemoImages';

export const TILES_ELEVATED_CANONICALS = new Set(['ceramics-tiles']);

export const TILES_STONE = '#1c1917';
export const TILES_STONE_DARK = '#0c0a09';
export const TILES_STONE_LIGHT = '#fafaf9';
export const TILES_CREAM = '#f5f5f4';

export const TILES_ACCENTS = {
  accent: TILES_STONE,
  accentDark: TILES_STONE_DARK,
  accentLight: TILES_STONE_LIGHT,
};

/**
 * @param {string | null | undefined} category
 */
export function isTilesElevatedStore(category) {
  return TILES_ELEVATED_CANONICALS.has(resolveDomainKey(category));
}

/**
 * Public-facing store name (strips legacy "Demo" suffix).
 * @param {string | null | undefined} name
 */
export function formatTilesStoreName(name) {
  return formatElevatedStoreName(name, 'Our tiles & marble store');
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function getTilesConfig(settings = {}, businessDomain) {
  const raw = settings?.storefront?.tiles || {};
  const isDemo = isDemoStoreDomain(businessDomain);
  return {
    locationLabel: raw.locationLabel || 'Deliver to',
    defaultLocation: raw.defaultLocation || '',
    searchPlaceholder: raw.searchPlaceholder || 'Search floor tiles, wall tiles, marble, granite…',
    showroomLabel: raw.showroomLabel || 'Visit emporium',
    showRoomTiles: raw.showRoomTiles !== false,
    showTestimonials: raw.showTestimonials === true || (raw.showTestimonials === undefined && isDemo),
    showShowroomCta: raw.showShowroomCta !== false,
    showMarketingBanners: raw.showMarketingBanners !== false,
    featuredRailTitle: raw.featuredRailTitle || '',
    featuredRailSubtitle: raw.featuredRailSubtitle || '',
    heroSlides: Array.isArray(raw.heroSlides) && raw.heroSlides.length ? raw.heroSlides : null,
    roomCollections: Array.isArray(raw.roomCollections) && raw.roomCollections.length ? raw.roomCollections : null,
    categoryIcons: Array.isArray(raw.categoryIcons) && raw.categoryIcons.length ? raw.categoryIcons : null,
    promoBanners: Array.isArray(raw.promoBanners) && raw.promoBanners.length ? raw.promoBanners : null,
    editorialBanners: Array.isArray(raw.editorialBanners) && raw.editorialBanners.length ? raw.editorialBanners : null,
    trustPillars: Array.isArray(raw.trustPillars) && raw.trustPillars.length ? raw.trustPillars : null,
    curatedTabs: Array.isArray(raw.curatedTabs) && raw.curatedTabs.length ? raw.curatedTabs : null,
    quickSearchTerms: Array.isArray(raw.quickSearchTerms) && raw.quickSearchTerms.length ? raw.quickSearchTerms : null,
    testimonials: Array.isArray(raw.testimonials) && raw.testimonials.length ? raw.testimonials : null,
  };
}

export const TILES_DEMO_QUICK_SEARCH_TERMS = ['Floor Tiles', 'Marble', 'Granite', 'Onyx', 'Wall Tiles'];
/** @deprecated use resolveTilesQuickSearchTerms */
export const TILES_QUICK_SEARCH_TERMS = [];

/**
 * @param {string} base `/store/{domain}`
 */
export function getTilesNavLinks(base, categories = []) {
  const fromDb = buildCategoryNavItems(categories, base, { max: 6, includeDeals: true });
  if (fromDb.length) {
    return fromDb.map((item) => ({ id: item.id, label: item.label, href: item.href }));
  }
  const products = `${base}/products`;
  return [
    { id: 'all', label: 'All tiles', href: products },
    { id: 'sale', label: 'Sale', href: `${products}?onSale=true` },
    { id: 'contact', label: 'Visit emporium', href: `${base}/contact` },
  ];
}

/** Demo-only space collections (Unsplash). */
export const TILES_DEMO_ROOM_COLLECTIONS = [
  {
    id: 'living',
    label: 'Living Room',
    slug: 'floor-tiles',
    desc: 'Porcelain floors & marble looks',
    image: getTilesDemoImage('living', 800),
  },
  {
    id: 'bedroom',
    label: 'Bedroom',
    slug: 'floor-tiles',
    desc: 'Warm wood planks & soft tones',
    image: getTilesDemoImage('bedroom', 800),
  },
  {
    id: 'dining',
    label: 'Dining Room',
    slug: 'floor-tiles',
    desc: 'Elegant large-format tiles',
    image: getTilesDemoImage('dining', 800),
  },
  {
    id: 'bathroom',
    label: 'Bathroom',
    slug: 'bathroom-tiles',
    desc: 'Wall & floor bathroom suites',
    image: getTilesDemoImage('bathroom', 800),
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    slug: 'kitchen-tiles',
    desc: 'Counters, walls & floors',
    image: getTilesDemoImage('kitchen', 800),
  },
  {
    id: 'outdoor',
    label: 'Outdoor',
    slug: 'outdoor-tiles',
    desc: 'Vitrified & anti-slip surfaces',
    image: getTilesDemoImage('outdoor', 800),
  },
];

/** Demo-only category icons. */
export const TILES_DEMO_CATEGORY_ICONS = [
  { id: 'floor', label: 'Floor', slug: 'floor-tiles', image: getTilesDemoImage('porcelain', 200) },
  { id: 'wall', label: 'Wall', slug: 'wall-tiles', image: getTilesDemoImage('heroWall', 200) },
  { id: 'marble', label: 'Marble', slug: 'marble', image: getTilesDemoImage('marbleWhite', 200) },
  { id: 'granite', label: 'Granite', slug: 'granite', image: getTilesDemoImage('granite', 200) },
  { id: 'onyx', label: 'Onyx', slug: 'onyx', image: getTilesDemoImage('onyx', 200) },
  { id: 'outdoor', label: 'Outdoor', slug: 'outdoor-tiles', image: getTilesDemoImage('outdoor', 200) },
  { id: 'mosaic', label: 'Mosaic', slug: 'mosaic-tiles', image: getTilesDemoImage('mosaic', 200) },
  { id: 'bathroom', label: 'Bathroom', slug: 'bathroom-tiles', image: getTilesDemoImage('bathroom', 200) },
  { id: 'kitchen', label: 'Kitchen', slug: 'kitchen-tiles', image: getTilesDemoImage('kitchen', 200) },
  { id: 'sale', label: 'Sale', slug: '', hrefSuffix: '?onSale=true', image: getTilesDemoImage('collectionSignature', 200) },
];

/**
 * Slug / label → curated demo image when catalog enrichment finds nothing.
 * Keeps Bedroom / Deals / empty categories from showing "IMA" placeholders.
 * @param {{ id?: string; slug?: string; label?: string }} item
 */
export function resolveTilesCategoryFallbackImage(item = {}) {
  const slug = String(item.slug || item.id || '').toLowerCase().trim();
  const label = String(item.label || '').toLowerCase().trim();
  const haystack = `${slug} ${label}`;

  const bySlug = TILES_DEMO_CATEGORY_ICONS.find(
    (demo) => demo.slug && slug && demo.slug === slug
  );
  if (bySlug?.image) return bySlug.image;

  if (
    slug === 'deals' ||
    item.id === 'deals' ||
    /\b(deal|sale|offer)\b/.test(haystack)
  ) {
    const sale = TILES_DEMO_CATEGORY_ICONS.find((d) => d.id === 'sale');
    if (sale?.image) return sale.image;
  }

  const keywordPairs = [
    [/bedroom|mattress|\bbed\b/, 'beds'],
    [/coffee/, 'coffee'],
    [/dining/, 'dining'],
    [/kids|children/, 'kids'],
    [/recliner/, 'recliners'],
    [/sectional/, 'sectional'],
    [/living|sofa|lounge/, 'sofas'],
    [/outdoor|patio/, 'outdoor'],
  ];
  for (const [re, demoId] of keywordPairs) {
    if (re.test(haystack)) {
      const demo = TILES_DEMO_CATEGORY_ICONS.find((d) => d.id === demoId);
      if (demo?.image) return demo.image;
    }
  }

  return getFallbackProductImageUrl(
    { name: item.label || item.slug || 'ceramics-tiles', id: item.id || item.slug },
    'ceramics-tiles'
  );
}

/**
 * Room / category tile images must be real product photography, not monograms or dead hosts.
 * @param {string | null | undefined} url
 */
function isUsableTilesTileImage(url) {
  if (typeof url !== 'string' || !url.trim()) return false;
  if (isDeadImageUrl(url)) return false;
  if (url.includes('ui-avatars.com')) return false;
  if (url.startsWith('data:')) return false;
  return true;
}

/**
 * @param {object} product
 * @param {{ slug?: string; label?: string; name?: string }} item
 */
function productMatchesTilesCategory(product, item) {
  const slug = String(item?.slug || '').toLowerCase().trim();
  const label = String(item?.label || item?.name || '').toLowerCase().trim();
  const pSlug = String(product?.category_slug || '').toLowerCase().trim();
  const pName = String(product?.category_name || product?.category || '')
    .toLowerCase()
    .trim();
  if (slug && pSlug && pSlug === slug) return true;
  if (label && pName && pName === label) return true;
  if (slug && pName && pName.replace(/\s+/g, '-') === slug) return true;
  return false;
}

/**
 * Prefer featured / imaged inventory rows for a category tile.
 * @param {object[]} products
 * @param {{ slug?: string; label?: string; name?: string }} item
 * @param {string | null | undefined} businessCategory
 */
function pickTilesCategoryProductImage(products, item, businessCategory) {
  const matches = (products || []).filter((p) => productMatchesTilesCategory(p, item));
  const scored = matches
    .map((p) => {
      const image = getEffectiveProductImageUrl(p, businessCategory || 'ceramics-tiles');
      return {
        image,
        usable: isUsableTilesTileImage(image),
        featured: Boolean(p.is_featured),
      };
    })
    .filter((row) => row.usable);
  scored.sort((a, b) => Number(b.featured) - Number(a.featured));
  return scored[0]?.image || '';
}

/**
 * Ensure every category/room tile has a usable image from inventory, then curated fallbacks.
 * @param {object[]} items
 * @param {object[]} [products]
 * @param {string | null | undefined} [businessCategory]
 */
function withTilesCategoryImages(items, products, businessCategory) {
  const canon = businessCategory || 'ceramics-tiles';
  return (items || []).map((item) => {
    // Prefer live inventory photography over category.image_url (often empty/broken).
    const fromInventory = pickTilesCategoryProductImage(products, item, canon);
    if (fromInventory) return { ...item, image: fromInventory };

    if (isUsableTilesTileImage(item.image)) return item;

    const enriched = enrichCategoryNavImages([{ ...item, image: '' }], products, canon)[0];
    if (isUsableTilesTileImage(enriched?.image)) {
      return { ...item, image: enriched.image };
    }

    return { ...item, image: resolveTilesCategoryFallbackImage(item) };
  });
}

const TILES_ROOM_TILE_TARGET = 6;

const TILES_DEMO_HERO_SLIDES = [
  {
    eyebrow: '{storeName} · Porcelain & stone',
    title: 'Floor tiles crafted for lasting elegance',
    subtitle: 'Real porcelain collections with shade-matched lots for homes and commercial projects.',
    image: getTilesDemoImage('heroFloor', 1920),
    ctaLabel: 'Shop floor tiles',
    ctaHref: '/products?category=floor-tiles',
  },
  {
    eyebrow: 'Natural stone',
    title: 'Marble, granite, and onyx slabs',
    subtitle: 'Premium natural stone for counters, floors, and feature walls with expert guidance.',
    image: getTilesDemoImage('marbleWhite', 1920),
    ctaLabel: 'Explore marble',
    ctaHref: '/products?category=marble',
  },
  {
    eyebrow: 'Visit our emporium',
    title: 'See finishes and sizes in person',
    subtitle: 'Browse collections, match shades, and plan your project with our showroom team.',
    image: getTilesDemoImage('heroShowroom', 1920),
    ctaLabel: 'Book a visit',
    ctaHref: '/contact',
  },
];

/** Marketing / homepage gallery hero — same asset as `/store/demo-tiles` slide 0 */
export const TILES_MARKETING_HERO_IMAGE = TILES_DEMO_HERO_SLIDES[0]?.image || '';

/**
 * @param {string} base
 * @param {object} [settings]
 * @param {{ storeName?: string; businessDomain?: string; businessDescription?: string; coverImage?: string | null; products?: object[] }} [ctx]
 */
export function getTilesHeroSlides(base, settings = {}, ctx = {}) {
  const config = getTilesConfig(settings, ctx.businessDomain);
  const storeName = ctx.storeName || formatTilesStoreName('');
  const featured = (ctx.products || []).filter((p) => p.is_featured && p.image_url);

  return buildTenantHeroSlides({
    settings,
    settingsSlides: config.heroSlides,
    base,
    storeName,
    businessDescription: ctx.businessDescription,
    coverImage: ctx.coverImage,
    demoSlides: TILES_DEMO_HERO_SLIDES,
    isDemo: isDemoStoreDomain(ctx.businessDomain),
    featuredProducts: featured.length ? featured : (ctx.products || []).filter((p) => p.image_url).slice(0, 4),
  });
}

/** Demo-only promo banners. */
export const TILES_DEMO_PROMO_BANNERS = [
  {
    id: 'floor',
    title: 'Porcelain Floor Collections',
    subtitle: 'Elite, Modish, and wooden plank looks',
    image: getTilesDemoImage('porcelain', 900),
    href: '?category=floor-tiles',
    tone: 'walnut',
  },
  {
    id: 'marble',
    title: 'Marble & Natural Stone',
    subtitle: 'Slabs and tiles for counters and floors',
    image: getTilesDemoImage('marbleWhite', 900),
    href: '?category=marble',
    tone: 'cream',
  },
  {
    id: 'outdoor',
    title: 'Outdoor & Vitrified',
    subtitle: 'Anti-slip surfaces for patios and pathways',
    image: getTilesDemoImage('outdoor', 900),
    href: '?category=outdoor-tiles',
    tone: 'walnut',
  },
  {
    id: 'value',
    title: 'Project value packs',
    subtitle: 'Floor, wall, and adhesive bundles on offer',
    image: getTilesDemoImage('collectionModish', 900),
    href: '?onSale=true',
    tone: 'cream',
  },
];

/** Demo-only editorial banners. */
export const TILES_DEMO_EDITORIAL_BANNERS = [
  {
    id: 'elite',
    eyebrow: 'Elite Collection',
    title: 'Nature-inspired porcelain',
    subtitle: 'Vein patterns and stone textures that elevate living rooms and dining spaces.',
    image: getTilesDemoImage('collectionElite', 1200),
    href: '?category=floor-tiles',
  },
  {
    id: 'onyx',
    eyebrow: 'Feature walls',
    title: 'Translucent onyx slabs',
    subtitle: 'Backlit-ready onyx for reception desks, bars, and statement interiors.',
    image: getTilesDemoImage('onyx', 1200),
    href: '?category=onyx',
  },
  {
    id: 'bathroom',
    eyebrow: 'Bath suites',
    title: 'Bathroom wall & floor sets',
    subtitle: 'Matched tones for calm, durable wet areas with anti-slip options.',
    image: getTilesDemoImage('bathroom', 1200),
    href: '?category=bathroom-tiles',
  },
];

export const TILES_DEFAULT_TRUST_PILLARS = [
  { id: 'delivery', label: 'Delivery & assembly', desc: 'On qualifying orders' },
  { id: 'custom', label: 'Customisation options', desc: 'Fabrics, sizes, and finishes' },
  { id: 'warranty', label: 'Peace of mind promise', desc: 'Simple returns and warranty' },
  { id: 'homes', label: 'Made for modern homes', desc: 'Smart scale for any space' },
];

export const TILES_DEFAULT_CURATED_TABS = [{ id: 'all', label: 'All items', slug: '' }];

/** Demo-only testimonials. */
export const TILES_DEMO_TESTIMONIALS = [
  {
    id: '1',
    quote: 'Shade matching across three rooms was perfect. The team helped us pick the right finish for a busy family home.',
    product: 'Elite Carrara Vein',
    author: 'Karachi homeowner',
  },
  {
    id: '2',
    quote: 'We ordered marble slabs for the kitchen and onyx for the reception. Delivery was on time and lots were clearly labelled.',
    product: 'Carrara White Marble',
    author: 'Interior designer',
  },
  {
    id: '3',
    quote: 'Excellent outdoor anti-slip tiles for our patio. Samples made the decision easy.',
    product: 'Signature Anti-Slip Graphite',
    author: 'Lahore project client',
  },
  {
    id: '4',
    quote: 'Professional quotation for a commercial washroom package. Wall and floor sets arrived shade-matched.',
    product: 'Bathroom Pearl Relief',
    author: 'Contractor',
  },
];

function productComparePrice(p) {
  return p?.compare_price ?? p?.compare_at_price;
}

/**
 * Partition catalog into homepage rails.
 * @param {object[]} products
 */
export function partitionTilesProducts(products = []) {
  const inStock = (products || []).filter((p) => p.stock == null || Number(p.stock) > 0);
  const pool = inStock.length ? inStock : products;
  const onSale = pool.filter((p) => {
    const compare = productComparePrice(p);
    return compare && Number(compare) > Number(p.price);
  });
  const featured = pool.filter((p) => p.is_featured);

  return {
    topPicks: featured.length ? featured : pool.slice(0, 12),
    deals: onSale.length ? onSale : pool.filter((p) => productComparePrice(p)).slice(0, 12),
    newArrivals: pool.slice(0, 12),
  };
}

export function filterTilesByCategorySlug(products = [], slug) {
  return filterProductsByCategorySlug(products, slug);
}

/**
 * @param {object} [settings]
 * @param {string} base
 */
export function resolveTilesCategoryIcons(settings, storeBase, ctx = {}) {
  const config = getTilesConfig(settings, ctx.businessDomain);
  const productsUrl = `${storeBase}/products`;
  const mapHref = (item) => ({
    ...item,
    href:
      item.href ||
      `${productsUrl}${item.hrefSuffix || (item.slug ? `?category=${encodeURIComponent(item.slug)}` : '')}`,
  });

  if (config.categoryIcons) {
    return withTilesCategoryImages(
      config.categoryIcons.map(mapHref),
      ctx.products,
      ctx.businessCategory
    );
  }

  const fromDb = withTilesCategoryImages(
    buildCategoryNavItems(ctx.categories, storeBase, { max: 10, includeDeals: true }).filter(
      (c) => c.label
    ),
    ctx.products,
    ctx.businessCategory
  );

  if (fromDb.length >= 2) return fromDb;

  if (isDemoStoreDomain(ctx.businessDomain)) {
    return withTilesCategoryImages(
      TILES_DEMO_CATEGORY_ICONS.map(mapHref),
      ctx.products,
      ctx.businessCategory
    );
  }

  return fromDb;
}

function productHasSalePrice(p) {
  const compare = p?.compare_price ?? p?.compare_at_price;
  return compare != null && Number(compare) > Number(p?.price);
}

/**
 * Inventory-first room tiles: categories with live products, padded to 6 for a full desktop grid.
 * @param {object} [settings]
 * @param {string} storeBase
 * @param {{ categories?: object[]; products?: object[]; businessDomain?: string; businessCategory?: string }} [ctx]
 */
export function resolveTilesRoomCollections(settings, storeBase, ctx = {}) {
  const config = getTilesConfig(settings, ctx.businessDomain);
  const products = ctx.products || [];
  const productsUrl = `${storeBase}/products`;
  const canon = ctx.businessCategory || 'ceramics-tiles';

  if (config.roomCollections) {
    return withTilesCategoryImages(
      config.roomCollections.map((item) => ({
        ...item,
        href: `${storeBase}/products?category=${encodeURIComponent(item.slug)}`,
      })),
      products,
      canon
    ).slice(0, TILES_ROOM_TILE_TARGET);
  }

  const categoryRows = (ctx.categories || []).filter((c) => c?.name && c?.slug);
  const inventoryRooms = categoryRows
    .map((cat) => {
      const matches = products.filter((p) =>
        productMatchesTilesCategory(p, { slug: cat.slug, label: cat.name })
      );
      const image =
        pickTilesCategoryProductImage(products, { slug: cat.slug, label: cat.name }, canon) ||
        (isUsableTilesTileImage(cat.image_url) ? cat.image_url : '');
      return {
        id: String(cat.slug || cat.id),
        label: cat.name,
        slug: cat.slug,
        desc: matches.length ? `${matches.length} surfaces` : '',
        image,
        href: `${productsUrl}?category=${encodeURIComponent(cat.slug)}`,
        productCount: matches.length,
      };
    })
    .filter((room) => room.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount || a.label.localeCompare(b.label));

  let rooms = withTilesCategoryImages(inventoryRooms, products, canon);

  // If inventory category matching failed (sparse product meta), fall back to category list.
  if (rooms.length < 2) {
    rooms = withTilesCategoryImages(
      buildCategoryNavItems(ctx.categories, storeBase, {
        max: TILES_ROOM_TILE_TARGET,
        includeDeals: false,
      }).map((item) => ({
        id: item.id,
        label: item.label,
        slug: item.slug,
        desc: '',
        image: item.image,
        href: item.href,
      })),
      products,
      canon
    );
  }

  rooms = rooms.slice(0, TILES_ROOM_TILE_TARGET);

  const usedLabels = new Set(rooms.map((r) => String(r.label || '').toLowerCase()));
  const usedHrefs = new Set(rooms.map((r) => r.href));

  const pushUnique = (tile) => {
    if (rooms.length >= TILES_ROOM_TILE_TARGET) return;
    const label = String(tile.label || '').toLowerCase();
    if (!label || usedLabels.has(label)) return;
    if (usedHrefs.has(tile.href)) return;
    rooms.push(tile);
    usedLabels.add(label);
    usedHrefs.add(tile.href);
  };

  // Pad with Sale when inventory has discounted pieces.
  if (rooms.length < TILES_ROOM_TILE_TARGET && products.some(productHasSalePrice)) {
    const saleProduct = products.find(
      (p) =>
        productHasSalePrice(p) &&
        isUsableTilesTileImage(getEffectiveProductImageUrl(p, canon))
    );
    pushUnique({
      id: 'deals',
      label: 'Sale & offers',
      slug: '',
      desc: 'Limited-time savings',
      image:
        (saleProduct && getEffectiveProductImageUrl(saleProduct, canon)) ||
        resolveTilesCategoryFallbackImage({ id: 'deals', label: 'Deals' }),
      href: `${productsUrl}?onSale=true`,
    });
  }

  // Pad with curated room themes that still map to inventory products.
  if (rooms.length < TILES_ROOM_TILE_TARGET) {
    for (const demo of TILES_DEMO_ROOM_COLLECTIONS) {
      if (rooms.length >= TILES_ROOM_TILE_TARGET) break;
      const matches = filterProductsByCategorySlug(products, demo.slug);
      if (matches.length < 1) continue;
      const href = `${productsUrl}?category=${encodeURIComponent(demo.slug)}`;
      if (usedHrefs.has(href)) continue;
      const image =
        pickTilesCategoryProductImage(
          products,
          { slug: demo.slug, label: demo.label },
          canon
        ) || demo.image;
      pushUnique({
        id: demo.id,
        label: demo.label,
        slug: demo.slug,
        desc: demo.desc || '',
        image,
        href,
      });
    }
  }

  // Pad with inventory keyword collections (unique search hrefs) for a full 6-up grid.
  if (rooms.length < TILES_ROOM_TILE_TARGET) {
    const keywordPads = [
      { id: 'sofas', label: 'Sofas & lounges', search: 'sofa', desc: 'Sectionals & lounge sets' },
      { id: 'recliners', label: 'Recliners', search: 'recliner', desc: 'Power leather comfort' },
      { id: 'mattresses', label: 'Mattresses', search: 'mattress', desc: 'Hybrid & foam sleep' },
      { id: 'storage', label: 'Storage & beds', search: 'bed', desc: 'Beds & nightstands' },
    ];
    for (const pad of keywordPads) {
      if (rooms.length >= TILES_ROOM_TILE_TARGET) break;
      const hits = products.filter((p) =>
        new RegExp(`\\b${pad.search}\\b`, 'i').test(String(p.name || ''))
      );
      if (hits.length < 2) continue;
      const image =
        pickTilesCategoryProductImage(products, { label: pad.label }, canon) ||
        (isUsableTilesTileImage(getEffectiveProductImageUrl(hits[0], canon))
          ? getEffectiveProductImageUrl(hits[0], canon)
          : resolveTilesCategoryFallbackImage(pad));
      pushUnique({
        id: pad.id,
        label: pad.label,
        slug: '',
        desc: pad.desc,
        image,
        href: `${productsUrl}?search=${encodeURIComponent(pad.search)}`,
      });
    }
  }

  // Last resort: demo defaults (demo domains) or whatever inventory yielded.
  if (rooms.length < 2 && isDemoStoreDomain(ctx.businessDomain)) {
    rooms = withTilesCategoryImages(
      TILES_DEMO_ROOM_COLLECTIONS.map((item) => ({
        ...item,
        href: `${storeBase}/products?category=${encodeURIComponent(item.slug)}`,
      })),
      products,
      canon
    );
  }

  return withTilesCategoryImages(rooms, products, canon).slice(0, TILES_ROOM_TILE_TARGET);
}

export function resolveTilesCuratedTabs(settings = {}, categories = []) {
  const config = getTilesConfig(settings);
  if (config.curatedTabs) return config.curatedTabs;
  return buildCuratedTabsFromCategories(categories, TILES_DEFAULT_CURATED_TABS);
}

export function resolveTilesQuickSearchTerms(settings = {}, products = [], categories = [], businessDomain) {
  const config = getTilesConfig(settings, businessDomain);
  const terms = buildQuickSearchTerms(products, categories, config.quickSearchTerms);
  if (terms.length) return terms;
  return isDemoStoreDomain(businessDomain) ? TILES_DEMO_QUICK_SEARCH_TERMS : terms;
}

export function resolveTilesPromoBanners(settings = {}, products = [], businessDomain, businessCategory) {
  const config = getTilesConfig(settings, businessDomain);
  return buildPromoBannersFromCatalog(
    products,
    config.promoBanners,
    TILES_DEMO_PROMO_BANNERS,
    { isDemo: isDemoStoreDomain(businessDomain), businessCategory }
  ).map((b, i) => ({ ...b, tone: b.tone || (i % 2 === 0 ? 'walnut' : 'cream') }));
}

export function resolveTilesEditorialBanners(settings = {}, products = [], businessDomain, businessCategory) {
  const config = getTilesConfig(settings, businessDomain);
  if (config.editorialBanners) return config.editorialBanners;
  if (isDemoStoreDomain(businessDomain)) return TILES_DEMO_EDITORIAL_BANNERS;
  const pool = (products || []).filter((p) => p.image_url).slice(0, 3);
  return pool.map((p, i) => ({
    id: String(p.id || i),
    eyebrow: p.category_name || p.category || '',
    title: p.name,
    subtitle: p.description?.slice(0, 100) || '',
    image: p.image_url,
    href: `?search=${encodeURIComponent(String(p.name).split(/\s+/)[0])}`,
  }));
}

export function resolveTilesTrustPillars(settings = {}, businessDomain) {
  const config = getTilesConfig(settings, businessDomain);
  return config.trustPillars || TILES_DEFAULT_TRUST_PILLARS;
}

export function resolveTilesTestimonials(settings = {}, businessDomain) {
  const config = getTilesConfig(settings, businessDomain);
  if (config.testimonials) return config.testimonials;
  return isDemoStoreDomain(businessDomain) ? TILES_DEMO_TESTIMONIALS : [];
}

// Legacy exports
export const TILES_ROOM_COLLECTIONS = TILES_DEMO_ROOM_COLLECTIONS;
export const TILES_CATEGORY_ICONS = TILES_DEMO_CATEGORY_ICONS;
export const TILES_PROMO_BANNERS = TILES_DEMO_PROMO_BANNERS;
export const TILES_EDITORIAL_BANNERS = TILES_DEMO_EDITORIAL_BANNERS;
export const TILES_TRUST_PILLARS = TILES_DEFAULT_TRUST_PILLARS;
export const TILES_CURATED_TABS = TILES_DEFAULT_CURATED_TABS;
export const TILES_TESTIMONIALS = TILES_DEMO_TESTIMONIALS;


/**
 * Registration defaults for elevated tiles storefront settings.
 * @param {string} [canonical]
 */
export function buildDefaultTilesStorefrontSeed(canonical = 'ceramics-tiles') {
  if (!isTilesElevatedStore(canonical)) return {};
  return {
    tiles: {
      showRoomTiles: true,
      showShowroomCta: true,
      showMarketingBanners: true,
      showTestimonials: false,
      searchPlaceholder: 'Search floor tiles, wall tiles, marble, granite…',
      showroomLabel: 'Visit emporium',
      featuredRailTitle: 'Featured surfaces',
      featuredRailSubtitle: 'Porcelain collections and natural stone highlights',
    },
  };
}
