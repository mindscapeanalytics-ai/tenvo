#!/usr/bin/env node
/**
 * Parse archive/electronics.html + telemartArchiveExtract.json + supplements
 * → electronicsDemoCatalog.js
 * Run: node scripts/build-electronics-seed-catalog.mjs
 * Refresh Telemart: node scripts/fetch-telemart-electronics-catalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ELECTRONICS_SUPPLEMENT_PRODUCTS } from '../lib/dataLab/electronicsSupplementProducts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const archivePath = path.join(root, 'archive', 'electronics.html');
const extractPath = path.join(root, 'lib', 'dataLab', 'electronicsArchiveExtract.json');
const telemartPath = path.join(root, 'lib', 'dataLab', 'telemartArchiveExtract.json');
const catalogPath = path.join(root, 'lib', 'dataLab', 'electronicsDemoCatalog.js');

const MAX_PER_CATEGORY = 8;
const MAX_TOTAL = 72;

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&#x20;/g, ' ')
    .replace(/&#x7C;/g, '|')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function slugSku(name) {
  const base = decodeEntities(name)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `TE-${base || 'SKU'}`;
}

function inferCategory(name) {
  const n = name.toLowerCase();
  if (/watch|ultron|thunder|epic|fortuner/.test(n)) return 'Gadgets & Wearables';
  if (/speaker|play|buddy|pulse|sound|booster/.test(n)) return 'Gadgets & Wearables';
  if (/ton|inverter|air.?cond|a\/c|\bac\b|pel/.test(n)) return 'Air Conditioners';
  if (/fridge|refrigerat/.test(n)) return 'Refrigerators';
  if (/tv|led/.test(n)) return 'LED TVs';
  if (/wash/.test(n)) return 'Washing Machines';
  return 'Gadgets & Wearables';
}

function inferBrand(name) {
  const n = decodeEntities(name);
  if (/^YOLO/i.test(n)) return 'YOLO';
  if (/^PEL/i.test(n)) return 'PEL';
  if (/Samsung/i.test(n)) return 'Samsung';
  if (/^LG\b/i.test(n)) return 'LG';
  const first = n.split(/\s+/)[0];
  return first || 'Generic';
}

function inferCapacity(name, category) {
  const ton = name.match(/(\d+(?:\.\d+)?)\s*Ton/i);
  if (ton) return `${ton[1]} Ton`;
  const inch = name.match(/(\d+)\s*["″]/);
  if (inch && category === 'LED TVs') return `${inch[1]}"`;
  const kg = name.match(/(\d+)\s*KG/i);
  if (kg) return `${kg[1]} KG`;
  return '';
}

function warrantyFor() {
  return '1 Year';
}

const html = fs.readFileSync(archivePath, 'utf8');
const products = [];
const blocks = html.split(/<li class="item product product-item">/).slice(1);
for (const block of blocks) {
  const nameMatch = block.match(/product-item-link" href="([^"]+)">\s*([^<]+)<\/a>/);
  const priceMatch = block.match(/data-price-amount="(\d+(?:\.\d+)?)"/);
  const imageMatch = block.match(
    /data-lazysrc="(https:\/\/imraneshop\.com\/pub\/media\/catalog\/product[^"]+)"/
  );
  if (!nameMatch || !priceMatch) continue;
  const url = nameMatch[1];
  const name = decodeEntities(nameMatch[2]);
  const price = Number(priceMatch[1]);
  const image = imageMatch?.[1] || '';
  if (!name || !price) continue;
  const category = inferCategory(name);
  const brand = inferBrand(name);
  const capacity = inferCapacity(name, category);
  products.push({
    sourceUrl: url,
    name,
    brand,
    category,
    price,
    image_url: image,
    sku: slugSku(name),
    domain_data: {
      brand,
      model: name.replace(new RegExp(`^${brand}\\s*[|\\-]?\\s*`, 'i'), '').slice(0, 80) || name,
      warranty: warrantyFor(),
      specifications: category === 'Air Conditioners' ? 'Inverter, Hot & Cold' : '',
      capacity,
      screensize: category === 'LED TVs' ? capacity : '',
    },
  });
}

const seen = new Set();
const unique = products.filter((p) => {
  if (seen.has(p.sku)) return false;
  seen.add(p.sku);
  return true;
});

const extract = {
  source: 'archive/electronics.html',
  sourceSite: 'https://imraneshop.com/gadgets.html',
  scrapedAt: new Date().toISOString().slice(0, 10),
  productCount: unique.length,
  products: unique,
};
fs.writeFileSync(extractPath, `${JSON.stringify(extract, null, 2)}\n`);

/** License-safe Unsplash demos for Imran archive rows (hotlink-blocked). */
const ELECTRONICS_DEMO_IMAGES = {
  'Air Conditioners':
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=900&q=80&auto=format&fit=crop',
  Refrigerators:
    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=900&q=80&auto=format&fit=crop',
  'LED TVs':
    'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=900&q=80&auto=format&fit=crop',
  'Washing Machines':
    'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=900&q=80&auto=format&fit=crop',
  'Kitchen Appliances':
    'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=900&q=80&auto=format&fit=crop',
  'Cooling & Fans':
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80&auto=format&fit=crop',
  'Deep Freezers':
    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=900&q=80&auto=format&fit=crop',
  'Water Dispensers':
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80&auto=format&fit=crop',
  'Small Appliances':
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80&auto=format&fit=crop',
  watch:
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80&auto=format&fit=crop',
  speaker:
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=900&q=80&auto=format&fit=crop',
  gadgets:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=80&auto=format&fit=crop',
};

function resolveElectronicsDemoImage(row) {
  const name = String(row.name || '');
  const category = String(row.category || '');
  if (/watch|ultron|thunder|epic|fortuner/i.test(name)) return ELECTRONICS_DEMO_IMAGES.watch;
  if (/speaker|play|buddy|pulse|sound|booster/i.test(name)) return ELECTRONICS_DEMO_IMAGES.speaker;
  if (ELECTRONICS_DEMO_IMAGES[category]) return ELECTRONICS_DEMO_IMAGES[category];
  if (category === 'Gadgets & Wearables') return ELECTRONICS_DEMO_IMAGES.gadgets;
  return ELECTRONICS_DEMO_IMAGES.gadgets;
}

function toSeedFromArchive(row, index) {
  const price = Number(row.price);
  const cost = Math.round(price * 0.82);
  return {
    name: row.name,
    brand: row.brand,
    category: row.category,
    unit: 'pcs',
    price,
    compare_price: Math.round(price * 1.08),
    cost_price: cost,
    stock: row.category === 'Air Conditioners' ? 6 : 18,
    sku: row.sku,
    description: `${row.name}. Genuine ${row.brand} ${String(row.category || 'electronics').toLowerCase()} with official warranty support.`,
    image_url: resolveElectronicsDemoImage(row),
    imageCredit: 'Unsplash demo',
    is_featured: index < 3,
    domain_data: {
      model: row.domain_data?.model || row.name,
      warranty: row.domain_data?.warranty || '1 Year',
      specifications: row.domain_data?.specifications || '',
      capacity: row.domain_data?.capacity || '',
      screensize: row.domain_data?.screensize || '',
      brand: row.brand,
      ...(row.domain_data || {}),
    },
  };
}

function toSeedFromTelemart(row, index) {
  const price = Number(row.price);
  const compare = Number(row.compare_price) || Math.round(price * 1.08);
  const image = String(row.image_url || '').split('?')[0];
  return {
    name: row.name,
    brand: row.brand,
    category: row.category,
    unit: 'pcs',
    price,
    compare_price: compare > price ? compare : Math.round(price * 1.08),
    cost_price: Math.round(price * 0.82),
    stock: 8 + (index % 12),
    sku: row.sku,
    description: row.description || `${row.name}. Official warranty support.`,
    image_url: image || resolveElectronicsDemoImage(row),
    imageCredit: image.includes('shopify') ? 'Telemart / Shopify CDN' : 'Unsplash demo',
    is_featured: index < 6 || /inverter|qled|smart/i.test(String(row.name)),
    domain_data: {
      brand: row.brand,
      model: row.domain_data?.model || row.handle || row.name,
      warranty: row.domain_data?.warranty || '1 Year',
      specifications: row.domain_data?.specifications || row.category,
      capacity: row.domain_data?.capacity || '',
      screensize: row.domain_data?.screensize || '',
      energylabel: row.domain_data?.energylabel || '',
    },
  };
}

function capByCategory(rows, maxPer, maxTotal) {
  const counts = new Map();
  const out = [];
  for (const row of rows) {
    if (out.length >= maxTotal) break;
    const cat = row.category || 'Other';
    const n = counts.get(cat) || 0;
    if (n >= maxPer) continue;
    counts.set(cat, n + 1);
    out.push(row);
  }
  return out;
}

let telemartRows = [];
if (fs.existsSync(telemartPath)) {
  try {
    const tm = JSON.parse(fs.readFileSync(telemartPath, 'utf8'));
    telemartRows = Array.isArray(tm.products) ? tm.products : [];
  } catch {
    telemartRows = [];
  }
}

const archiveSeeds = unique.map(toSeedFromArchive);
const telemartSeeds = capByCategory(telemartRows.map(toSeedFromTelemart), MAX_PER_CATEGORY, MAX_TOTAL);

const skuSeen = new Set();
const seedProducts = [];
for (const row of [...telemartSeeds, ...archiveSeeds, ...ELECTRONICS_SUPPLEMENT_PRODUCTS]) {
  const sku = String(row.sku || '').toLowerCase();
  if (!sku || skuSeen.has(sku)) continue;
  skuSeen.add(sku);
  seedProducts.push(row);
  if (seedProducts.length >= MAX_TOTAL + ELECTRONICS_SUPPLEMENT_PRODUCTS.length) break;
}

const acImage =
  seedProducts.find((p) => p.category === 'Air Conditioners')?.image_url ||
  seedProducts.find((p) => p.category === 'LED TVs')?.image_url ||
  seedProducts[0]?.image_url ||
  '';
const watchImage =
  seedProducts.find((p) => /watch/i.test(String(p.name)))?.image_url || acImage;

const catalogJs = `/**
 * Tenvo Electronics demo / registration catalog.
 * Built from Telemart Shopify collections + archive/electronics.html + supplements.
 * Regenerate: node scripts/fetch-telemart-electronics-catalog.mjs && node scripts/build-electronics-seed-catalog.mjs
 */

/** @type {string[]} */
export const ELECTRONICS_SEED_CATEGORIES = [
  'Air Conditioners',
  'Refrigerators',
  'LED TVs',
  'Washing Machines',
  'Deep Freezers',
  'Kitchen Appliances',
  'Water Dispensers',
  'Cooling & Fans',
  'Gadgets & Wearables',
  'Small Appliances',
];

/** @type {Array<Record<string, unknown>>} */
export const ELECTRONICS_SEED_PRODUCTS = ${JSON.stringify(seedProducts, null, 2)};

/** Marketing / gallery hero */
export const ELECTRONICS_MARKETING_HERO_IMAGE = ${JSON.stringify(acImage)};

export const ELECTRONICS_DEMO_HERO_SLIDES = [
  {
    title: 'Power your home with genuine electronics',
    subtitle: 'Appliances and gadgets with official warranty and Karachi delivery.',
    image: ELECTRONICS_MARKETING_HERO_IMAGE,
    cta: 'Shop appliances',
    href: '/products',
  },
  {
    title: 'Gadgets and wearables for every day',
    subtitle: 'Smart watches, speakers, and accessories from trusted brands.',
    image: ${JSON.stringify(watchImage)},
    cta: 'Shop gadgets',
    href: '/products?category=gadgets-wearables',
  },
  {
    title: 'Ask about easy installment plans',
    subtitle: 'Enquire via contact. Our team will help you choose a plan that fits.',
    image: ELECTRONICS_MARKETING_HERO_IMAGE,
    cta: 'Installment enquiry',
    href: '/contact?subject=installment',
  },
];
`;

fs.writeFileSync(catalogPath, catalogJs);
console.log(
  `Wrote catalog: telemart capped ${telemartSeeds.length}, archive ${archiveSeeds.length}, supplements ${ELECTRONICS_SUPPLEMENT_PRODUCTS.length} → ${seedProducts.length} SKUs`
);
console.log(`→ ${catalogPath}`);
