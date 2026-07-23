#!/usr/bin/env node
/**
 * Build milkShopDemoCatalog.js from scraped platform extracts + curated PK essentials.
 *
 * Pipeline:
 *   1. node scripts/fetch-milk-shop-catalog.mjs
 *   2. node scripts/build-milk-shop-seed-catalog.mjs
 *   3. npx tsx scripts/data-lab/ensure-demo-storefronts.mjs --only demo-milk --refresh-catalog
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const extractPath = path.join(root, 'lib', 'dataLab', 'milkShopArchiveExtract.json');
const catalogPath = path.join(root, 'lib', 'dataLab', 'milkShopDemoCatalog.js');

const P = {
  milk: '1563636619-e9143da7973b',
  yogurt: '1488477181946-6428a0291777',
  aisle: '1578916171728-46686eac8d58',
  bread: '1509440159596-0249088772ff',
  bread2: '1549931319-a545dcf3bc73',
  drink: '1544145945-f90425340c7e',
  drink2: '1437418747212-8d9709afab22',
  produce: '1542838132-92c53300491e',
};

const CATEGORIES = [
  'Fresh Milk',
  'Yogurt / Dahi',
  'Cream & Butter',
  'Ghee',
  'Cheese & Khoya',
  'Lassi & Drinks',
  'Dairy Sweets',
  'Packaged Dairy',
  'Eggs',
  'Bakery Staples',
];

function slugSku(name) {
  const base = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 36);
  return `MLK-${base || 'SKU'}`;
}

function inferCategory(name, hint) {
  if (hint && CATEGORIES.includes(hint)) return hint;
  const n = String(name || '').toLowerCase();
  if (/ghee/.test(n)) return 'Ghee';
  if (/paneer|khoya|cheese|qalaqand|barfi|dhoda/.test(n)) return 'Cheese & Khoya';
  if (/butter|makkhan|makhan|malai|margarine|cream 200|nurpur butter|olper.?s cream/.test(n)) {
    return 'Cream & Butter';
  }
  if (/dahi|yogurt|yoghurt/.test(n)) return 'Yogurt / Dahi';
  if (/lassi|doodh soda|pakola|rose milk|badami|flavoured milk|chocolate lassi|mango lassi/.test(n)) {
    return 'Lassi & Drinks';
  }
  if (/kheer|rabri|jalebi|gulab|kulfi|rasmalai|ice cream/.test(n)) return 'Dairy Sweets';
  if (/olper|nurpur|dayfresh|prema|haleeb|everyday|milk powder|uht|tetra/.test(n)) {
    return 'Packaged Dairy';
  }
  if (/egg/.test(n)) return 'Eggs';
  if (/bread|toast|bake parlor|dawn|brady/.test(n)) return 'Bakery Staples';
  if (/milk|doodh|buffalo|cow|goat/.test(n)) return 'Fresh Milk';
  return 'Fresh Milk';
}

function inferUnit(name, category, given) {
  if (given) return given;
  const n = String(name || '').toLowerCase();
  if (/dozen/.test(n) || category === 'Eggs') return 'dozen';
  if (/\b1l\b|1 l|litre|liter|\/l\b/.test(n)) return 'litre';
  if (/glass|1pc|pcs|pack|pouch|250g|500g|100g|180ml|200ml|450ml|440g|650g|850g/.test(n)) {
    if (/kg|1kg/.test(n) && !/250g|500g|220g/.test(n)) return 'kg';
    return /glass|1pc|pcs/.test(n) ? 'pcs' : 'pack';
  }
  if (category === 'Fresh Milk' || category === 'Yogurt / Dahi' || category === 'Ghee') return 'kg';
  if (category === 'Lassi & Drinks') return 'pcs';
  if (category === 'Bakery Staples') return 'pcs';
  return 'kg';
}

function inferBrand(name) {
  const n = String(name || '');
  const brands = [
    ["Olper's", /olper/i],
    ['Nurpur', /nurpur/i],
    ['Dayfresh', /dayfresh/i],
    ['Prema', /prema/i],
    ['Haleeb', /haleeb/i],
    ['Milkland', /milkland/i],
    ['Anhaar', /anhaar/i],
    ['Nestlé', /nestle|everyday/i],
    ['Pakola', /pakola/i],
    ['Dawn', /dawn/i],
    ["Brady's", /brady/i],
    ['Bake Parlor', /bake parlor/i],
  ];
  for (const [brand, re] of brands) {
    if (re.test(n)) return brand;
  }
  return 'Tenvo Milk';
}

function imageFor(category, name) {
  const n = String(name || '').toLowerCase();
  if (/bread|toast/.test(n)) return P.bread;
  if (/lassi|soda|drink|rose|badami|chocolate|mango/.test(n)) return P.drink2;
  if (/dahi|yogurt|paneer/.test(n)) return P.yogurt;
  if (/egg/.test(n)) return P.produce;
  if (category === 'Dairy Sweets' || category === 'Ghee' || /kheer|ghee|khoya/.test(n)) return P.aisle;
  if (category === 'Packaged Dairy') return P.milk;
  return P.milk;
}

/** Curated essentials that platforms may omit (kg-first PK doodh shop). */
const CURATED = [
  {
    name: 'Fresh Cow Milk',
    category: 'Fresh Milk',
    unit: 'kg',
    price: 220,
    featured: true,
    source: 'punjabmilkshop.com + purenest.pk',
    description: 'Farm-fresh cow milk sold by the kilogram.',
  },
  {
    name: 'Fresh Buffalo Milk',
    category: 'Fresh Milk',
    unit: 'kg',
    price: 240,
    featured: true,
    source: 'punjabmilkshop.com + purenest.pk',
    description: 'Thick buffalo milk by kg.',
  },
  {
    name: 'Fresh Goat Milk',
    category: 'Fresh Milk',
    unit: 'kg',
    price: 280,
    source: 'purequalitymilk.com',
  },
  {
    name: 'Cow Milk (Pure Nest)',
    category: 'Fresh Milk',
    unit: 'litre',
    price: 250,
    source: 'purenest.pk',
    description: 'Pure Nest farm cow milk per litre.',
  },
  {
    name: 'Buffalo Milk (Pure Nest)',
    category: 'Fresh Milk',
    unit: 'litre',
    price: 260,
    source: 'purenest.pk',
  },
  {
    name: 'Homemade Dahi',
    category: 'Yogurt / Dahi',
    unit: 'kg',
    price: 260,
    featured: true,
    source: 'punjabmilkshop.com',
  },
  {
    name: 'Yogurt Pure & Thick',
    category: 'Yogurt / Dahi',
    unit: 'kg',
    price: 280,
    source: 'purenest.pk',
  },
  {
    name: 'Fresh Makkhan (Desi Butter)',
    category: 'Cream & Butter',
    unit: 'kg',
    price: 1800,
    featured: true,
    source: 'purequalitymilk.com',
  },
  {
    name: 'Fresh Malai (Cream)',
    category: 'Cream & Butter',
    unit: 'kg',
    price: 900,
    source: 'purequalitymilk.com',
  },
  {
    name: 'Desi Ghee',
    category: 'Ghee',
    unit: 'kg',
    price: 4000,
    featured: true,
    source: 'purenest.pk',
  },
  {
    name: 'Desi Ghee 1 Kg',
    category: 'Ghee',
    unit: 'kg',
    price: 3850,
    source: 'punjabmilkshop.com',
  },
  {
    name: 'Fresh Paneer',
    category: 'Cheese & Khoya',
    unit: 'kg',
    price: 2500,
    featured: true,
    source: 'purenest.pk',
  },
  {
    name: 'Fresh Khoya',
    category: 'Cheese & Khoya',
    unit: 'kg',
    price: 2600,
    source: 'punjabmilkshop.com',
  },
  {
    name: "Olper's Full Cream Milk 1L",
    brand: "Olper's",
    category: 'Packaged Dairy',
    unit: 'litre',
    price: 380,
    featured: true,
    source: 'brand-retail',
  },
  {
    name: 'Nurpur Full Cream Milk 1L',
    brand: 'Nurpur',
    category: 'Packaged Dairy',
    unit: 'litre',
    price: 380,
    source: 'brand-retail',
  },
  {
    name: 'Dayfresh Milk 1L',
    brand: 'Dayfresh',
    category: 'Packaged Dairy',
    unit: 'litre',
    price: 360,
    source: 'brand-retail',
  },
  {
    name: 'Nestlé Everyday Milk Powder 400g',
    brand: 'Nestlé',
    category: 'Packaged Dairy',
    unit: 'pack',
    price: 1150,
    source: 'brand-retail',
  },
  {
    name: "Olper's Cream 200ml",
    brand: "Olper's",
    category: 'Cream & Butter',
    unit: 'pack',
    price: 240,
    source: 'brand-retail',
  },
  {
    name: 'Farm Fresh Eggs (Dozen)',
    category: 'Eggs',
    unit: 'dozen',
    price: 420,
    featured: true,
    source: 'purequalitymilk.com',
  },
  {
    name: 'Barfi 500g',
    category: 'Dairy Sweets',
    unit: 'pack',
    price: 800,
    source: 'punjabmilkshop.com',
  },
  {
    name: 'Gulab Jamun 500g',
    category: 'Dairy Sweets',
    unit: 'pack',
    price: 700,
    source: 'punjabmilkshop.com',
  },
  {
    name: 'Special Malai Lassi Glass',
    category: 'Lassi & Drinks',
    unit: 'pcs',
    price: 220,
    featured: true,
    source: 'foodpanda-milk-shops',
  },
  {
    name: 'Prema Full Cream Milk 1L',
    brand: 'Prema',
    category: 'Packaged Dairy',
    unit: 'litre',
    price: 370,
    source: 'brand-retail',
  },
  {
    name: 'Haleeb Full Cream Milk 1L',
    brand: 'Haleeb',
    category: 'Packaged Dairy',
    unit: 'litre',
    price: 365,
    source: 'brand-retail',
  },
  {
    name: 'Milkland UHT Milk 1L',
    brand: 'Milkland',
    category: 'Packaged Dairy',
    unit: 'litre',
    price: 350,
    source: 'brand-retail',
  },
  {
    name: 'Anhaar Farm Fresh Milk',
    brand: 'Anhaar',
    category: 'Fresh Milk',
    unit: 'kg',
    price: 230,
    featured: true,
    source: 'anhaar.pk',
  },
  {
    name: 'Rabri 500g',
    category: 'Dairy Sweets',
    unit: 'pack',
    price: 550,
    source: 'punjabmilkshop.com',
  },
  {
    name: 'Sweet Lassi Glass',
    category: 'Lassi & Drinks',
    unit: 'pcs',
    price: 189,
    source: 'foodpanda-milk-shops',
  },
  {
    name: 'Nurpur Cream 200ml',
    brand: 'Nurpur',
    category: 'Cream & Butter',
    unit: 'pack',
    price: 230,
    source: 'brand-retail',
  },
  {
    name: 'Desi Ghee 500g',
    category: 'Ghee',
    unit: 'pack',
    price: 2100,
    source: 'purenest.pk',
  },
  {
    name: 'Homemade Dahi 500g',
    category: 'Yogurt / Dahi',
    unit: 'pack',
    price: 140,
    source: 'punjabmilkshop.com',
  },
  {
    name: 'Fresh Paneer 500g',
    category: 'Cheese & Khoya',
    unit: 'pack',
    price: 1300,
    source: 'purenest.pk',
  },
];

function normalizeKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toProduct(row, idx) {
  const name = String(row.name || '').trim();
  const category = inferCategory(name, row.category || row.categoryHint);
  const unit = inferUnit(name, category, row.unit || row.unitHint);
  const brand = row.brand || inferBrand(name);
  const price = Math.round(Number(row.price) || 0);
  if (!name || !price) return null;
  // Skip noisy non-dairy toaster snacks
  if (/richly brownie|sticky butter crispy toast/i.test(name)) return null;
  const sku = slugSku(name) + `-${String(idx).padStart(2, '0')}`;
  const photo = imageFor(category, name);
  const featured = Boolean(row.featured) || /fresh cow milk|fresh buffalo|homemade dahi|desi ghee|fresh paneer|olper.?s full|malai lassi/i.test(name);
  return {
    name,
    brand,
    category,
    unit,
    price,
    compare_price: null,
    cost_price: Math.round(price * 0.72),
    stock: unit === 'kg' || unit === 'litre' ? 120 : 60,
    sku,
    description:
      row.description ||
      `${name}. Fresh dairy from Tenvo Milk Demo (sourced from ${row.source || 'PK milk shops'}). Sold ${
        unit === 'kg' ? 'by the kilogram' : `per ${unit}`
      }.`,
    image_url: `https://images.unsplash.com/photo-${photo}?w=800&q=82&auto=format&fit=crop`,
    imageCredit: 'Unsplash seed',
    is_featured: featured,
    domain_data: {
      source: row.source || 'scraped',
      chill: true,
      fatpercent: /cow milk/i.test(name) ? '3.5' : /buffalo/i.test(name) ? '6.5' : '',
    },
  };
}

function main() {
  const extract = fs.existsSync(extractPath)
    ? JSON.parse(fs.readFileSync(extractPath, 'utf8'))
    : { products: [] };

  const merged = [];
  const seen = new Set();

  for (const row of CURATED) {
    const key = normalizeKey(row.name);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
  }

  for (const row of extract.products || []) {
    const key = normalizeKey(row.name);
    // Prefer kg curated cow/buffalo over litre menu duplicates with same name
    if (seen.has(key)) continue;
    // Dedupe near-duplicates (Yogurt 1kg vs Yogurt)
    const loose = key.replace(/\b(1kg|1l|250g|500g|100g|glass|1pc)\b/g, '').trim();
    if ([...seen].some((s) => s === loose || s.startsWith(loose + ' ') || loose.startsWith(s + ' '))) {
      // still allow distinct pack sizes
      if (!/\b(250g|500g|1kg|1l|100g|180ml|200ml|450ml)\b/.test(key)) continue;
    }
    seen.add(key);
    merged.push(row);
  }

  const products = merged
    .map((row, i) => toProduct(row, i + 1))
    .filter(Boolean)
    .slice(0, 72);

  const catsPresent = new Set(products.map((p) => p.category));
  for (const c of CATEGORIES) {
    if (!catsPresent.has(c)) {
      console.warn(`warning: missing category ${c}`);
    }
  }

  const body = products
    .map((p) => {
      const dd = JSON.stringify(p.domain_data);
      return `  milkProduct({
    name: ${JSON.stringify(p.name)},
    brand: ${JSON.stringify(p.brand)},
    category: ${JSON.stringify(p.category)},
    sku: ${JSON.stringify(p.sku)},
    unit: ${JSON.stringify(p.unit)},
    price: ${p.price},
    stock: ${p.stock},
    featured: ${p.is_featured},
    image: img(P.${Object.entries(P).find(([, id]) => p.image_url.includes(id))?.[0] || 'milk'}),
    description: ${JSON.stringify(p.description)},
    domain_data: ${dd},
  })`;
    })
    .join(',\n');

  const file = `/**
 * Tenvo Milk Demo / milk-shop registration catalog.
 * Built from scraped platforms (Bismillah foodpanda archive, Punjab Milk Shop, Pure Nest)
 * plus curated kg-first PK doodh-shop essentials.
 *
 * Regenerate: node scripts/fetch-milk-shop-catalog.mjs && node scripts/build-milk-shop-seed-catalog.mjs
 */
import { buildUnsplashImageUrl } from '../storefront/unsplashUrl.js';

/** Stable Unsplash photo ids (allowlisted dairy / bakery / beverage pools). */
const P = ${JSON.stringify(P, null, 2)};

/** @param {string} photoId */
function img(photoId) {
  return buildUnsplashImageUrl(photoId, { w: 800, q: 82 });
}

export const MILK_SHOP_SEED_CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};

export const MILK_SHOP_MARKETING_HERO_IMAGE = img(P.milk);

/**
 * @param {object} partial
 * @returns {Record<string, unknown>}
 */
function milkProduct(partial) {
  const {
    name,
    brand = 'Tenvo Milk',
    category,
    sku,
    price,
    compare_price,
    unit = 'kg',
    stock = 80,
    featured = false,
    image,
    description,
    domain_data = {},
  } = partial;
  const cost = Math.round(Number(price) * 0.72);
  return {
    name,
    brand,
    category,
    unit,
    price,
    compare_price: compare_price ?? null,
    cost_price: cost,
    stock,
    sku,
    description:
      description ||
      \`\${name}. Fresh dairy from Tenvo Milk Shop. Sold \${unit === 'kg' ? 'by the kilogram' : \`per \${unit}\`}.\`,
    image_url: image,
    imageCredit: 'Unsplash seed',
    is_featured: featured,
    domain_data: {
      source: domain_data.source || (brand === 'Tenvo Milk' ? 'Farm / Collector' : 'Brand'),
      fatpercent: domain_data.fatpercent || '',
      chill: domain_data.chill !== false,
      ...domain_data,
    },
  };
}

/** @type {Array<Record<string, unknown>>} */
export const MILK_SHOP_SEED_PRODUCTS = [
${body},
];

export const MILK_SHOP_SEED_PRODUCT_COUNT = MILK_SHOP_SEED_PRODUCTS.length;
`;

  fs.writeFileSync(catalogPath, file);
  console.log(`Wrote ${products.length} SKUs → ${catalogPath}`);
  console.log('Categories:', [...catsPresent].join(', '));
}

main();
