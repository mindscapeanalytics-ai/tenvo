#!/usr/bin/env node
/**
 * Fetch Telemart Shopify collection products (appliances + gadgets) → telemartArchiveExtract.json
 * Then run: node scripts/build-electronics-seed-catalog.mjs
 *
 * Usage: node scripts/fetch-telemart-electronics-catalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'lib', 'dataLab', 'telemartArchiveExtract.json');

const COLLECTIONS = [
  { handle: 'air-conditioners', category: 'Air Conditioners' },
  { handle: 'refrigerators', category: 'Refrigerators' },
  { handle: 'deep-freezers', category: 'Deep Freezers' },
  { handle: 'washing-machines', category: 'Washing Machines' },
  { handle: 'led-tvs', category: 'LED TVs' },
  { handle: 'qled', category: 'LED TVs' },
  { handle: 'smart-leds', category: 'LED TVs' },
  { handle: 'microwave-ovens', category: 'Kitchen Appliances' },
  { handle: 'kitchen-appliances', category: 'Kitchen Appliances' },
  { handle: 'small-home-appliances', category: 'Small Appliances' },
  { handle: 'water-dispensers', category: 'Water Dispensers' },
  { handle: 'fans-2', category: 'Cooling & Fans' },
  { handle: 'fans-in-pakistan', category: 'Cooling & Fans' },
  { handle: 'room-cooler', category: 'Cooling & Fans' },
  { handle: 'bluetooth-speakers', category: 'Gadgets & Wearables' },
  { handle: 'portable-speakers', category: 'Gadgets & Wearables' },
  { handle: 'smart-watches', category: 'Gadgets & Wearables' },
  { handle: 'gadgets-accessories', category: 'Gadgets & Wearables' },
];

const UA = 'Mozilla/5.0 (compatible; TenvoCatalogBot/1.0; +https://www.tenvo.store)';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
}

function inferBrand(title, vendor) {
  const v = String(vendor || '').trim();
  if (v && !/^telemart$/i.test(v)) return v;
  const t = String(title || '');
  const known = [
    'Haier',
    'Dawlance',
    'Samsung',
    'LG',
    'PEL',
    'Gree',
    'Orient',
    'Kenwood',
    'Philips',
    'Midea',
    'TCL',
    'Sony',
    'Xiaomi',
    'Audionic',
    'YOLO',
    'Westpoint',
    'Anex',
    'Boss',
    'Homage',
  ];
  for (const b of known) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(t)) return b;
  }
  return t.split(/\s+/)[0] || 'Generic';
}

function inferCapacity(title, category) {
  const n = String(title || '');
  const ton = n.match(/(\d+(?:\.\d+)?)\s*(?:Ton|T)\b/i);
  if (ton) return `${ton[1]} Ton`;
  const cu = n.match(/(\d+(?:\.\d+)?)\s*(?:cu\.?\s*ft|cubic)/i);
  if (cu) return `${cu[1]} cu ft`;
  const kg = n.match(/(\d+(?:\.\d+)?)\s*KG\b/i);
  if (kg) return `${kg[1]} KG`;
  const inch = n.match(/(\d+)\s*(?:["″]|inch|in)\b/i);
  if (inch && /tv|led|qled|oled/i.test(category + n)) return `${inch[1]}"`;
  const lit = n.match(/(\d+)\s*L(?:itre|iter)?\b/i);
  if (lit) return `${lit[1]}L`;
  return '';
}

function skuFromHandle(handle) {
  const base = String(handle || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `TM-${base || 'SKU'}`;
}

function isFashionNoise(title, productType, tags) {
  const hay = `${title} ${productType} ${(tags || []).join(' ')}`.toLowerCase();
  return /fashion|perfume|fragrance|sneaker|clutch|abaya|fabric|kameez|makeup|lipstick|nighty|camisole|handbag|heel|sandal/.test(
    hay
  );
}

async function fetchCollection(handle) {
  const url = `https://www.telemart.pk/collections/${handle}/products.json?limit=50`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
      });
      if (!res.ok) {
        console.warn(`  skip ${handle}: HTTP ${res.status}`);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data.products) ? data.products : [];
    } catch (err) {
      console.warn(`  ${handle} attempt ${attempt} failed: ${err.cause?.code || err.message}`);
      await sleep(1200 * attempt);
    }
  }
  return [];
}

const products = [];
const seen = new Set();

// Merge with prior extract so rate-limit skips do not wipe earlier collections.
if (fs.existsSync(outPath)) {
  try {
    const prev = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    for (const row of prev.products || []) {
      const key = row.handle || row.sku;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      products.push(row);
    }
    console.log(`Loaded ${products.length} from existing extract`);
  } catch {
    /* ignore */
  }
}

for (const col of COLLECTIONS) {
  process.stdout.write(`fetch ${col.handle}… `);
  const rows = await fetchCollection(col.handle);
  let kept = 0;
  for (const p of rows) {
    if (isFashionNoise(p.title, p.product_type, p.tags)) continue;
    const handle = p.handle;
    if (!handle || seen.has(handle)) continue;
    const variant = (p.variants && p.variants[0]) || {};
    const price = Number(variant.price);
    if (!price || Number.isNaN(price)) continue;
    const compare = Number(variant.compare_at_price) || null;
    const image =
      p.images?.[0]?.src ||
      p.image?.src ||
      '';
    if (!image) continue;
    seen.add(handle);
    const brand = inferBrand(p.title, p.vendor);
    const capacity = inferCapacity(p.title, col.category);
    products.push({
      source: 'telemart',
      sourceUrl: `https://www.telemart.pk/products/${handle}`,
      handle,
      name: String(p.title || '').trim(),
      brand,
      category: col.category,
      price,
      compare_price: compare && compare > price ? compare : Math.round(price * 1.08),
      image_url: image.split('?')[0],
      sku: skuFromHandle(handle),
      description: stripHtml(p.body_html) || `${p.title}. Available via Tenvo Electronics demo catalog.`,
      domain_data: {
        brand,
        model: handle.replace(/-/g, ' ').slice(0, 80),
        warranty: '1 Year',
        specifications: String(p.product_type || col.category),
        capacity,
        screensize: col.category === 'LED TVs' ? capacity : '',
        energylabel: /inverter/i.test(p.title) ? 'Inverter' : '',
      },
    });
    kept += 1;
  }
  console.log(`${rows.length} raw → ${kept} kept`);
  await sleep(700);
}

const extract = {
  source: 'telemart.pk Shopify collections/products.json',
  scrapedAt: new Date().toISOString().slice(0, 10),
  collectionHandles: COLLECTIONS.map((c) => c.handle),
  productCount: products.length,
  products,
};

fs.writeFileSync(outPath, `${JSON.stringify(extract, null, 2)}\n`);
console.log(`Wrote ${products.length} products → ${outPath}`);
