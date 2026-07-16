/**
 * Jewelry / Beauty homepage section builder — maps categories/products to luxury showcases.
 * Catalog-first: live inventory images and slugs; mode-aware defaults for gems-jewellery vs salon-spa.
 */
import { getEffectiveProductImageUrl } from './productImageFallback';
import {
  JEWELLERY_CATEGORY_CIRCLES,
  BEAUTY_CATEGORY_CIRCLES,
  getStoreMode,
  getJewelleryStorefrontConfig,
} from './jewelleryStorefront';

/** @typedef {{ id: string; label: string; href: string; image: string; productCount?: number }} CircleTile */

/** Unique fallback per category id — demo/empty catalog only */
const CATEGORY_IMAGE_FALLBACKS = {
  gold: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=75&auto=format&fit=crop',
  diamonds: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=75&auto=format&fit=crop',
  bridal: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&q=75&auto=format&fit=crop',
  earrings: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&q=75&auto=format&fit=crop',
  necklaces: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=75&auto=format&fit=crop',
  rings: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=75&auto=format&fit=crop',
  bracelets: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&q=75&auto=format&fit=crop',
  pearls: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&q=75&auto=format&fit=crop',
  silver: 'https://images.unsplash.com/photo-1589128777073-263566ae57e4?w=400&q=75&auto=format&fit=crop',
  gifts: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=75&auto=format&fit=crop',
  polish: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=75&auto=format&fit=crop',
  'press-on': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=75&auto=format&fit=crop',
  kits: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=75&auto=format&fit=crop',
  tools: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?w=400&q=75&auto=format&fit=crop',
  care: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=75&auto=format&fit=crop',
  lamps: 'https://images.unsplash.com/photo-1585232351009-aa97f53b2a5d?w=400&q=75&auto=format&fit=crop',
};

const DEFAULT_FALLBACK = CATEGORY_IMAGE_FALLBACKS.gold;

const JEWELLERY_EDIT_SLOT_DEFAULTS = [
  { slot: 'hero', ruleId: 'gold', eyebrow: 'Fine gold', title: 'Celebrate every occasion with hallmarked purity.', categorySlug: 'gold' },
  { slot: 'banner', ruleId: 'diamonds', eyebrow: 'Diamonds', title: 'Brilliance that lasts generations', categorySlug: 'diamonds' },
  { slot: 'half-left', ruleId: 'bridal', eyebrow: 'Bridal', categorySlug: 'bridal' },
  { slot: 'half-right', ruleId: 'gifts', eyebrow: 'Gifts', hrefSuffix: '?sort=featured' },
];

const BEAUTY_EDIT_SLOT_DEFAULTS = [
  { slot: 'hero', ruleId: 'polish', eyebrow: 'Polish & gel', title: 'Salon-finish colour with clean, 21-free formulas.', categorySlug: 'polish' },
  { slot: 'banner', ruleId: 'kits', eyebrow: 'Mani systems', title: 'Everything you need in one kit', categorySlug: 'kits' },
  { slot: 'half-left', ruleId: 'press-on', eyebrow: 'Press-ons', categorySlug: 'press-on' },
  { slot: 'half-right', ruleId: 'care', eyebrow: 'Care & serum', categorySlug: 'care' },
];

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

function haystack(product) {
  const dd = product.domain_data && typeof product.domain_data === 'object' ? product.domain_data : {};
  return [
    product.name,
    product.category,
    product.category_name,
    product.brand,
    product.description,
    dd.carat,
    dd.clarity,
    dd.cut,
    dd.certification,
    dd.hallmark,
    dd.finish,
    dd.ingredients,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function haystackCategory(cat) {
  return [cat.name, cat.slug, cat.description].filter(Boolean).join(' ').toLowerCase();
}

function productInCategory(product, cat) {
  if (product.category_id && cat.id && product.category_id === cat.id) return true;
  if (product.category_slug && cat.slug && product.category_slug === cat.slug) return true;
  const pCat = norm(product.category_name || product.category);
  const cName = norm(cat.name);
  const cSlug = norm(cat.slug);
  return pCat && (pCat === cName || pCat.replace(/\s+/g, '-') === cSlug);
}

function filterProductsByKeywords(products, keywords) {
  return products.filter((p) => keywords.some((k) => haystack(p).includes(k)));
}

function filterCategoriesByKeywords(categories, keywords) {
  return categories.filter((c) => keywords.some((k) => haystackCategory(c).includes(k)));
}

function categoryHref(base, cat) {
  return `${base}/products?category=${encodeURIComponent(cat.slug)}`;
}

function resolveHref(base, { categorySlug, hrefSuffix, search, ruleId }) {
  const products = `${base}/products`;
  if (categorySlug) return `${products}?category=${encodeURIComponent(categorySlug)}`;
  if (hrefSuffix) return `${products}${hrefSuffix.startsWith('?') ? hrefSuffix : `?${hrefSuffix}`}`;
  if (search) return `${products}?search=${encodeURIComponent(search)}`;
  if (ruleId) return `${products}?search=${encodeURIComponent(ruleId)}`;
  return products;
}

function resolveCategoryImage(ruleId, product, businessCategory, cat) {
  if (product) {
    return getEffectiveProductImageUrl(product, businessCategory) || CATEGORY_IMAGE_FALLBACKS[ruleId] || DEFAULT_FALLBACK;
  }
  return cat?.image_url || CATEGORY_IMAGE_FALLBACKS[ruleId] || DEFAULT_FALLBACK;
}

function pickCategoryCircle({
  base,
  rule,
  categories,
  products,
  businessCategory,
  usedCategoryIds,
}) {
  const matchedCats = filterCategoriesByKeywords(categories, rule.keywords)
    .filter((c) => !usedCategoryIds.has(c.id))
    .sort((a, b) => (Number(b.product_count) || 0) - (Number(a.product_count) || 0));

  if (matchedCats[0]) {
    const cat = matchedCats[0];
    usedCategoryIds.add(cat.id);
    const catProducts = products.filter((p) => productInCategory(p, cat));
    const imageProduct = catProducts[0];
    return {
      id: rule.id,
      label: rule.label,
      href: categoryHref(base, cat),
      image: resolveCategoryImage(rule.id, imageProduct, businessCategory, cat),
      productCount: Number(cat.product_count) || catProducts.length,
    };
  }

  const matchedProducts = filterProductsByKeywords(products, rule.keywords);
  if (!matchedProducts.length) return null;

  const best = matchedProducts[0];
  const slug = norm(best.category_name || best.category).replace(/\s+/g, '-');
  return {
    id: rule.id,
    label: rule.label,
    href: slug
      ? `${base}/products?category=${encodeURIComponent(slug)}`
      : `${base}/products?search=${encodeURIComponent(rule.keywords[0])}`,
    image: resolveCategoryImage(rule.id, best, businessCategory, null),
    productCount: matchedProducts.length,
  };
}

/**
 * Owner tiles override catalog-derived mosaic.
 * @param {object} args
 */
function buildJewelleryEditSection({
  base,
  mode,
  categories,
  products,
  businessCategory,
  categoryCircles,
  ownerTiles,
  title,
  subtitle,
}) {
  if (Array.isArray(ownerTiles) && ownerTiles.length) {
    const tiles = ownerTiles.map((tile) => ({
      id: tile.id || tile.slot || tile.eyebrow,
      slot: tile.slot || 'banner',
      eyebrow: tile.eyebrow || tile.label || '',
      title: tile.title || '',
      ctaLabel: tile.ctaLabel || 'EXPLORE',
      href: tile.href
        ? (String(tile.href).startsWith('/store/') || String(tile.href).startsWith('http')
          ? tile.href
          : `${base}${String(tile.href).startsWith('/') ? tile.href : `/${tile.href}`}`)
        : resolveHref(base, tile),
      image: tile.image || CATEGORY_IMAGE_FALLBACKS[tile.imageKey || tile.id] || DEFAULT_FALLBACK,
    }));
    return {
      title,
      subtitle,
      viewAllHref: `${base}/products`,
      show: tiles.length >= 2,
      tiles,
    };
  }

  const slotDefaults = mode === 'beauty' ? BEAUTY_EDIT_SLOT_DEFAULTS : JEWELLERY_EDIT_SLOT_DEFAULTS;
  const tiles = [];

  for (const slotDef of slotDefaults) {
    const circle = categoryCircles.find((c) => c.id === slotDef.ruleId);
    const matchedCat = slotDef.categorySlug
      ? categories.find((c) => norm(c.slug) === norm(slotDef.categorySlug))
      : null;
    const catProducts = matchedCat
      ? products.filter((p) => productInCategory(p, matchedCat))
      : filterProductsByKeywords(products, [slotDef.ruleId, ...(slotDef.categorySlug ? [slotDef.categorySlug] : [])]);
    const imageProduct = catProducts[0];

    tiles.push({
      id: slotDef.ruleId,
      slot: slotDef.slot,
      eyebrow: slotDef.eyebrow,
      title: slotDef.title,
      ctaLabel: 'EXPLORE',
      href: circle?.href || resolveHref(base, slotDef),
      image: circle?.image
        || resolveCategoryImage(slotDef.ruleId, imageProduct, businessCategory, matchedCat),
    });
  }

  return {
    title,
    subtitle,
    viewAllHref: mode === 'beauty' ? `${base}/products?category=polish` : `${base}/products?category=gold`,
    show: tiles.length >= 2,
    tiles,
  };
}

/**
 * Build jewelry / beauty homepage sections from live catalog.
 * @param {{
 *   businessDomain: string;
 *   businessCategory?: string;
 *   settings?: object;
 *   categories?: object[];
 *   products?: object[];
 *   newArrivalProducts?: object[];
 *   offerProducts?: object[];
 * }} args
 */
export function buildJewelleryHomeSections({
  businessDomain,
  businessCategory,
  settings = {},
  categories = [],
  products = [],
  newArrivalProducts = [],
  offerProducts = [],
}) {
  const base = `/store/${businessDomain}`;
  const mode = getStoreMode(businessCategory);
  const config = getJewelleryStorefrontConfig(settings, businessDomain, businessCategory);
  const circleRules = mode === 'beauty' ? BEAUTY_CATEGORY_CIRCLES : JEWELLERY_CATEGORY_CIRCLES;

  const usedCategoryIds = new Set();
  /** @type {CircleTile[]} */
  const categoryCircles = [];

  for (const rule of circleRules) {
    const tile = pickCategoryCircle({
      base,
      rule,
      categories,
      products,
      businessCategory,
      usedCategoryIds,
    });
    if (tile) categoryCircles.push(tile);
    if (categoryCircles.length >= 8) break;
  }

  if (categoryCircles.length < 4 && categories.length) {
    const seenIds = new Set(categoryCircles.map((c) => c.id));
    const topCats = [...categories]
      .filter((c) => !seenIds.has(c.id))
      .sort((a, b) => (Number(b.product_count) || 0) - (Number(a.product_count) || 0))
      .slice(0, 8);

    for (const cat of topCats) {
      if (seenIds.has(cat.id || cat.slug)) continue;
      const catProducts = products.filter((p) => productInCategory(p, cat));
      if (!catProducts.length) continue;

      categoryCircles.push({
        id: cat.slug,
        label: String(cat.name || (mode === 'beauty' ? 'Beauty' : 'Jewelry')).toUpperCase(),
        href: categoryHref(base, cat),
        image:
          getEffectiveProductImageUrl(catProducts[0], businessCategory) ||
          cat.image_url ||
          CATEGORY_IMAGE_FALLBACKS[cat.slug] ||
          DEFAULT_FALLBACK,
        productCount: Number(cat.product_count) || catProducts.length,
      });
      seenIds.add(cat.id || cat.slug);
      if (categoryCircles.length >= 8) break;
    }
  }

  const newArrivals = [...newArrivalProducts]
    .sort((a, b) => {
      if (a.is_new && !b.is_new) return -1;
      if (!a.is_new && b.is_new) return 1;
      return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    })
    .slice(0, 16);

  const offers = [...offerProducts]
    .filter((p) => {
      const price = Number(p.price) || 0;
      const compare = Number(p.compare_price) || 0;
      return compare > price && price > 0;
    })
    .sort((a, b) => {
      const da = (Number(a.compare_price) - Number(a.price)) / (Number(a.compare_price) || 1);
      const db = (Number(b.compare_price) - Number(b.price)) / (Number(b.compare_price) || 1);
      return db - da;
    })
    .slice(0, 16);

  const signaturePriceFloor = mode === 'beauty' ? 1500 : 100000;
  const signaturePieces = [...products]
    .filter((p) => p.is_featured || Number(p.price) >= signaturePriceFloor)
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (Number(b.price) || 0) - (Number(a.price) || 0);
    })
    .slice(0, 8);

  const jewelleryEdit = buildJewelleryEditSection({
    base,
    mode,
    categories,
    products,
    businessCategory,
    categoryCircles,
    ownerTiles: config.jewelleryEditTiles,
    title: config.jewelleryEditTitle,
    subtitle: config.jewelleryEditSubtitle,
  });

  return {
    categories: {
      title: config.categoriesTitle,
      circles: categoryCircles,
      show: categoryCircles.length >= 4,
      viewAllHref: `${base}/products`,
    },
    signaturePieces: {
      title: config.signaturePiecesTitle.toUpperCase(),
      subtitle: config.signaturePiecesSubtitle,
      products: signaturePieces,
      show: signaturePieces.length >= 2,
      viewAllHref: `${base}/products?sort=featured`,
    },
    jewelleryEdit,
    offers: {
      title: config.offersTitle,
      products: offers,
      catalogPool: offers.length ? offers : products,
      show: offers.length >= 1 || products.length >= 2,
      viewAllHref: `${base}/products?onSale=true`,
    },
    newArrivals: {
      title: config.newArrivalsTitle,
      products: newArrivals,
      catalogPool: products,
      show: newArrivals.length >= 1 || products.length >= 2,
      viewAllHref: `${base}/products?sort=newest`,
    },
    productsCarousel: {
      title: config.productsCarouselTitle,
      subtitle: config.productsCarouselSubtitle,
      products: signaturePieces.length >= 2 ? signaturePieces : products.slice(0, 12),
      show: config.showProductsCarousel && products.length >= 2,
      scrollSpeed: config.carouselScrollSpeed,
    },
  };
}
