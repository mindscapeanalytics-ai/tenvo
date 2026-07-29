/**
 * Offline polish for footwearDemoCatalog.js — fix mis-mapped color/condition and copy.
 * Run: node scripts/polish-footwear-seed.mjs
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const root = path.resolve(import.meta.dirname, '..');
const catalogPath = path.join(root, 'lib/dataLab/footwearDemoCatalog.js');

const CONDITION_LABELS = new Set([
  'excellent',
  'premium',
  'premium+',
  'premium plus',
  'very good',
  'brand new',
  'new',
  'store return',
  'store returns',
  'good',
  'fair',
]);

function normalizeCondition(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return '';
  if (/premium\+|premium plus/.test(s)) return 'premium_plus';
  if (/premium/.test(s)) return 'premium';
  if (/excellent/.test(s)) return 'excellent';
  if (/very good/.test(s)) return 'very_good';
  if (/store return/.test(s)) return 'store_return';
  if (/brand new|^new$/.test(s)) return 'new';
  return '';
}

function inferColorFromName(name) {
  const n = String(name || '').toLowerCase();
  const pairs = [
    [/\bblack\s*\/\s*white\b|\boreo\b|\bpanda\b/, 'Black / White'],
    [/\bnavy\b/, 'Navy'],
    [/\bgrey\b|\bgray\b/, 'Grey'],
    [/\bwhite\b/, 'White'],
    [/\bblack\b/, 'Black'],
    [/\bred\b/, 'Red'],
    [/\bblue\b/, 'Blue'],
    [/\bgreen\b/, 'Green'],
    [/\bpink\b/, 'Pink'],
    [/\bbrown\b|\btan\b|\bbeige\b|\bkhaki\b/, 'Brown'],
    [/\bpurple\b|\bviolet\b/, 'Purple'],
    [/\borange\b/, 'Orange'],
    [/\byellow\b|\bgold\b/, 'Yellow'],
    [/\bsilver\b/, 'Silver'],
  ];
  for (const [re, label] of pairs) {
    if (re.test(n)) return label;
  }
  return 'Multi';
}

function cleanDescription({ name, brand, size, color, style, condition, sourcing }) {
  const sizeBit = size ? ` Size ${size}.` : '';
  const colorBit = color && color !== 'Multi' ? ` ${color} colourway.` : '';
  const condLabel = String(condition || '').replace(/_/g, ' ');
  const condBit =
    condition && condition !== 'new' ? ` Graded ${condLabel}.` : sourcing === 'local' ? ' Brand new local line.' : '';
  return `${name}. Authentic ${brand} ${String(style || 'footwear').toLowerCase()}.${sizeBit}${colorBit}${condBit} Clear sizing and nationwide delivery.`
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCaseName(name) {
  return String(name || '')
    .toLowerCase()
    .split(/\s+/)
    .map((w) => {
      if (/^(nb|uk|eu|usa|pk|hd|qt|v\d+|r)$/i.test(w)) return w.toUpperCase();
      if (/^\d/.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ')
    .replace(/\bNike\b/gi, 'Nike')
    .replace(/\bAdidas\b/gi, 'Adidas')
    .replace(/\bPuma\b/gi, 'Puma')
    .replace(/\bAsics\b/gi, 'ASICS')
    .replace(/\bJordan\b/gi, 'Jordan')
    .replace(/\bNew Balance\b/gi, 'New Balance')
    .replace(/\bUnder Armour\b/gi, 'Under Armour')
    .replace(/\bSkechers\b/gi, 'Skechers')
    .replace(/\bBrooks\b/gi, 'Brooks');
}

const mod = await import(pathToFileURL(catalogPath).href);
const products = mod.FOOTWEAR_SEED_PRODUCTS || [];

const polished = products.map((p, i) => {
  const dd = { ...(p.domain_data || {}) };
  const sourcing = dd.sourcing || (String(p.brand || '').match(/Bata|Service|Borjan|Stylo|Metro|Ndure|ECS|Servis/i) ? 'local' : 'imported');

  let color = String(dd.color || '').trim();
  const colorAsCondition = normalizeCondition(color);
  const inferred = inferColorFromName(p.name);
  if (!color || CONDITION_LABELS.has(color.toLowerCase()) || colorAsCondition) {
    color = inferred;
  } else if (color !== 'Multi' && !new RegExp(`\\b${color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s*\/\s*/g, '\\s*\\/\\s*')}\\b`, 'i').test(p.name)) {
    // Drop leftover false positives (e.g. "tan" matching inside "Stand")
    color = inferred;
  }

  let condition = normalizeCondition(dd.condition) || colorAsCondition;
  if (!condition) {
    condition = sourcing === 'local' ? 'new' : i % 5 === 0 ? 'premium_plus' : i % 4 === 0 ? 'excellent' : 'premium';
  }

  const name = p.name === String(p.name).toUpperCase() && /[A-Z]/.test(p.name) ? titleCaseName(p.name) : p.name;
  const description = cleanDescription({
    name,
    brand: p.brand,
    size: dd.size,
    color,
    style: dd.style,
    condition,
    sourcing,
  });

  return {
    ...p,
    name,
    description,
    domain_data: {
      ...dd,
      color,
      condition,
      sourcing,
      brand: p.brand,
    },
  };
});

function emitProduct(p) {
  const dd = p.domain_data || {};
  return `  shoeProduct({
    name: ${JSON.stringify(p.name)},
    brand: ${JSON.stringify(p.brand)},
    category: ${JSON.stringify(p.category)},
    sku: ${JSON.stringify(p.sku)},
    price: ${Number(p.price) || 5000},
    compare_price: ${Number(p.compare_price) || Math.round((p.price || 5000) * 1.4)},
    stock: ${Number(p.stock) || 12},
    featured: ${Boolean(p.is_featured)},
    image: ${JSON.stringify(p.image_url || '')},
    description: ${JSON.stringify(p.description || '')},
    domain_data: {
      articlenumber: ${JSON.stringify(dd.articlenumber || p.sku)},
      size: ${JSON.stringify(dd.size || '')},
      color: ${JSON.stringify(dd.color || 'Multi')},
      material: ${JSON.stringify(dd.material || 'Mixed')},
      style: ${JSON.stringify(dd.style || 'Casual')},
      gender: ${JSON.stringify(dd.gender || 'unisex')},
      condition: ${JSON.stringify(dd.condition || 'premium')},
      sourcing: ${JSON.stringify(dd.sourcing || 'imported')},
      brand: ${JSON.stringify(p.brand)},
    },
  })`;
}

const header = `/**
 * Tenvo Footwear demo / registration catalog.
 * Imported SKUs from Khazanay archive handles; local PK brands for country-aware mix.
 * Images: Khazanay CDN when scraped, Nike archive heroes for marketing assets.
 */
import {
  FOOTWEAR_HERO_IMAGES,
  FOOTWEAR_CATEGORY_IMAGES,
  FOOTWEAR_CONDITION_IMAGES,
} from './footwearArchiveAssets.js';

/** @type {string[]} */
export const FOOTWEAR_SEED_CATEGORIES = [
  "Men's Shoes",
  "Women's Shoes",
  "Kids Shoes",
  'Sports Shoes',
  'Casual',
  'Sandals',
  'Boots',
  'Orthopedic',
  'Accessories',
  'Leather Goods',
];

/**
 * @param {object} partial
 * @returns {Record<string, unknown>}
 */
function shoeProduct(partial) {
  const {
    name,
    brand,
    category,
    sku,
    price,
    compare_price,
    unit = 'pair',
    stock = 16,
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
    compare_price: compare_price ?? Math.round(Number(price) * 1.4),
    cost_price: cost,
    stock,
    sku,
    description:
      description ||
      \`\${name}. \${brand} \${String(category || 'footwear').toLowerCase()} with size \${domain_data.size || 'as marked'}.\`,
    image_url: image,
    imageCredit: domain_data.sourcing === 'local' ? 'Local brand seed' : 'Khazanay archive reference',
    is_featured: featured,
    domain_data: {
      articlenumber: domain_data.articlenumber || sku,
      size: domain_data.size || '',
      color: domain_data.color || '',
      material: domain_data.material || 'Mixed',
      style: domain_data.style || 'Casual',
      gender: domain_data.gender || 'unisex',
      condition: domain_data.condition || 'premium',
      sourcing: domain_data.sourcing || 'imported',
      brand: brand,
      ...domain_data,
    },
  };
}

/** Marketing hero for gallery / demo meta */
export const FOOTWEAR_MARKETING_HERO_IMAGE = FOOTWEAR_HERO_IMAGES.hero1;

/** @type {Array<Record<string, unknown>>} */
export const FOOTWEAR_SEED_PRODUCTS = [
${polished.map(emitProduct).join(',\n')},
];

export default FOOTWEAR_SEED_PRODUCTS;
`;

fs.writeFileSync(catalogPath, header);
const badColors = polished.filter((p) => CONDITION_LABELS.has(String(p.domain_data?.color || '').toLowerCase()));
console.log(`Polished ${polished.length} footwear products (bad color leftovers: ${badColors.length})`);
