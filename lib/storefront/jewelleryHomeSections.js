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
import {
  resolveJewelleryCategoryCards,
  CATEGORY_IMAGE_FALLBACKS,
} from './jewelleryCategoryCards';

/** @typedef {{ id: string; label: string; href: string; image: string; productCount?: number }} CircleTile */

const DEFAULT_FALLBACK = CATEGORY_IMAGE_FALLBACKS.gold;

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
 * Owner tiles override catalog-derived mosaic (per-field merge via shared resolver).
 * @param {object} args
 */
function buildJewelleryEditSection({
  base,
  mode,
  categories,
  products,
  businessCategory,
  ownerTiles,
  title,
  subtitle,
}) {
  const tiles = resolveJewelleryCategoryCards({
    base,
    mode,
    surface: 'edit',
    categories,
    products,
    businessCategory,
    ownerTiles,
  });

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
