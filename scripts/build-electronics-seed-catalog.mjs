#!/usr/bin/env node
/**
 * Parse archive/electronics.html → electronicsArchiveExtract.json + regenerate electronicsDemoCatalog.js
 * Run: node scripts/build-electronics-seed-catalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ELECTRONICS_SUPPLEMENT_PRODUCTS } from '../lib/dataLab/electronicsSupplementProducts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const archivePath = path.join(root, 'archive', 'electronics.html');
const extractPath = path.join(root, 'lib', 'dataLab', 'electronicsArchiveExtract.json');
const catalogPath = path.join(root, 'lib', 'dataLab', 'electronicsDemoCatalog.js');

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

function warrantyFor(category) {
  if (category === 'Air Conditioners') return '1 Year';
  if (category === 'Gadgets & Wearables') return '1 Year';
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
      warranty: warrantyFor(category),
      specifications: category === 'Air Conditioners' ? 'Inverter, Hot & Cold' : '',
      capacity,
      screensize: category === 'LED TVs' ? capacity : '',
    },
  });
}

// Dedupe by sku
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

fs.writeFileSync(extractPath, JSON.stringify(extract, null, 2) + '\n');

function toSeedProduct(row, index) {
  const price = Number(row.price);
  const cost = Math.round(price * 0.82);
  const featured = index < 4 || row.category === 'Air Conditioners';
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
    image_url: row.image_url,
    imageCredit: 'Archive seed',
    is_featured: featured,
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

const seedProducts = [...unique.map(toSeedProduct), ...ELECTRONICS_SUPPLEMENT_PRODUCTS];
const acImage =
  seedProducts.find((p) => p.category === 'Air Conditioners')?.image_url ||
  seedProducts[0]?.image_url ||
  '';
const watchImage =
  seedProducts.find((p) => /watch/i.test(String(p.name)))?.image_url || acImage;

const catalogJs = `/**
 * Tenvo Electronics demo / registration catalog.
 * Built from archive/electronics.html (Imran eShop Gadgets reference).
 * Regenerate: node scripts/build-electronics-seed-catalog.mjs
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
console.log(`Wrote ${unique.length} archive + ${ELECTRONICS_SUPPLEMENT_PRODUCTS.length} supplement = ${seedProducts.length} products → ${catalogPath}`);
console.log(`Wrote extract → ${extractPath}`);
