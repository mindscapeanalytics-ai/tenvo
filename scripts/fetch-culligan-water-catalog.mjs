/**
 * Fetch Culligan PK home-delivery page for product names, prices, and image URLs.
 * Writes lib/dataLab/waterShopArchiveExtract.json (reference only — Tenvo branding in seed).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../lib/dataLab/waterShopArchiveExtract.json');
const URL = 'https://culligan.com.pk/our-water/home-delivery';

const res = await fetch(URL, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; TenvoSeedBot/1.0; +https://www.tenvo.store)',
    Accept: 'text/html',
  },
});
if (!res.ok) {
  console.error('Fetch failed', res.status);
  process.exit(1);
}
const html = await res.text();

const imgs = [...html.matchAll(/https?:\/\/[^"'\\\s>]+\.(?:jpg|jpeg|png|webp|avif)/gi)].map(
  (m) => m[0].replace(/&amp;/g, '&')
);
const uniqImgs = [...new Set(imgs)];

/** Heuristic product blocks from Woo-style markup */
const products = [];
const priceRe =
  /(?:12|19)\s*[Ll]itre[^<]{0,80}|Cradle[^<]{0,40}|Electronic Dispenser|Homage Dispenser|Tabletop Dispenser|500\s*ml[^<]{0,60}/gi;
const priceHits = [...html.matchAll(/Rs\.?\s*([\d,]+)/gi)].map((m) =>
  Number(String(m[1]).replace(/,/g, ''))
);

const named = [
  { name: '12 Litre Bottle', price: 275, skuHint: '12L' },
  { name: '19 Litre Bottle', price: 380, skuHint: '19L' },
  { name: 'Cradle Tap Stand', price: 1000, skuHint: 'cradle' },
  { name: 'Electronic Dispenser', price: 2000, skuHint: 'electronic' },
  { name: 'Homage Dispenser', price: 27500, skuHint: 'homage' },
  { name: 'Tabletop Dispenser', price: 950, skuHint: 'tabletop' },
  { name: '500 ml Bottle (Case of 12)', price: null, skuHint: '500' },
];

for (const n of named) {
  const img =
    uniqImgs.find((u) => new RegExp(n.skuHint, 'i').test(u)) ||
    uniqImgs.find((u) => /product|bottle|dispenser|water/i.test(u));
  products.push({ ...n, image: img || null });
}

const payload = {
  source: URL,
  fetchedAt: new Date().toISOString(),
  note: 'Reference prices/images from Culligan PK home delivery. Tenvo demo uses Tenvo branding.',
  depositNote:
    '19L min order 3 units; security deposit ~PKR 800 per bottle (refundable on account close).',
  couponNote: 'Coupon book 11×19L ≈ Rs 4070 (~Rs 370/bottle).',
  workflow: [
    'Sign up or call UAN',
    'Receive bottles & pay (cash / account)',
    'Weekly refill on fixed delivery day',
    'Manage account / skip / change qty online',
  ],
  images: uniqImgs.slice(0, 60),
  priceSamples: priceHits.slice(0, 40),
  products,
  rawMentions: [...html.matchAll(priceRe)].map((m) => m[0]).slice(0, 30),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log('Wrote', OUT, 'images', uniqImgs.length, 'products', products.length);
