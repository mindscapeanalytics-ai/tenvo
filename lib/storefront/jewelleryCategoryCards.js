/**
 * Shared jewellery/beauty category card resolver.
 * Hero overlap tiles and Jewellery Edit mosaic both resolve from live inventory,
 * with optional per-field owner overrides in settings.storefront.jewellery.
 */
import { getEffectiveProductImageUrl } from './productImageFallback';

/** @typedef {'hero' | 'edit'} JewelleryCardSurface */
/** @typedef {'jewellery' | 'beauty'} JewelleryStoreMode */

/**
 * @typedef {object} JewelleryCardSlotDef
 * @property {string} id
 * @property {string} [slot]
 * @property {string} [label]
 * @property {string} [desc]
 * @property {string} [eyebrow]
 * @property {string} [title]
 * @property {string} [ctaLabel]
 * @property {string} [categorySlug]
 * @property {string} [hrefSuffix]
 * @property {string} [imageKey]
 * @property {string[]} [keywords]
 */

/**
 * @typedef {object} JewelleryResolvedCard
 * @property {string} id
 * @property {string} [slot]
 * @property {string} [label]
 * @property {string} [desc]
 * @property {string} [eyebrow]
 * @property {string} [title]
 * @property {string} [ctaLabel]
 * @property {string} href
 * @property {string} image
 * @property {string} [categorySlug]
 * @property {string} [imageKey]
 */

export const CATEGORY_IMAGE_FALLBACKS = {
  gold: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80&auto=format&fit=crop',
  diamonds: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80&auto=format&fit=crop',
  bridal: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80&auto=format&fit=crop',
  gifts: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80&auto=format&fit=crop',
  silver: 'https://images.unsplash.com/photo-1589128777073-263566ae57e4?w=600&q=80&auto=format&fit=crop',
  earrings: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80&auto=format&fit=crop',
  necklaces: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80&auto=format&fit=crop',
  rings: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80&auto=format&fit=crop',
  polish: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&auto=format&fit=crop',
  'press-ons': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format&fit=crop',
  'press-on': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&auto=format&fit=crop',
  kits: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&auto=format&fit=crop',
  care: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&auto=format&fit=crop',
  tools: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?w=600&q=80&auto=format&fit=crop',
  lamps: 'https://images.unsplash.com/photo-1585232351009-aa97f53b2a5d?w=600&q=80&auto=format&fit=crop',
};

const DEFAULT_FALLBACK = CATEGORY_IMAGE_FALLBACKS.gold;

const KEYWORD_MAP = {
  gold: ['gold', '22k', '21k', '18k', 'kangan', 'chain'],
  diamonds: ['diamond', 'solitaire', 'tennis', 'stud'],
  bridal: ['bridal', 'kundan', 'polki', 'wedding', 'engagement'],
  gifts: ['gift', 'occasion', 'bundle', 'holiday'],
  polish: ['polish', 'gel', 'lacquer', 'liquid'],
  'press-on': ['press-on', 'nails', 'tips'],
  'press-ons': ['press-on', 'nails', 'tips'],
  kits: ['kit', 'system', 'set', 'starter'],
  care: ['care', 'serum', 'oil', 'strengthener'],
};

function keywordsForRule(ruleId) {
  return KEYWORD_MAP[ruleId] || [ruleId];
}

/** Hero category cards (jewellery). */
export const JEWELLERY_HERO_CARD_SLOTS = [
  {
    id: 'gold',
    label: 'Gold',
    desc: 'Rings & sets',
    categorySlug: 'gold',
    hrefSuffix: '?category=gold',
    imageKey: 'gold',
    keywords: keywordsForRule('gold'),
  },
  {
    id: 'diamonds',
    label: 'Diamonds',
    desc: 'Fine jewellery',
    categorySlug: 'diamonds',
    hrefSuffix: '?category=diamonds',
    imageKey: 'diamonds',
    keywords: keywordsForRule('diamonds'),
  },
  {
    id: 'bridal',
    label: 'Bridal',
    desc: 'Wedding sets',
    categorySlug: 'bridal',
    hrefSuffix: '?category=bridal',
    imageKey: 'bridal',
    keywords: keywordsForRule('bridal'),
  },
  {
    id: 'gifts',
    label: 'Gifts',
    desc: 'Occasion picks',
    hrefSuffix: '?sort=featured',
    imageKey: 'gifts',
    keywords: keywordsForRule('gifts'),
  },
];

/** Hero category cards (beauty / salon). */
export const BEAUTY_HERO_CARD_SLOTS = [
  {
    id: 'polish',
    label: 'Polish',
    desc: 'Gel & lacquer',
    categorySlug: 'polish',
    hrefSuffix: '?category=polish',
    imageKey: 'polish',
    keywords: keywordsForRule('polish'),
  },
  {
    id: 'press-ons',
    label: 'Press-Ons',
    desc: 'Instant mani',
    categorySlug: 'press-on',
    hrefSuffix: '?category=press-on',
    imageKey: 'press-ons',
    keywords: keywordsForRule('press-on'),
  },
  {
    id: 'kits',
    label: 'Mani Kits',
    desc: 'Complete systems',
    categorySlug: 'kits',
    hrefSuffix: '?category=kits',
    imageKey: 'kits',
    keywords: keywordsForRule('kits'),
  },
  {
    id: 'care',
    label: 'Care',
    desc: 'Serums & oils',
    categorySlug: 'care',
    hrefSuffix: '?category=care',
    imageKey: 'care',
    keywords: keywordsForRule('care'),
  },
];

/** Jewellery Edit mosaic slots. */
export const JEWELLERY_EDIT_CARD_SLOTS = [
  {
    id: 'gold',
    slot: 'hero',
    eyebrow: 'Fine gold',
    title: 'Celebrate every occasion with hallmarked purity.',
    ctaLabel: 'EXPLORE',
    categorySlug: 'gold',
    imageKey: 'gold',
    keywords: keywordsForRule('gold'),
  },
  {
    id: 'diamonds',
    slot: 'banner',
    eyebrow: 'Diamonds',
    title: 'Brilliance that lasts generations',
    ctaLabel: 'EXPLORE',
    categorySlug: 'diamonds',
    imageKey: 'diamonds',
    keywords: keywordsForRule('diamonds'),
  },
  {
    id: 'bridal',
    slot: 'half-left',
    eyebrow: 'Bridal',
    ctaLabel: 'EXPLORE',
    categorySlug: 'bridal',
    imageKey: 'bridal',
    keywords: keywordsForRule('bridal'),
  },
  {
    id: 'gifts',
    slot: 'half-right',
    eyebrow: 'Gifts',
    ctaLabel: 'EXPLORE',
    hrefSuffix: '?sort=featured',
    imageKey: 'gifts',
    keywords: keywordsForRule('gifts'),
  },
];

/** Beauty Edit mosaic slots. */
export const BEAUTY_EDIT_CARD_SLOTS = [
  {
    id: 'polish',
    slot: 'hero',
    eyebrow: 'Polish & gel',
    title: 'Salon-finish colour with clean, 21-free formulas.',
    ctaLabel: 'EXPLORE',
    categorySlug: 'polish',
    imageKey: 'polish',
    keywords: keywordsForRule('polish'),
  },
  {
    id: 'kits',
    slot: 'banner',
    eyebrow: 'Mani systems',
    title: 'Everything you need in one kit',
    ctaLabel: 'EXPLORE',
    categorySlug: 'kits',
    imageKey: 'kits',
    keywords: keywordsForRule('kits'),
  },
  {
    id: 'press-on',
    slot: 'half-left',
    eyebrow: 'Press-ons',
    ctaLabel: 'EXPLORE',
    categorySlug: 'press-on',
    imageKey: 'press-on',
    keywords: keywordsForRule('press-on'),
  },
  {
    id: 'care',
    slot: 'half-right',
    eyebrow: 'Care & serum',
    ctaLabel: 'EXPLORE',
    categorySlug: 'care',
    imageKey: 'care',
    keywords: keywordsForRule('care'),
  },
];

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

function isFilled(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
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
  if (product.category_slug && cat.slug && norm(product.category_slug) === norm(cat.slug)) return true;
  const pCat = norm(product.category_name || product.category);
  const cName = norm(cat.name);
  const cSlug = norm(cat.slug);
  return Boolean(pCat && (pCat === cName || pCat.replace(/\s+/g, '-') === cSlug));
}

function filterProductsByKeywords(products, keywords) {
  return products.filter((p) => keywords.some((k) => haystack(p).includes(norm(k))));
}

function filterCategoriesByKeywords(categories, keywords) {
  return categories.filter((c) => keywords.some((k) => haystackCategory(c).includes(norm(k))));
}

function resolveHref(base, { categorySlug, hrefSuffix, search, ruleId }) {
  const products = `${base}/products`;
  if (categorySlug) return `${products}?category=${encodeURIComponent(categorySlug)}`;
  if (hrefSuffix) return `${products}${hrefSuffix.startsWith('?') ? hrefSuffix : `?${hrefSuffix}`}`;
  if (search) return `${products}?search=${encodeURIComponent(search)}`;
  if (ruleId) return `${products}?search=${encodeURIComponent(ruleId)}`;
  return products;
}

function absoluteHref(base, href) {
  const raw = String(href || '').trim();
  if (!raw) return `${base}/products`;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/store/')) return raw;
  if (raw.startsWith('?')) return `${base}/products${raw}`;
  if (raw.startsWith('/')) return `${base}${raw}`;
  return `${base}/${raw}`;
}

function fallbackImage(imageKey, id) {
  return CATEGORY_IMAGE_FALLBACKS[imageKey] || CATEGORY_IMAGE_FALLBACKS[id] || DEFAULT_FALLBACK;
}

/**
 * Pick inventory category + product image for a slot.
 * @returns {{ cat: object | null; product: object | null; categorySlug: string | null }}
 */
function matchInventory(slotDef, categories, products, preferredSlug) {
  const keywords = slotDef.keywords?.length ? slotDef.keywords : keywordsForRule(slotDef.id);

  if (preferredSlug) {
    const preferred = categories.find((c) => norm(c.slug) === norm(preferredSlug));
    if (preferred) {
      const catProducts = products.filter((p) => productInCategory(p, preferred));
      return {
        cat: preferred,
        product: catProducts[0] || null,
        categorySlug: preferred.slug,
      };
    }
  }

  if (slotDef.categorySlug) {
    const exact = categories.find((c) => norm(c.slug) === norm(slotDef.categorySlug));
    if (exact) {
      const catProducts = products.filter((p) => productInCategory(p, exact));
      return {
        cat: exact,
        product: catProducts[0] || null,
        categorySlug: exact.slug,
      };
    }
  }

  const matchedCats = filterCategoriesByKeywords(categories, keywords).sort(
    (a, b) => (Number(b.product_count) || 0) - (Number(a.product_count) || 0)
  );
  if (matchedCats[0]) {
    const cat = matchedCats[0];
    const catProducts = products.filter((p) => productInCategory(p, cat));
    return {
      cat,
      product: catProducts[0] || null,
      categorySlug: cat.slug,
    };
  }

  const matchedProducts = filterProductsByKeywords(products, keywords);
  if (matchedProducts[0]) {
    const best = matchedProducts[0];
    const slug = norm(best.category_slug || best.category_name || best.category).replace(/\s+/g, '-') || null;
    const cat = slug ? categories.find((c) => norm(c.slug) === slug) || null : null;
    return {
      cat,
      product: best,
      categorySlug: cat?.slug || slug,
    };
  }

  return { cat: null, product: null, categorySlug: slotDef.categorySlug || null };
}

/**
 * Merge owner partial onto inventory-resolved card.
 * Blank / null / undefined owner fields keep inventory values.
 * @param {JewelleryResolvedCard} resolved
 * @param {object | null | undefined} owner
 * @returns {JewelleryResolvedCard}
 */
export function mergeJewelleryCardFields(resolved, owner) {
  if (!owner || typeof owner !== 'object') return { ...resolved };

  const out = { ...resolved };
  const keys = [
    'label',
    'desc',
    'eyebrow',
    'title',
    'ctaLabel',
    'href',
    'image',
    'categorySlug',
    'imageKey',
    'slot',
    'id',
  ];

  for (const key of keys) {
    if (key === 'id' || key === 'slot') {
      if (isFilled(owner[key])) out[key] = owner[key];
      continue;
    }
    if (isFilled(owner[key])) {
      out[key] = typeof owner[key] === 'string' ? owner[key].trim() : owner[key];
    }
  }

  return out;
}

function findOwnerTile(ownerTiles, slotDef, index) {
  if (!Array.isArray(ownerTiles) || !ownerTiles.length) return null;
  const bySlot = slotDef.slot
    ? ownerTiles.find((t) => t && norm(t.slot) === norm(slotDef.slot))
    : null;
  if (bySlot) return bySlot;
  const byId = ownerTiles.find((t) => t && norm(t.id) === norm(slotDef.id));
  if (byId) return byId;
  return ownerTiles[index] || null;
}

/**
 * Resolve up to 4 category cards for hero or edit mosaic.
 * @param {{
 *   base: string;
 *   mode?: JewelleryStoreMode;
 *   surface?: JewelleryCardSurface;
 *   categories?: object[];
 *   products?: object[];
 *   businessCategory?: string;
 *   ownerTiles?: object[] | null;
 *   slotDefs?: JewelleryCardSlotDef[];
 * }} args
 * @returns {JewelleryResolvedCard[]}
 */
export function resolveJewelleryCategoryCards({
  base,
  mode = 'jewellery',
  surface = 'hero',
  categories = [],
  products = [],
  businessCategory,
  ownerTiles = null,
  slotDefs,
}) {
  const defs =
    slotDefs ||
    (surface === 'edit'
      ? mode === 'beauty'
        ? BEAUTY_EDIT_CARD_SLOTS
        : JEWELLERY_EDIT_CARD_SLOTS
      : mode === 'beauty'
        ? BEAUTY_HERO_CARD_SLOTS
        : JEWELLERY_HERO_CARD_SLOTS);

  return defs.slice(0, 4).map((slotDef, index) => {
    const owner = findOwnerTile(ownerTiles, slotDef, index);
    const preferredSlug = isFilled(owner?.categorySlug) ? owner.categorySlug : null;
    const match = matchInventory(
      { ...slotDef, _mode: mode },
      categories,
      products,
      preferredSlug
    );

    // Owner asked for a missing category — fall back to inventory match without preferred slug
    const effective =
      preferredSlug && !match.cat && !match.product
        ? matchInventory({ ...slotDef, _mode: mode }, categories, products, null)
        : match;

    const imageFromInventory =
      (effective.product
        ? getEffectiveProductImageUrl(effective.product, businessCategory)
        : null) ||
      (typeof effective.cat?.image_url === 'string' && effective.cat.image_url.trim()
        ? effective.cat.image_url.trim()
        : null) ||
      fallbackImage(slotDef.imageKey, slotDef.id);

    const hrefFromInventory = resolveHref(base, {
      categorySlug: effective.categorySlug || undefined,
      hrefSuffix: effective.categorySlug ? undefined : slotDef.hrefSuffix,
      ruleId: slotDef.id,
    });

    /** @type {JewelleryResolvedCard} */
    const resolved = {
      id: slotDef.id,
      slot: slotDef.slot,
      label: slotDef.label,
      desc: slotDef.desc,
      eyebrow: slotDef.eyebrow,
      title: slotDef.title,
      ctaLabel: slotDef.ctaLabel || (surface === 'edit' ? 'EXPLORE' : undefined),
      href: hrefFromInventory,
      image: imageFromInventory,
      categorySlug: effective.categorySlug || slotDef.categorySlug || undefined,
      imageKey: slotDef.imageKey || slotDef.id,
    };

    // If owner set categorySlug and it resolved, prefer live category name for blank label/eyebrow
    if (effective.cat && !isFilled(owner?.label) && surface === 'hero' && !slotDef.label) {
      resolved.label = String(effective.cat.name || resolved.label || 'Shop');
    }

    const merged = mergeJewelleryCardFields(resolved, owner);

    // Re-resolve href if owner only set categorySlug (and left href blank)
    if (isFilled(owner?.categorySlug) && !isFilled(owner?.href) && effective.cat) {
      merged.href = resolveHref(base, { categorySlug: effective.cat.slug });
      merged.categorySlug = effective.cat.slug;
      if (!isFilled(owner?.image)) {
        const catProducts = products.filter((p) => productInCategory(p, effective.cat));
        merged.image =
          (catProducts[0]
            ? getEffectiveProductImageUrl(catProducts[0], businessCategory)
            : null) ||
          effective.cat.image_url ||
          merged.image;
      }
    } else if (isFilled(owner?.href)) {
      merged.href = absoluteHref(base, owner.href);
    } else {
      merged.href = absoluteHref(base, merged.href);
    }

    // Missing preferred category fell back — keep custom label but inventory href/image
    if (preferredSlug && !categories.some((c) => norm(c.slug) === norm(preferredSlug))) {
      if (!isFilled(owner?.href)) {
        merged.href = absoluteHref(
          base,
          resolveHref(base, {
            categorySlug: matchInventory({ ...slotDef, _mode: mode }, categories, products, null)
              .categorySlug || slotDef.categorySlug,
            hrefSuffix: slotDef.hrefSuffix,
            ruleId: slotDef.id,
          })
        );
      }
    }

    return merged;
  });
}

/**
 * Slot defs for a mode + surface.
 * @param {JewelleryStoreMode} mode
 * @param {JewelleryCardSurface} surface
 */
export function getJewelleryCardSlotDefs(mode, surface) {
  if (surface === 'edit') {
    return mode === 'beauty' ? BEAUTY_EDIT_CARD_SLOTS : JEWELLERY_EDIT_CARD_SLOTS;
  }
  return mode === 'beauty' ? BEAUTY_HERO_CARD_SLOTS : JEWELLERY_HERO_CARD_SLOTS;
}
