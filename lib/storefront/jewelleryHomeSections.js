/**
 * Jewelry homepage section builder — maps categories/products to luxury showcases.
 * Gold, Diamonds, Bridal, category circles, signature pieces, new arrivals.
 */
import { getEffectiveProductImageUrl } from './productImageFallback';
import { JEWELLERY_CATEGORY_CIRCLES } from './jewelleryStorefront';

/** @typedef {{ id: string; label: string; href: string; image: string; productCount?: number }} CategoryTile */
/** @typedef {{ id: string; label: string; href: string; image: string }} CircleTile */

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
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function haystackCategory(cat) {
  return [cat.name, cat.slug, cat.description].filter(Boolean).join(' ').toLowerCase();
}

/**
 * @param {object} product
 * @param {object} cat
 */
function productInCategory(product, cat) {
  if (product.category_id && cat.id && product.category_id === cat.id) return true;
  if (product.category_slug && cat.slug && product.category_slug === cat.slug) return true;
  const pCat = norm(product.category_name || product.category);
  const cName = norm(cat.name);
  const cSlug = norm(cat.slug);
  return pCat && (pCat === cName || pCat.replace(/\s+/g, '-') === cSlug);
}

/**
 * @param {object[]} products
 * @param {string[]} keywords
 */
function filterProductsByKeywords(products, keywords) {
  return products.filter((p) => keywords.some((k) => haystack(p).includes(k)));
}

/**
 * @param {object[]} categories
 * @param {string[]} keywords
 */
function filterCategoriesByKeywords(categories, keywords) {
  return categories.filter((c) => keywords.some((k) => haystackCategory(c).includes(k)));
}

/**
 * @param {string} base
 * @param {object} cat
 */
function categoryHref(base, cat) {
  return `${base}/products?category=${encodeURIComponent(cat.slug)}`;
}

/**
 * @param {object} args
 */
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
      image: imageProduct
        ? getEffectiveProductImageUrl(imageProduct, businessCategory)
        : cat.image_url || `https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80`,
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
    image: getEffectiveProductImageUrl(best, businessCategory),
    productCount: matchedProducts.length,
  };
}

/**
 * Build jewelry homepage sections from live catalog.
 * @param {{
 *   businessDomain: string;
 *   businessCategory?: string;
 *   categories?: object[];
 *   products?: object[];
 *   newArrivalProducts?: object[];
 *   offerProducts?: object[];
 * }} args
 */
export function buildJewelleryHomeSections({
  businessDomain,
  businessCategory,
  categories = [],
  products = [],
  newArrivalProducts = [],
  offerProducts = [],
}) {
  const base = `/store/${businessDomain}`;

  const usedCategoryIds = new Set();
  /** @type {CircleTile[]} */
  const categoryCircles = [];

  for (const rule of JEWELLERY_CATEGORY_CIRCLES) {
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

  // Fallback: top categories by product count
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
        label: String(cat.name || 'Jewelry').toUpperCase(),
        href: categoryHref(base, cat),
        image:
          getEffectiveProductImageUrl(catProducts[0], businessCategory) ||
          cat.image_url ||
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80',
        productCount: Number(cat.product_count) || catProducts.length,
      });
      seenIds.add(cat.id || cat.slug);
      if (categoryCircles.length >= 8) break;
    }
  }

  // New arrivals: newest first
  const newArrivals = [...newArrivalProducts]
    .sort((a, b) => {
      if (a.is_new && !b.is_new) return -1;
      if (!a.is_new && b.is_new) return 1;
      return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    })
    .slice(0, 16);

  // Offers: biggest markdown first
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

  // Signature pieces: featured + highest price
  const signaturePieces = [...products]
    .filter((p) => p.is_featured || Number(p.price) >= 100000)
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (Number(b.price) || 0) - (Number(a.price) || 0);
    })
    .slice(0, 8);

  return {
    categories: {
      title: 'SHOP BY CATEGORY',
      circles: categoryCircles,
      show: categoryCircles.length >= 4,
      viewAllHref: `${base}/products`,
    },
    signaturePieces: {
      title: 'SIGNATURE PIECES',
      subtitle: 'Handcrafted excellence',
      products: signaturePieces,
      show: signaturePieces.length >= 2,
      viewAllHref: `${base}/products?sort=featured`,
    },
    offers: {
      title: 'SPECIAL OFFERS',
      products: offers,
      catalogPool: offers.length ? offers : products,
      show: offers.length >= 1 || products.length >= 2,
      viewAllHref: `${base}/products?onSale=true`,
    },
    newArrivals: {
      title: 'NEW ARRIVALS',
      products: newArrivals,
      catalogPool: products,
      show: newArrivals.length >= 1 || products.length >= 2,
      viewAllHref: `${base}/products?sort=newest`,
    },
  };
}
