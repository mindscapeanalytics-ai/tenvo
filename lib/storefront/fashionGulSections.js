/**
 * Gul Ahmed–style homepage section resolvers (The Home Edit + Sale mosaic).
 */
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { getLuxuryFashionVariant } from '@/lib/storefront/luxuryFashion';
import { isDemoStoreDomain } from '@/lib/storefront/elevatedStorefrontTenant';
import { getEffectiveProductImageUrl } from '@/lib/storefront/productImageFallback';
import { FASHION_EDITORIAL_CANONICALS } from '@/lib/storefront/fashionEditorial';
import { getDefaultFashionGulSections } from '@/lib/dataLab/fashionGulAhmedSections';

/** Verticals that receive Gul Ahmed–style Home Edit + Sale mosaic sections. */
export const FASHION_GUL_SECTIONS_CANONICALS = new Set([
  ...FASHION_EDITORIAL_CANONICALS,
  'gems-jewellery',
]);

/** Five-column mosaic layout: 1 + 2 + 1 + 2 + 1 tiles. */
const SALE_MOSAIC_COLUMN_PATTERN = [1, 2, 1, 2, 1];

/**
 * @param {string | null | undefined} category
 */
export function supportsFashionGulSections(category) {
  return FASHION_GUL_SECTIONS_CANONICALS.has(resolveDomainKey(category));
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} [businessDomain]
 * @param {string | null | undefined} [businessCategory]
 */
export function getFashionGulSectionsConfig(settings = {}, businessDomain, businessCategory) {
  // For jewelry stores, read from jewellery config (not fashion)
  const isJewellery = resolveDomainKey(businessCategory) === 'gems-jewellery';
  const raw = isJewellery
    ? (settings?.storefront?.jewellery || {})
    : (settings?.storefront?.fashion || settings?.fashion || {});
  
  const str = (value) => (typeof value === 'string' ? value.trim() : '');
  return {
    showHomeEdit: raw.showHomeEdit !== false,
    showSaleMosaic: raw.showSaleMosaic !== false,
    homeEditTitle: str(raw.homeEditTitle),
    homeEditSubtitle: str(raw.homeEditSubtitle),
    saleMosaicTitle: str(raw.saleMosaicTitle),
    homeEdit: raw.homeEdit && typeof raw.homeEdit === 'object' ? raw.homeEdit : null,
    saleMosaic: raw.saleMosaic && typeof raw.saleMosaic === 'object' ? raw.saleMosaic : null,
  };
}

/**
 * @param {string} storeBase `/store/{domain}`
 * @param {string} href
 */
export function resolveFashionGulHref(storeBase, href) {
  const raw = String(href || '').trim();
  if (!raw) return `${storeBase}/products`;
  if (raw.startsWith('http')) return raw;
  if (raw.startsWith('/store/')) return raw;
  if (raw.startsWith('/products')) return `${storeBase}${raw.replace(/^\/products/, '/products')}`;
  if (raw.startsWith('?')) return `${storeBase}/products${raw}`;
  if (raw.startsWith('/')) return `${storeBase}${raw}`;
  return `${storeBase}/products?${raw}`;
}

/**
 * @param {string} href
 */
export function parseFashionTileHref(href) {
  const raw = String(href || '');
  const q = raw.includes('?') ? raw.split('?')[1] : raw.replace(/^\?/, '');
  const params = new URLSearchParams(q);
  return {
    category: params.get('category') || '',
    search: params.get('search') || '',
    onSale: params.get('onSale') === 'true',
    sort: params.get('sort') || '',
  };
}

/**
 * @param {string} query
 */
function buildFashionProductsHref(query) {
  const params = new URLSearchParams();
  if (query.category) params.set('category', query.category);
  if (query.search) params.set('search', query.search);
  if (query.onSale) params.set('onSale', 'true');
  if (query.sort) params.set('sort', query.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * @param {object} product
 * @param {object} cat
 */
export function fashionProductInCategory(product, cat) {
  if (product.category_id && cat.id && product.category_id === cat.id) return true;
  if (product.category_slug && cat.slug && product.category_slug === cat.slug) return true;
  const pCat = String(product.category_name || product.category || '')
    .trim()
    .toLowerCase();
  const cName = String(cat.name || '').trim().toLowerCase();
  const cSlug = String(cat.slug || '').trim().toLowerCase();
  return Boolean(pCat && (pCat === cName || pCat.replace(/\s+/g, '-') === cSlug));
}

/**
 * @param {object} product
 */
export function isFashionStorefrontOnSale(product) {
  const price = Number(product?.price) || 0;
  const compare = Number(product?.compare_price ?? product?.mrp) || 0;
  return compare > price && price > 0;
}

/**
 * @param {object[]} categories
 * @param {{ category?: string; search?: string; categorySlug?: string }} query
 */
export function matchFashionCatalogCategory(categories = [], query = {}) {
  const slugNeedle = String(query.categorySlug || query.category || '')
    .trim()
    .toLowerCase();
  if (slugNeedle) {
    const bySlug = categories.find((cat) => String(cat.slug || '').toLowerCase() === slugNeedle);
    if (bySlug) return bySlug;
  }

  const catNeedle = String(query.category || '').toLowerCase().replace(/-/g, ' ');
  const searchNeedle = String(query.search || '').toLowerCase();
  return categories.find((cat) => {
    const slug = String(cat.slug || '').toLowerCase();
    const name = String(cat.name || '').toLowerCase();
    if (catNeedle && (slug === catNeedle || slug.includes(catNeedle) || name.includes(catNeedle))) {
      return true;
    }
    if (searchNeedle && (name.includes(searchNeedle) || slug.includes(searchNeedle.replace(/\s+/g, '-')))) {
      return true;
    }
    return false;
  });
}

/**
 * @param {object[]} products
 * @param {object | null | undefined} cat
 * @param {{ search?: string; onSale?: boolean }} [query]
 */
export function pickFashionCatalogProduct(products = [], cat, query = {}) {
  let pool = cat
    ? products.filter((p) => fashionProductInCategory(p, cat))
    : [...products];

  if (query.onSale) {
    const onSalePool = pool.filter(isFashionStorefrontOnSale);
    if (onSalePool.length) pool = onSalePool;
  }

  if (query.search) {
    const needle = query.search.toLowerCase();
    const hit = pool.find((p) => String(p.name || '').toLowerCase().includes(needle));
    if (hit) return hit;
  }

  return pool[0] || null;
}

/**
 * @param {object} tile
 * @param {object[]} categories
 * @param {object[]} products
 * @param {string | null | undefined} businessCategory
 */
export function enrichFashionSaleTileFromCatalog(tile, categories = [], products = [], businessCategory) {
  const parsed = parseFashionTileHref(tile.href);
  const cat =
    matchFashionCatalogCategory(categories, {
      categorySlug: tile.categorySlug,
      category: parsed.category,
      search: parsed.search,
    }) || null;
  const product = pickFashionCatalogProduct(products, cat, parsed);

  const query = {
    category: cat?.slug || parsed.category,
    search: cat ? '' : parsed.search,
    onSale: parsed.onSale,
    sort: parsed.sort,
  };
  const href = buildFashionProductsHref(query) || tile.href;

  const ownerDesktop = String(tile.desktop || tile.image || '').trim();
  const ownerMobile = String(tile.mobile || '').trim();
  const catalogImage =
    (product && getEffectiveProductImageUrl(product, businessCategory)) ||
    (cat?.image_url && String(cat.image_url)) ||
    '';

  const desktop = ownerDesktop || catalogImage;
  const mobile = ownerMobile || catalogImage || desktop;

  return {
    ...tile,
    categorySlug: cat?.slug || tile.categorySlug || '',
    label: tile.label || cat?.name || '',
    href,
    desktop,
    mobile,
    image: desktop,
  };
}

/**
 * Build a live Sale mosaic from tenant categories + inventory (no Gul Ahmed CDN).
 * @param {object[]} categories
 * @param {object[]} products
 * @param {string | null | undefined} businessCategory
 */
export function buildFashionSaleMosaicFromCatalog(categories = [], products = [], businessCategory) {
  const ranked = [...categories]
    .map((cat) => {
      const catProducts = products.filter((p) => fashionProductInCategory(p, cat));
      const saleCount = catProducts.filter(isFashionStorefrontOnSale).length;
      const count = Number(cat.product_count) || catProducts.length;
      return { cat, saleCount, count };
    })
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.saleCount - a.saleCount || b.count - a.count);

  if (ranked.length < 2) return null;

  const columns = SALE_MOSAIC_COLUMN_PATTERN.map((maxTiles, index) => ({
    id: `col-live-${index + 1}`,
    tiles: [],
  }));

  let cursor = 0;
  for (let colIndex = 0; colIndex < columns.length && cursor < ranked.length; colIndex += 1) {
    const take = SALE_MOSAIC_COLUMN_PATTERN[colIndex];
    for (let i = 0; i < take && cursor < ranked.length; i += 1, cursor += 1) {
      const { cat, saleCount } = ranked[cursor];
      const catProducts = products.filter((p) => fashionProductInCategory(p, cat));
      const product = (saleCount > 0 ? catProducts.filter(isFashionStorefrontOnSale) : catProducts)[0];
      const query = { category: cat.slug, onSale: saleCount > 0 };
      columns[colIndex].tiles.push({
        id: cat.slug || cat.id,
        categorySlug: cat.slug,
        label: cat.name,
        href: buildFashionProductsHref(query),
        desktop:
          (cat.image_url && String(cat.image_url)) ||
          (product && getEffectiveProductImageUrl(product, businessCategory)) ||
          '',
        mobile:
          (cat.image_url && String(cat.image_url)) ||
          (product && getEffectiveProductImageUrl(product, businessCategory)) ||
          '',
      });
    }
  }

  const liveColumns = columns.filter((col) => col.tiles.length > 0);
  if (liveColumns.length < 2) return null;

  return {
    title: 'Sale',
    columns: liveColumns,
  };
}

/**
 * Enrich Home Edit tiles with live category/product images and resolved hrefs.
 */
export function enrichFashionHomeEditFromCatalog(homeEdit, categories = [], products = [], businessCategory) {
  if (!homeEdit?.tiles?.length) return homeEdit;

  return {
    ...homeEdit,
    tiles: homeEdit.tiles.map((tile) => {
      const parsed = parseFashionTileHref(tile.href);
      const cat = matchFashionCatalogCategory(categories, parsed);
      const product = pickFashionCatalogProduct(products, cat, parsed);
      const href = cat?.slug
        ? buildFashionProductsHref({ ...parsed, category: cat.slug, search: '' })
        : buildFashionProductsHref(parsed) || tile.href;
      const image =
        (product && getEffectiveProductImageUrl(product, businessCategory)) ||
        (cat?.image_url && String(cat.image_url)) ||
        tile.image;
      return {
        ...tile,
        href,
        image,
      };
    }),
  };
}

/**
 * Enrich Sale mosaic tiles with live category/product images and resolved hrefs.
 */
export function enrichFashionSaleMosaicFromCatalog(saleMosaic, categories = [], products = [], businessCategory) {
  if (!saleMosaic?.columns?.length) return saleMosaic;

  return {
    ...saleMosaic,
    columns: saleMosaic.columns.map((col) => ({
      ...col,
      tiles: (col.tiles || [])
        .map((tile) => enrichFashionSaleTileFromCatalog(tile, categories, products, businessCategory))
        .filter((tile) => tile.desktop || tile.mobile || tile.label),
    })).filter((col) => col.tiles.length > 0),
  };
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} businessCategory
 * @param {string | null | undefined} businessDomain
 * @param {string} storeBase
 * @param {object[]} [categories]
 * @param {object[]} [products]
 */
export function resolveFashionHomeEdit(
  settings = {},
  businessCategory,
  businessDomain,
  storeBase,
  categories = [],
  products = []
) {
  const config = getFashionGulSectionsConfig(settings, businessDomain, businessCategory);
  const variant = getLuxuryFashionVariant(businessCategory) || 'boutique';
  const defaults = getDefaultFashionGulSections(variant).homeEdit;
  const source = config.homeEdit?.tiles?.length ? config.homeEdit : defaults;
  if (!source?.tiles?.length) return null;

  const enriched = enrichFashionHomeEditFromCatalog(
    {
      title: config.homeEditTitle || source.title || defaults.title,
      subtitle: config.homeEditSubtitle || source.subtitle || defaults.subtitle,
      viewAllHref: source.viewAllHref || defaults.viewAllHref,
      tiles: source.tiles,
    },
    categories,
    products,
    businessCategory
  );

  return {
    ...enriched,
    viewAllHref: resolveFashionGulHref(storeBase, enriched.viewAllHref),
    tiles: enriched.tiles.map((tile) => ({
      ...tile,
      href: resolveFashionGulHref(storeBase, tile.href),
    })),
  };
}

/**
 * @param {object} [settings]
 * @param {string | null | undefined} businessCategory
 * @param {string | null | undefined} businessDomain
 * @param {string} storeBase
 * @param {object[]} [categories]
 * @param {object[]} [products]
 */
export function resolveFashionSaleMosaic(
  settings = {},
  businessCategory,
  businessDomain,
  storeBase,
  categories = [],
  products = []
) {
  const config = getFashionGulSectionsConfig(settings, businessDomain, businessCategory);
  const variant = getLuxuryFashionVariant(businessCategory) || 'boutique';
  const defaults = getDefaultFashionGulSections(variant).saleMosaic;
  const isDemo = isDemoStoreDomain(businessDomain);
  const hasOwnerMosaic = Boolean(config.saleMosaic?.columns?.length);

  let source;
  if (hasOwnerMosaic) {
    source = config.saleMosaic;
  } else if (!isDemo) {
    source = buildFashionSaleMosaicFromCatalog(categories, products, businessCategory);
  }
  if (!source?.columns?.length) {
    source = defaults;
  }
  if (!source?.columns?.length) return null;

  const enriched = enrichFashionSaleMosaicFromCatalog(source, categories, products, businessCategory);
  if (!enriched?.columns?.length) return null;

  return {
    title: config.saleMosaicTitle || enriched.title || defaults.title,
    columns: enriched.columns.map((col) => ({
      ...col,
      tiles: (col.tiles || []).map((tile) => ({
        ...tile,
        href: resolveFashionGulHref(storeBase, tile.href),
      })),
    })),
  };
}
