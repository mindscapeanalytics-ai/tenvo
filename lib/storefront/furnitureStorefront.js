/**
 * Woodin elevated furniture storefront — tenant-aware with demo-only COMFY defaults.
 * Isolated to canonical `furniture` vertical.
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


export const FURNITURE_ELEVATED_CANONICALS = new Set(['furniture']);

export const WOODIN_WALNUT = '#78350f';
export const WOODIN_WALNUT_DARK = '#451a03';
export const WOODIN_WALNUT_LIGHT = '#fffbeb';
export const WOODIN_CREAM = '#faf7f2';

export const FURNITURE_ACCENTS = {
  accent: WOODIN_WALNUT,
  accentDark: WOODIN_WALNUT_DARK,
  accentLight: WOODIN_WALNUT_LIGHT,
};

/**
 * @param {string | null | undefined} category
 */
export function isFurnitureElevatedStore(category) {
  return FURNITURE_ELEVATED_CANONICALS.has(resolveDomainKey(category));
}

/**
 * Public-facing store name (strips legacy "Demo" suffix).
 * @param {string | null | undefined} name
 */
export function formatFurnitureStoreName(name) {
  return formatElevatedStoreName(name, 'Our furniture store');
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 */
export function getFurnitureConfig(settings = {}, businessDomain) {
  const raw = settings?.storefront?.furniture || {};
  const isDemo = isDemoStoreDomain(businessDomain);
  return {
    locationLabel: raw.locationLabel || 'Deliver to',
    defaultLocation: raw.defaultLocation || '',
    searchPlaceholder: raw.searchPlaceholder || 'Search sofas, beds, dining sets, tables…',
    showroomLabel: raw.showroomLabel || 'Visit showroom',
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

export const FURNITURE_DEMO_QUICK_SEARCH_TERMS = ['Sofa', 'King Bed', 'Dining Set', 'Coffee Table', 'Recliner'];
/** @deprecated use resolveFurnitureQuickSearchTerms */
export const FURNITURE_QUICK_SEARCH_TERMS = [];

/**
 * @param {string} base `/store/{domain}`
 */
export function getFurnitureNavLinks(base, categories = []) {
  const fromDb = buildCategoryNavItems(categories, base, { max: 6, includeDeals: true });
  if (fromDb.length) {
    return fromDb.map((item) => ({ id: item.id, label: item.label, href: item.href }));
  }
  const products = `${base}/products`;
  return [
    { id: 'all', label: 'All furniture', href: products },
    { id: 'sale', label: 'Sale', href: `${products}?onSale=true` },
    { id: 'contact', label: 'Visit showroom', href: `${base}/contact` },
  ];
}

/** Demo-only room collections (Unsplash furniture). */
export const FURNITURE_DEMO_ROOM_COLLECTIONS = [
  {
    id: 'living',
    label: 'Living Room',
    slug: 'living-room',
    desc: 'Sofas, chairs & tables',
    image: 'https://comfy.sg/cdn/shop/collections/steel-grey-leather-sofa-set.jpg?width=800',
  },
  {
    id: 'bedroom',
    label: 'Bedroom',
    slug: 'bedroom-furniture',
    desc: 'Beds & nightstands',
    image: 'https://comfy.sg/cdn/shop/collections/grey-queen-size-bed-frame-bed-room.jpg?width=800',
  },
  {
    id: 'dining',
    label: 'Dining Room',
    slug: 'dining-room',
    desc: 'Tables & chair sets',
    image: 'https://comfy.sg/cdn/shop/collections/modern-white-marble-dining-table-set.jpg?width=800',
  },
  {
    id: 'recliners',
    label: 'Recliner Sofas',
    slug: 'living-room',
    desc: 'Power leather recliners',
    image: 'https://comfy.sg/cdn/shop/collections/grey-leather-recliner-sofa-with-usb-ports.jpg?width=800',
  },
  {
    id: 'sectional',
    label: 'Sectional Sofas',
    slug: 'living-room',
    desc: 'L-shape & modular',
    image: 'https://comfy.sg/cdn/shop/collections/sectional-sofa.jpg?width=800',
  },
  {
    id: 'kids',
    label: 'Kids',
    slug: 'kids-furniture',
    desc: 'Study & bedroom',
    image: 'https://comfy.sg/cdn/shop/collections/kids-furniture-singapore.jpg?width=800',
  },
];

/** Demo-only category icons. */
export const FURNITURE_DEMO_CATEGORY_ICONS = [
  { id: 'sofas', label: 'Sofas', slug: 'living-room', image: 'https://comfy.sg/cdn/shop/collections/dark-blue-3-seater-full-grain-leather-sofa.jpg?width=200' },
  { id: 'beds', label: 'Beds', slug: 'bedroom-furniture', image: 'https://comfy.sg/cdn/shop/collections/grey-queen-size-bed-frame-bed-room.jpg?width=200' },
  { id: 'dining', label: 'Dining', slug: 'dining-room', image: 'https://comfy.sg/cdn/shop/collections/modern-white-marble-dining-table-set.jpg?width=200' },
  { id: 'recliners', label: 'Recliners', slug: 'living-room', image: 'https://comfy.sg/cdn/shop/files/irene-electric-recliner-sofa.jpg?width=200' },
  { id: 'sectional', label: 'Sectionals', slug: 'living-room', image: 'https://comfy.sg/cdn/shop/collections/sectional-sofa.jpg?width=200' },
  { id: 'mattress', label: 'Mattresses', slug: 'bedroom-furniture', image: 'https://comfy.sg/cdn/shop/files/comfy-sleepperfect-hybrid-mattress.webp?width=200' },
  { id: 'coffee', label: 'Coffee Tables', slug: 'coffee-tables', image: 'https://comfy.sg/cdn/shop/files/elliot-coffee-marble-table.jpg?width=200' },
  { id: 'kids', label: 'Kids', slug: 'kids-furniture', image: 'https://comfy.sg/cdn/shop/collections/kids-furniture-singapore.jpg?width=200' },
  { id: 'outdoor', label: 'Outdoor', slug: 'living-room', image: 'https://comfy.sg/cdn/shop/collections/steel-grey-leather-sofa-set.jpg?width=200' },
  { id: 'sale', label: 'Sale', slug: '', hrefSuffix: '?onSale=true', image: 'https://api.fantasticfurniture.com.au/medias/Bridge-Table.png' },
];

/**
 * Slug / label → curated demo image when catalog enrichment finds nothing.
 * Keeps Bedroom / Deals / empty categories from showing "IMA" placeholders.
 * @param {{ id?: string; slug?: string; label?: string }} item
 */
export function resolveFurnitureCategoryFallbackImage(item = {}) {
  const slug = String(item.slug || item.id || '').toLowerCase().trim();
  const label = String(item.label || '').toLowerCase().trim();
  const haystack = `${slug} ${label}`;

  const bySlug = FURNITURE_DEMO_CATEGORY_ICONS.find(
    (demo) => demo.slug && slug && demo.slug === slug
  );
  if (bySlug?.image) return bySlug.image;

  if (
    slug === 'deals' ||
    item.id === 'deals' ||
    /\b(deal|sale|offer)\b/.test(haystack)
  ) {
    const sale = FURNITURE_DEMO_CATEGORY_ICONS.find((d) => d.id === 'sale');
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
      const demo = FURNITURE_DEMO_CATEGORY_ICONS.find((d) => d.id === demoId);
      if (demo?.image) return demo.image;
    }
  }

  return getFallbackProductImageUrl(
    { name: item.label || item.slug || 'furniture', id: item.id || item.slug },
    'furniture'
  );
}

/**
 * Room / category tile images must be real product photography, not monograms or dead hosts.
 * @param {string | null | undefined} url
 */
function isUsableFurnitureTileImage(url) {
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
function productMatchesFurnitureCategory(product, item) {
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
function pickFurnitureCategoryProductImage(products, item, businessCategory) {
  const matches = (products || []).filter((p) => productMatchesFurnitureCategory(p, item));
  const scored = matches
    .map((p) => {
      const image = getEffectiveProductImageUrl(p, businessCategory || 'furniture');
      return {
        image,
        usable: isUsableFurnitureTileImage(image),
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
function withFurnitureCategoryImages(items, products, businessCategory) {
  const canon = businessCategory || 'furniture';
  return (items || []).map((item) => {
    // Prefer live inventory photography over category.image_url (often empty/broken).
    const fromInventory = pickFurnitureCategoryProductImage(products, item, canon);
    if (fromInventory) return { ...item, image: fromInventory };

    if (isUsableFurnitureTileImage(item.image)) return item;

    const enriched = enrichCategoryNavImages([{ ...item, image: '' }], products, canon)[0];
    if (isUsableFurnitureTileImage(enriched?.image)) {
      return { ...item, image: enriched.image };
    }

    return { ...item, image: resolveFurnitureCategoryFallbackImage(item) };
  });
}

const FURNITURE_ROOM_TILE_TARGET = 6;

const FURNITURE_DEMO_HERO_SLIDES = [
  {
    eyebrow: '{storeName} · Modern living',
    title: 'Sofas designed for modern homes',
    subtitle: 'Power recliners, sectionals, and leather sofas with free assembly on qualifying orders.',
    image: 'https://comfy.sg/cdn/shop/files/comfy-sofa-singapore.webp?width=1920',
    ctaLabel: 'Shop sofas',
    ctaHref: '/products?category=living-room',
  },
  {
    eyebrow: 'Up to 35% off',
    title: 'Dining & bedroom collections',
    subtitle: 'Dining sets, storage beds, and mattresses with nationwide delivery.',
    image: 'https://comfy.sg/cdn/shop/files/best-selling-sintered-stone-dining-table-set.webp?width=1920',
    ctaLabel: 'View sale',
    ctaHref: '/products?onSale=true',
  },
  {
    eyebrow: 'Visit our showroom',
    title: 'See, touch, and test before you buy',
    subtitle: 'Expert styling advice, fabric swatches, and custom sizing available in-store.',
    image: 'https://comfy.sg/cdn/shop/files/comfy-singapore-showrooms.webp?width=1920',
    ctaLabel: 'Book a visit',
    ctaHref: '/contact',
  },
];

/** Marketing / homepage gallery hero — same asset as `/store/demo-furniture` slide 0 */
export const FURNITURE_MARKETING_HERO_IMAGE = FURNITURE_DEMO_HERO_SLIDES[0]?.image || '';

/**
 * @param {string} base
 * @param {object} [settings]
 * @param {{ storeName?: string; businessDomain?: string; businessDescription?: string; coverImage?: string | null; products?: object[] }} [ctx]
 */
export function getFurnitureHeroSlides(base, settings = {}, ctx = {}) {
  const config = getFurnitureConfig(settings, ctx.businessDomain);
  const storeName = ctx.storeName || formatFurnitureStoreName('');
  const featured = (ctx.products || []).filter((p) => p.is_featured && p.image_url);

  return buildTenantHeroSlides({
    settings,
    settingsSlides: config.heroSlides,
    base,
    storeName,
    businessDescription: ctx.businessDescription,
    coverImage: ctx.coverImage,
    demoSlides: FURNITURE_DEMO_HERO_SLIDES,
    isDemo: isDemoStoreDomain(ctx.businessDomain),
    featuredProducts: featured.length ? featured : (ctx.products || []).filter((p) => p.image_url).slice(0, 4),
  });
}

/** Demo-only promo banners. */
export const FURNITURE_DEMO_PROMO_BANNERS = [
  {
    id: 'sofas',
    title: 'Recliner & Sectional Sofas',
    subtitle: 'Power recliners, L-shapes, and leather sets',
    image: 'https://comfy.sg/cdn/shop/collections/grey-leather-recliner-sofa-with-usb-ports.jpg?width=900',
    href: '?category=living-room',
    tone: 'walnut',
  },
  {
    id: 'dining',
    title: 'Sintered Stone Dining',
    subtitle: 'Scratch-resistant tables with chair sets',
    image: 'https://comfy.sg/cdn/shop/files/sintered-stone-dining-table-and-chairs.jpg?width=900',
    href: '?category=dining-room',
    tone: 'cream',
  },
  {
    id: 'beds',
    title: 'Bedroom & Mattresses',
    subtitle: 'Bed frames, bedside tables, and hybrid mattresses',
    image: 'https://comfy.sg/cdn/shop/collections/grey-queen-size-bed-frame-bed-room.jpg?width=900',
    href: '?category=bedroom-furniture',
    tone: 'walnut',
  },
  {
    id: 'value',
    title: 'Best value picks',
    subtitle: 'Dining tables, sofas, and mattresses on offer',
    image: 'https://api.fantasticfurniture.com.au/medias/SOF-NICO-LGY-ABC-07-1-1.png',
    href: '?onSale=true',
    tone: 'cream',
  },
];

/** Demo-only editorial banners. */
export const FURNITURE_DEMO_EDITORIAL_BANNERS = [
  {
    id: 'leather',
    eyebrow: 'Top grain leather',
    title: 'Leather recliner sofas',
    subtitle: 'Semi-aniline leather with power recline. Classic and modern silhouettes in multiple colours.',
    image: 'https://comfy.sg/cdn/shop/files/semi-aniline-leather-recliner-sofa-top-grain.webp?width=1200',
    href: '?category=living-room',
  },
  {
    id: 'mattress',
    eyebrow: 'Sleep collection',
    title: 'Mattresses designed for comfort',
    subtitle: 'Cooling hybrid layers and medium-firm support for restful nights.',
    image: 'https://comfy.sg/cdn/shop/files/comfy-sleepperfect-hybrid-mattress.webp?width=1200',
    href: '?category=bedroom-furniture',
  },
  {
    id: 'dining-chairs',
    eyebrow: 'Dining chairs',
    subtitle: 'Seat your guests in style with upholstered and cane-back designs.',
    title: 'Dining chairs & benches',
    image: 'https://comfy.sg/cdn/shop/files/stylish-dining-chair-set-dual-color.webp?width=1200',
    href: '?category=dining-room',
  },
];

export const FURNITURE_DEFAULT_TRUST_PILLARS = [
  { id: 'delivery', label: 'Delivery & assembly', desc: 'On qualifying orders' },
  { id: 'custom', label: 'Customisation options', desc: 'Fabrics, sizes, and finishes' },
  { id: 'warranty', label: 'Peace of mind promise', desc: 'Simple returns and warranty' },
  { id: 'homes', label: 'Made for modern homes', desc: 'Smart scale for any space' },
];

export const FURNITURE_DEFAULT_CURATED_TABS = [{ id: 'all', label: 'All items', slug: '' }];

/** Demo-only testimonials. */
export const FURNITURE_DEMO_TESTIMONIALS = [
  {
    id: '1',
    quote: 'The Irene sofa was a clear winner the moment we sat on it. Knowledgeable staff, non-pushy service, and fuss-free delivery.',
    product: 'Cloud Fiber Sofa',
    author: 'Google Review',
  },
  {
    id: '2',
    quote: 'Excellent quality and great customer service. We found a dining set in stock and had it delivered within the week.',
    product: 'Royal Cane Luxe Dining',
    author: 'Google Review',
  },
  {
    id: '3',
    quote: 'Love the buttery soft leather and sophisticated recliner features. The purchasing process was straightforward.',
    product: 'Lowe L-Shaped Sofa',
    author: 'Google Review',
  },
  {
    id: '4',
    quote: 'Delivery and installation were done professionally. Quality arrived in immaculate condition.',
    product: 'Ondina Bed',
    author: 'Google Review',
  },
];

function productComparePrice(p) {
  return p?.compare_price ?? p?.compare_at_price;
}

/**
 * Partition catalog into homepage rails.
 * @param {object[]} products
 */
export function partitionFurnitureProducts(products = []) {
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

export function filterFurnitureByCategorySlug(products = [], slug) {
  return filterProductsByCategorySlug(products, slug);
}

/**
 * @param {object} [settings]
 * @param {string} base
 */
export function resolveFurnitureCategoryIcons(settings, storeBase, ctx = {}) {
  const config = getFurnitureConfig(settings, ctx.businessDomain);
  const productsUrl = `${storeBase}/products`;
  const mapHref = (item) => ({
    ...item,
    href:
      item.href ||
      `${productsUrl}${item.hrefSuffix || (item.slug ? `?category=${encodeURIComponent(item.slug)}` : '')}`,
  });

  if (config.categoryIcons) {
    return withFurnitureCategoryImages(
      config.categoryIcons.map(mapHref),
      ctx.products,
      ctx.businessCategory
    );
  }

  const fromDb = withFurnitureCategoryImages(
    buildCategoryNavItems(ctx.categories, storeBase, { max: 10, includeDeals: true }).filter(
      (c) => c.label
    ),
    ctx.products,
    ctx.businessCategory
  );

  if (fromDb.length >= 2) return fromDb;

  if (isDemoStoreDomain(ctx.businessDomain)) {
    return withFurnitureCategoryImages(
      FURNITURE_DEMO_CATEGORY_ICONS.map(mapHref),
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
export function resolveFurnitureRoomCollections(settings, storeBase, ctx = {}) {
  const config = getFurnitureConfig(settings, ctx.businessDomain);
  const products = ctx.products || [];
  const productsUrl = `${storeBase}/products`;
  const canon = ctx.businessCategory || 'furniture';

  if (config.roomCollections) {
    return withFurnitureCategoryImages(
      config.roomCollections.map((item) => ({
        ...item,
        href: `${storeBase}/products?category=${encodeURIComponent(item.slug)}`,
      })),
      products,
      canon
    ).slice(0, FURNITURE_ROOM_TILE_TARGET);
  }

  const categoryRows = (ctx.categories || []).filter((c) => c?.name && c?.slug);
  const inventoryRooms = categoryRows
    .map((cat) => {
      const matches = products.filter((p) =>
        productMatchesFurnitureCategory(p, { slug: cat.slug, label: cat.name })
      );
      const image =
        pickFurnitureCategoryProductImage(products, { slug: cat.slug, label: cat.name }, canon) ||
        (isUsableFurnitureTileImage(cat.image_url) ? cat.image_url : '');
      return {
        id: String(cat.slug || cat.id),
        label: cat.name,
        slug: cat.slug,
        desc: matches.length ? `${matches.length} pieces` : '',
        image,
        href: `${productsUrl}?category=${encodeURIComponent(cat.slug)}`,
        productCount: matches.length,
      };
    })
    .filter((room) => room.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount || a.label.localeCompare(b.label));

  let rooms = withFurnitureCategoryImages(inventoryRooms, products, canon);

  // If inventory category matching failed (sparse product meta), fall back to category list.
  if (rooms.length < 2) {
    rooms = withFurnitureCategoryImages(
      buildCategoryNavItems(ctx.categories, storeBase, {
        max: FURNITURE_ROOM_TILE_TARGET,
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

  rooms = rooms.slice(0, FURNITURE_ROOM_TILE_TARGET);

  const usedLabels = new Set(rooms.map((r) => String(r.label || '').toLowerCase()));
  const usedHrefs = new Set(rooms.map((r) => r.href));

  const pushUnique = (tile) => {
    if (rooms.length >= FURNITURE_ROOM_TILE_TARGET) return;
    const label = String(tile.label || '').toLowerCase();
    if (!label || usedLabels.has(label)) return;
    if (usedHrefs.has(tile.href)) return;
    rooms.push(tile);
    usedLabels.add(label);
    usedHrefs.add(tile.href);
  };

  // Pad with Sale when inventory has discounted pieces.
  if (rooms.length < FURNITURE_ROOM_TILE_TARGET && products.some(productHasSalePrice)) {
    const saleProduct = products.find(
      (p) =>
        productHasSalePrice(p) &&
        isUsableFurnitureTileImage(getEffectiveProductImageUrl(p, canon))
    );
    pushUnique({
      id: 'deals',
      label: 'Sale & offers',
      slug: '',
      desc: 'Limited-time savings',
      image:
        (saleProduct && getEffectiveProductImageUrl(saleProduct, canon)) ||
        resolveFurnitureCategoryFallbackImage({ id: 'deals', label: 'Deals' }),
      href: `${productsUrl}?onSale=true`,
    });
  }

  // Pad with curated room themes that still map to inventory products.
  if (rooms.length < FURNITURE_ROOM_TILE_TARGET) {
    for (const demo of FURNITURE_DEMO_ROOM_COLLECTIONS) {
      if (rooms.length >= FURNITURE_ROOM_TILE_TARGET) break;
      const matches = filterProductsByCategorySlug(products, demo.slug);
      if (matches.length < 1) continue;
      const href = `${productsUrl}?category=${encodeURIComponent(demo.slug)}`;
      if (usedHrefs.has(href)) continue;
      const image =
        pickFurnitureCategoryProductImage(
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
  if (rooms.length < FURNITURE_ROOM_TILE_TARGET) {
    const keywordPads = [
      { id: 'sofas', label: 'Sofas & lounges', search: 'sofa', desc: 'Sectionals & lounge sets' },
      { id: 'recliners', label: 'Recliners', search: 'recliner', desc: 'Power leather comfort' },
      { id: 'mattresses', label: 'Mattresses', search: 'mattress', desc: 'Hybrid & foam sleep' },
      { id: 'storage', label: 'Storage & beds', search: 'bed', desc: 'Beds & nightstands' },
    ];
    for (const pad of keywordPads) {
      if (rooms.length >= FURNITURE_ROOM_TILE_TARGET) break;
      const hits = products.filter((p) =>
        new RegExp(`\\b${pad.search}\\b`, 'i').test(String(p.name || ''))
      );
      if (hits.length < 2) continue;
      const image =
        pickFurnitureCategoryProductImage(products, { label: pad.label }, canon) ||
        (isUsableFurnitureTileImage(getEffectiveProductImageUrl(hits[0], canon))
          ? getEffectiveProductImageUrl(hits[0], canon)
          : resolveFurnitureCategoryFallbackImage(pad));
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
    rooms = withFurnitureCategoryImages(
      FURNITURE_DEMO_ROOM_COLLECTIONS.map((item) => ({
        ...item,
        href: `${storeBase}/products?category=${encodeURIComponent(item.slug)}`,
      })),
      products,
      canon
    );
  }

  return withFurnitureCategoryImages(rooms, products, canon).slice(0, FURNITURE_ROOM_TILE_TARGET);
}

export function resolveFurnitureCuratedTabs(settings = {}, categories = []) {
  const config = getFurnitureConfig(settings);
  if (config.curatedTabs) return config.curatedTabs;
  return buildCuratedTabsFromCategories(categories, FURNITURE_DEFAULT_CURATED_TABS);
}

export function resolveFurnitureQuickSearchTerms(settings = {}, products = [], categories = [], businessDomain) {
  const config = getFurnitureConfig(settings, businessDomain);
  const terms = buildQuickSearchTerms(products, categories, config.quickSearchTerms);
  if (terms.length) return terms;
  return isDemoStoreDomain(businessDomain) ? FURNITURE_DEMO_QUICK_SEARCH_TERMS : terms;
}

export function resolveFurniturePromoBanners(settings = {}, products = [], businessDomain, businessCategory) {
  const config = getFurnitureConfig(settings, businessDomain);
  return buildPromoBannersFromCatalog(
    products,
    config.promoBanners,
    FURNITURE_DEMO_PROMO_BANNERS,
    { isDemo: isDemoStoreDomain(businessDomain), businessCategory }
  ).map((b, i) => ({ ...b, tone: b.tone || (i % 2 === 0 ? 'walnut' : 'cream') }));
}

export function resolveFurnitureEditorialBanners(settings = {}, products = [], businessDomain, businessCategory) {
  const config = getFurnitureConfig(settings, businessDomain);
  if (config.editorialBanners) return config.editorialBanners;
  if (isDemoStoreDomain(businessDomain)) return FURNITURE_DEMO_EDITORIAL_BANNERS;
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

export function resolveFurnitureTrustPillars(settings = {}, businessDomain) {
  const config = getFurnitureConfig(settings, businessDomain);
  return config.trustPillars || FURNITURE_DEFAULT_TRUST_PILLARS;
}

export function resolveFurnitureTestimonials(settings = {}, businessDomain) {
  const config = getFurnitureConfig(settings, businessDomain);
  if (config.testimonials) return config.testimonials;
  return isDemoStoreDomain(businessDomain) ? FURNITURE_DEMO_TESTIMONIALS : [];
}

// Legacy exports
export const FURNITURE_ROOM_COLLECTIONS = FURNITURE_DEMO_ROOM_COLLECTIONS;
export const FURNITURE_CATEGORY_ICONS = FURNITURE_DEMO_CATEGORY_ICONS;
export const FURNITURE_PROMO_BANNERS = FURNITURE_DEMO_PROMO_BANNERS;
export const FURNITURE_EDITORIAL_BANNERS = FURNITURE_DEMO_EDITORIAL_BANNERS;
export const FURNITURE_TRUST_PILLARS = FURNITURE_DEFAULT_TRUST_PILLARS;
export const FURNITURE_CURATED_TABS = FURNITURE_DEFAULT_CURATED_TABS;
export const FURNITURE_TESTIMONIALS = FURNITURE_DEMO_TESTIMONIALS;
