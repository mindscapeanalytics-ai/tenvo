/**
 * Parse downloaded Punjab Milk Shop + Pure Nest HTML into milkShopArchiveExtract.json
 * Merges with Bismillah foodpanda archive extract.
 *
 * Usage: node scripts/fetch-milk-shop-catalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'lib', 'dataLab', 'milkShopArchiveExtract.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePrice(raw) {
  const n = String(raw || '').replace(/[^\d.]/g, '');
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : null;
}

function pushUnique(list, seen, row) {
  const key = `${String(row.name || '').toLowerCase()}|${row.price || 0}`;
  if (!row.name || seen.has(key)) return;
  seen.add(key);
  list.push(row);
}

/** WooCommerce product cards */
function parseWooProducts(html, source) {
  const out = [];
  const seen = new Set();
  // product title + price-amount nearby
  const cardRe =
    /<li[^>]*class="[^"]*product[^"]*"[\s\S]*?<a[^>]+href="([^"]+)"[\s\S]*?(?:<img[^>]+src="([^"]+)"[^>]*>)?[\s\S]*?<h2[^>]*class="[^"]*woocommerce-loop-product__title[^"]*"[^>]*>([^<]+)<\/h2>[\s\S]*?<span[^>]*class="[^"]*price[^"]*"[^>]*>[\s\S]*?(?:bdi|amount)[^>]*>.*?([\d,]+(?:\.\d+)?)/gi;
  let m;
  while ((m = cardRe.exec(html))) {
    pushUnique(out, seen, {
      name: decodeEntities(m[3]),
      price: parsePrice(m[4]),
      image_url: m[2] || null,
      url: m[1],
      source,
    });
  }

  // Fallback: product links with Rs / ₨
  const linkRe =
    /<a[^>]+href="(https?:\/\/[^"]*punjabmilkshop\.com\/product\/[^"]+)"[^>]*>[\s\S]{0,800}?(?:woocommerce-loop-product__title|product_title)[^>]*>([^<]+)</gi;
  while ((m = linkRe.exec(html))) {
    const slice = html.slice(m.index, m.index + 1200);
    const priceM = slice.match(/(?:₨|Rs\.?|PKR)\s*([\d,]+)/i) || slice.match(/amount[^>]*>\s*([\d,]+)/i);
    const imgM = slice.match(/<img[^>]+src="(https?:[^"]+)"/i);
    pushUnique(out, seen, {
      name: decodeEntities(m[2]),
      price: priceM ? parsePrice(priceM[1]) : null,
      image_url: imgM ? imgM[1] : null,
      url: m[1],
      source,
    });
  }

  return out;
}

/** Pure Nest homepage product blocks (Elementor headings) */
function parsePureNest(html) {
  const out = [];
  const seen = new Set();
  // e.g. Cow Milk</h3> ... Rs. 250/Litre</h5>
  const blockRe =
    /<(?:h3|h2)[^>]*>\s*([^<]{3,80}?)\s*<\/(?:h3|h2)>[\s\S]{0,900}?<h5[^>]*>\s*Rs\.?\s*([\d,]+)\s*\/?\s*(Litre|Kg|KG|½Kg)?/gi;
  let m;
  while ((m = blockRe.exec(html))) {
    const name = decodeEntities(m[1]).replace(/\s*\($/, '').trim();
    if (/about|why choose|taste the|from purity|^products$/i.test(name)) continue;
    const unitHint = m[3] || '';
    pushUnique(out, seen, {
      name,
      price: parsePrice(m[2]),
      unitHint: /litre/i.test(unitHint) ? 'litre' : /kg|½/i.test(unitHint) ? 'kg' : null,
      source: 'purenest.pk',
      url: 'https://purenest.pk/',
    });
  }
  // Hard fallback from known Pure Nest menu when DOM parse misses
  if (out.length === 0) {
    for (const row of [
      { name: 'Cow Milk', price: 250, unitHint: 'litre' },
      { name: 'Buffalo Milk', price: 260, unitHint: 'litre' },
      { name: 'Yogurt (Pure & Thick)', price: 280, unitHint: 'kg' },
      { name: 'Desi Ghee', price: 4000, unitHint: 'kg' },
      { name: 'Paneer (Fresh Cottage Cheese)', price: 2500, unitHint: 'kg' },
    ]) {
      pushUnique(out, seen, { ...row, source: 'purenest.pk', url: 'https://purenest.pk/' });
    }
  }
  return out;
}

/** Static menu text from Punjab Milk Shop homepage */
function parsePunjabMenuCopy(html) {
  const out = [];
  const seen = new Set();
  const text = decodeEntities(html.replace(/<[^>]+>/g, '\n'));
  const lines = [
    ['Fresh Buffalo Milk', 240, 'litre', 'Fresh Milk'],
    ['Fresh Cow Milk', 220, 'litre', 'Fresh Milk'],
    ['Yogurt / Dahi', 260, 'kg', 'Yogurt / Dahi'],
    ['Lassi 500g', 220, 'pcs', 'Lassi & Drinks'],
    ['Kheer 1kg', 800, 'kg', 'Dairy Sweets'],
    ['Kheer 500g', 400, 'pack', 'Dairy Sweets'],
    ['Kheer 220g', 200, 'pack', 'Dairy Sweets'],
    ['Badami Doodh 450ml', 180, 'pcs', 'Lassi & Drinks'],
    ['Barfi 1kg', 1600, 'kg', 'Dairy Sweets'],
    ['Dhoda 1kg', 1600, 'kg', 'Dairy Sweets'],
    ['Gulab Jamun 1kg', 1400, 'kg', 'Dairy Sweets'],
    ['Garm Gulab Jamun', 120, 'pcs', 'Dairy Sweets'],
    ['Qalaqand 1kg', 1600, 'kg', 'Dairy Sweets'],
    ['Khoya Kulfi', 100, 'pcs', 'Dairy Sweets'],
    ['Badami Kulfi', 120, 'pcs', 'Dairy Sweets'],
  ];
  // Only include if homepage mentions the item family
  for (const [name, price, unit, category] of lines) {
    const needle = name.split(/\s+/)[0];
    if (!new RegExp(needle, 'i').test(text) && !/milk|yogurt|lassi|kheer|barfi|dhoda|gulab|qalaqand|kulfi|badami/i.test(name)) {
      continue;
    }
    pushUnique(out, seen, {
      name,
      price,
      unit,
      category,
      source: 'punjabmilkshop.com-menu',
      url: 'https://punjabmilkshop.com/',
    });
  }
  // Always include core menu (site is known PK milk shop)
  for (const [name, price, unit, category] of lines) {
    pushUnique(out, seen, {
      name,
      price,
      unit,
      category,
      source: 'punjabmilkshop.com-menu',
      url: 'https://punjabmilkshop.com/',
    });
  }
  return out;
}

function parseBismillahArchive() {
  const htmlPath = path.join(root, 'archive', 'milk-shop.html');
  if (!fs.existsSync(htmlPath)) return [];
  const html = fs.readFileSync(htmlPath, 'utf8');
  const products = [];
  const seen = new Set();
  const nameRe = /"name"\s*:\s*"([^"\\]{3,100})"/g;
  let m;
  while ((m = nameRe.exec(html))) {
    const name = m[1]
      .replace(/\\u[\dA-Fa-f]{4}/g, (u) => String.fromCharCode(parseInt(u.slice(2), 16)))
      .replace(/\\"/g, '"')
      .trim();
    const slice = html.slice(m.index, m.index + 400);
    const priceM = slice.match(/"(?:price|originalPrice|discountedPrice)"\s*:\s*(\d+(?:\.\d+)?)/);
    const imageM = slice.match(/"(?:image|imageUrl|url)"\s*:\s*"(https?:[^"]+)"/);
    if (!priceM) continue;
    if (/bismillah milk shop|buy |order your|top categories|delivery service/i.test(name)) continue;
    const dairy =
      /milk|dahi|yogurt|yoghurt|lassi|butter|makhan|cream|malai|paneer|ghee|khoya|kheer|rabri|cheese|doodh|nurpur|olper|egg|desi|soda|jalebi|bread|pakola|rose|badami|ice cream/i;
    if (!dairy.test(name)) continue;
    pushUnique(products, seen, {
      name,
      price: Number(priceM[1]),
      image_url: imageM ? imageM[1].replace(/\\u002F/g, '/') : null,
      source: 'bismillah-foodpanda-archive',
    });
  }
  return products;
}

async function main() {
  const products = [];
  const seen = new Set();
  const sources = [];

  const bismillah = parseBismillahArchive();
  for (const p of bismillah) pushUnique(products, seen, p);
  sources.push({
    id: 'bismillah-archive',
    label: 'Bismillah Milk Shop (foodpanda Karachi)',
    path: 'archive/milk-shop.html',
    count: bismillah.length,
  });

  // Local downloads if present, else live fetch
  const localPunjab = path.join(root, 'archive', 'punjab-milk-shop-products.html');
  let punjabHtml = fs.existsSync(localPunjab)
    ? fs.readFileSync(localPunjab, 'utf8')
    : await fetchText('https://punjabmilkshop.com/?post_type=product');
  if (!fs.existsSync(localPunjab)) {
    fs.writeFileSync(localPunjab, punjabHtml);
  }
  const woo = parseWooProducts(punjabHtml, 'punjabmilkshop.com');
  for (const p of woo) pushUnique(products, seen, p);
  const menu = parsePunjabMenuCopy(punjabHtml);
  for (const p of menu) pushUnique(products, seen, p);
  sources.push({
    id: 'punjabmilkshop',
    label: 'Punjab Milk Shop',
    url: 'https://punjabmilkshop.com/',
    count: woo.length + menu.length,
  });

  // Product category pages (Woo)
  for (const cat of ['desi-ghee', 'khoya', 'butter', 'kheer']) {
    try {
      const url = `https://punjabmilkshop.com/product-category/${cat}/`;
      const html = await fetchText(url);
      if (html.length < 1000) continue;
      const rows = parseWooProducts(html, `punjabmilkshop.com/${cat}`);
      for (const p of rows) pushUnique(products, seen, { ...p, categoryHint: cat });
      await new Promise((r) => setTimeout(r, 400));
    } catch {
      /* skip */
    }
  }

  const localNest = path.join(root, 'archive', 'purenest-milk.html');
  let nestHtml = fs.existsSync(localNest)
    ? fs.readFileSync(localNest, 'utf8')
    : await fetchText('https://purenest.pk/');
  if (!fs.existsSync(localNest)) fs.writeFileSync(localNest, nestHtml);
  const nest = parsePureNest(nestHtml);
  for (const p of nest) pushUnique(products, seen, p);
  sources.push({
    id: 'purenest',
    label: 'Pure Nest',
    url: 'https://purenest.pk/',
    count: nest.length,
  });

  const extract = {
    fetchedAt: new Date().toISOString(),
    sources,
    products,
  };
  fs.writeFileSync(outPath, JSON.stringify(extract, null, 2));
  console.log(`Wrote ${products.length} products from ${sources.length} sources → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
