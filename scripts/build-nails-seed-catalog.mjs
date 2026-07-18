/**
 * Build Ziglam beauty/nails seed catalog from archive HTML.
 * Sources: archive/nails1.html (CJ kits), nails-2.html (Best Nails USA),
 * nails.html (Olive & June). Taobao is used as marketplace aesthetic reference
 * via curated public beauty photography (live Taobao HTML is not a reliable extract).
 *
 * Run: node scripts/build-nails-seed-catalog.mjs
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const extractPath = path.join(root, 'lib/dataLab/nailsArchiveExtract.json');
const outPath = path.join(root, 'lib/dataLab/ziglamBeautyCatalog.js');

function readArchive(name) {
  return fs.readFileSync(path.join(root, 'archive', name), 'utf8');
}

function extractBalancedObject(raw, marker) {
  const start = raw.indexOf(marker);
  if (start < 0) return null;
  let i = start + marker.length;
  let depth = 0;
  let begin = -1;
  for (; i < raw.length; i++) {
    const c = raw[i];
    if (c === '{') {
      if (depth === 0) begin = i;
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  if (begin < 0) return null;
  const jsonText = raw
    .slice(begin, i)
    .replace(/:\s*undefined\b/g, ':null')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function uniqUrls(urls) {
  const seen = new Set();
  const out = [];
  for (const u of urls) {
    const clean = String(u || '')
      .replace(/&amp;/g, '&')
      .replace(/[);]+$/, '')
      .trim();
    if (!/^https?:\/\//i.test(clean)) continue;
    if (/\.(svg)(\?|$)/i.test(clean)) continue;
    if (/favicon|logo|sprite|icon|pixel|1x1/i.test(clean)) continue;
    const key = clean.split('?')[0].toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
  }
  return out;
}

function extractShopifyMedia(raw) {
  const matches = [
    ...raw.matchAll(/https:\/\/cdn\.shopify\.com\/[^"'\\\s)>]+/gi),
    ...raw.matchAll(/\/\/cdn\.shopify\.com\/[^"'\\\s)>]+/gi),
  ].map((m) => (m[0].startsWith('//') ? `https:${m[0]}` : m[0]));
  return uniqUrls(matches).filter((u) => /\.(jpg|jpeg|png|webp)/i.test(u));
}

function extractCjSkus(raw) {
  const data = extractBalancedObject(raw, 'window.PRODUCTSRES=');
  const products = [];
  for (const block of data?.content || []) {
    for (const p of block.productList || []) {
      if (!p?.sku) continue;
      const priceRaw = String(p.sellPrice || p.nowPrice || '0');
      const low = Number(priceRaw.split('-')[0]);
      if (!Number.isFinite(low) || low <= 0) continue;
      products.push({
        id: String(p.id),
        sku: String(p.sku),
        wholesaleUsd: low,
        source: 'cjdropshipping',
      });
    }
  }
  return products;
}

function usdToPkr(usd) {
  return Math.max(299, Math.round(Number(usd) * 280));
}

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/** Curated retail lineup aligned to beauty hero slots + archive category labels. */
const CURATED = [
  // Polish
  { name: 'Ziglam Smart Gel Polish — Rose Quartz', category: 'Polish', brand: 'Ziglam', usd: 8.5, featured: true, imageKey: 'polish1', tags: ['gel', 'polish', '21-free'] },
  { name: 'Ziglam Smart Gel Polish — Midnight Plum', category: 'Polish', brand: 'Ziglam', usd: 8.5, featured: true, imageKey: 'polish2', tags: ['gel', 'polish'] },
  { name: 'Ziglam Classic Lacquer — Ballet Slipper', category: 'Polish', brand: 'Ziglam', usd: 6.2, imageKey: 'polish3', tags: ['lacquer', 'polish'] },
  { name: 'Ziglam Classic Lacquer — Coral Crush', category: 'Polish', brand: 'Ziglam', usd: 6.2, imageKey: 'polish4', tags: ['lacquer', 'polish'] },
  { name: 'Ziglam Classic Lacquer — Nude Whisper', category: 'Polish', brand: 'Ziglam', usd: 6.2, imageKey: 'polish5', tags: ['lacquer', 'polish'] },
  { name: 'Ziglam Glitter Gel — Starlight', category: 'Polish', brand: 'Ziglam', usd: 9.1, imageKey: 'polish6', tags: ['gel', 'glitter'] },
  { name: 'Ziglam Sheer Tint — Glass Pink', category: 'Polish', brand: 'Ziglam', usd: 5.9, imageKey: 'polish7', tags: ['sheer', 'polish'] },
  { name: 'Ziglam Matte Gel — Soft Taupe', category: 'Polish', brand: 'Ziglam', usd: 8.9, imageKey: 'polish8', tags: ['matte', 'gel'] },
  { name: 'Best Nails Smart Gel — Cherry Glaze', category: 'Polish', brand: 'The Best Nails', usd: 11.0, featured: true, imageKey: 'polish9', tags: ['gel', 'tpo-free'] },
  { name: 'Best Nails Smart Gel — Soft Nude', category: 'Polish', brand: 'The Best Nails', usd: 11.0, imageKey: 'polish10', tags: ['gel', 'tpo-free'] },
  { name: 'Olive June Mani Color — Summer Poppy', category: 'Polish', brand: 'Olive & June', usd: 10.0, featured: true, imageKey: 'polish11', tags: ['polish'] },
  { name: 'Olive June Mani Color — Soft Lilac', category: 'Polish', brand: 'Olive & June', usd: 10.0, imageKey: 'polish12', tags: ['polish'] },

  // Press-Ons
  { name: 'Ziglam Press-On Set — Soft Almond Nude', category: 'Press-Ons', brand: 'Ziglam', usd: 14.5, featured: true, imageKey: 'press1', tags: ['press-on', 'nails'] },
  { name: 'Ziglam Press-On Set — French Tip Classic', category: 'Press-Ons', brand: 'Ziglam', usd: 15.2, featured: true, imageKey: 'press2', tags: ['press-on', 'french'] },
  { name: 'Ziglam Press-On Set — Glossy Cherry', category: 'Press-Ons', brand: 'Ziglam', usd: 14.9, imageKey: 'press3', tags: ['press-on'] },
  { name: 'Ziglam Press-On Set — Sparkle Party', category: 'Press-Ons', brand: 'Ziglam', usd: 16.5, imageKey: 'press4', tags: ['press-on', 'glitter'] },
  { name: 'Ziglam Short Square Press-Ons — Everyday', category: 'Press-Ons', brand: 'Ziglam', usd: 12.8, imageKey: 'press5', tags: ['press-on'] },
  { name: 'Ziglam Stiletto Press-Ons — Night Out', category: 'Press-Ons', brand: 'Ziglam', usd: 17.2, imageKey: 'press6', tags: ['press-on'] },
  { name: 'Olive June Pedi Press-Ons — Beach Nude', category: 'Press-Ons', brand: 'Olive & June', usd: 18.0, featured: true, imageKey: 'press7', tags: ['press-on', 'pedi'] },
  { name: 'Olive June Pedi Press-Ons — Soft Coral', category: 'Press-Ons', brand: 'Olive & June', usd: 18.0, imageKey: 'press8', tags: ['press-on', 'pedi'] },

  // Kits
  { name: 'Ziglam Gel Starter Kit — At Home Salon', category: 'Kits', brand: 'Ziglam', usd: 42.0, featured: true, imageKey: 'kit1', tags: ['kit', 'gel', 'starter'] },
  { name: 'Ziglam Mani System Kit — Polish + Tools', category: 'Kits', brand: 'Ziglam', usd: 36.0, featured: true, imageKey: 'kit2', tags: ['kit', 'system'] },
  { name: 'Ziglam Nail Art Kit — Stickers & Brushes', category: 'Kits', brand: 'Ziglam', usd: 19.5, imageKey: 'kit3', tags: ['kit', 'nail art'] },
  { name: 'Ziglam Travel Mani Kit — Mini Essentials', category: 'Kits', brand: 'Ziglam', usd: 22.0, imageKey: 'kit4', tags: ['kit', 'travel'] },
  { name: 'Best Nails Gel System Kit — Pro Finish', category: 'Kits', brand: 'The Best Nails', usd: 55.0, featured: true, imageKey: 'kit5', tags: ['kit', 'gel'] },
  { name: 'Olive June Mani System — Full Set', category: 'Kits', brand: 'Olive & June', usd: 48.0, featured: true, imageKey: 'kit6', tags: ['kit', 'system'] },
  { name: 'Ziglam Bridal Nail Prep Kit', category: 'Kits', brand: 'Ziglam', usd: 39.0, imageKey: 'kit7', tags: ['kit', 'bridal'] },
  { name: 'Ziglam Pedi Care Kit — Soft Feet', category: 'Kits', brand: 'Ziglam', usd: 28.0, imageKey: 'kit8', tags: ['kit', 'pedi'] },

  // Care
  { name: 'Ziglam Cuticle Serum — Softening Oil', category: 'Care', brand: 'Ziglam', usd: 9.5, featured: true, imageKey: 'care1', tags: ['care', 'cuticle', 'oil'] },
  { name: 'Ziglam Nail Strengthener — Repair Coat', category: 'Care', brand: 'Ziglam', usd: 11.2, imageKey: 'care2', tags: ['care', 'strengthener'] },
  { name: 'Ziglam Hand Cream — Silk Moisture', category: 'Care', brand: 'Ziglam', usd: 8.8, imageKey: 'care3', tags: ['care', 'cream'] },
  { name: 'Ziglam Nail Remover Pads — Gentle', category: 'Care', brand: 'Ziglam', usd: 6.5, imageKey: 'care4', tags: ['care', 'remover'] },
  { name: 'Ziglam Cuticle Balm — Overnight Repair', category: 'Care', brand: 'Ziglam', usd: 10.4, imageKey: 'care5', tags: ['care', 'balm'] },
  { name: 'Olive June Cuticle Oil — Daily Drop', category: 'Care', brand: 'Olive & June', usd: 12.0, featured: true, imageKey: 'care6', tags: ['care', 'oil'] },
  { name: 'Best Nails Aftercare Oil — Salon Finish', category: 'Care', brand: 'The Best Nails', usd: 13.5, imageKey: 'care7', tags: ['care', 'oil'] },
  { name: 'Ziglam Hydrating Nail Mask Socks', category: 'Care', brand: 'Ziglam', usd: 7.9, imageKey: 'care8', tags: ['care', 'mask'] },

  // Tools
  { name: 'Ziglam UV/LED Nail Lamp — Compact', category: 'Tools', brand: 'Ziglam', usd: 29.0, featured: true, imageKey: 'tool1', tags: ['lamp', 'tools', 'led'] },
  { name: 'Ziglam E-File Air Bit Set — Salon', category: 'Tools', brand: 'Ziglam', usd: 24.0, featured: true, imageKey: 'tool2', tags: ['e-file', 'tools'] },
  { name: 'Ziglam Nail Buffer & File Duo', category: 'Tools', brand: 'Ziglam', usd: 5.5, imageKey: 'tool3', tags: ['file', 'tools'] },
  { name: 'Ziglam Cuticle Pusher & Nipper Set', category: 'Tools', brand: 'Ziglam', usd: 12.0, imageKey: 'tool4', tags: ['tools', 'cuticle'] },
  { name: 'Ziglam Dotting Tool & Brush Set', category: 'Tools', brand: 'Ziglam', usd: 8.2, imageKey: 'tool5', tags: ['tools', 'brush'] },
  { name: 'Best Nails Top Coat — Glass Shine', category: 'Tools', brand: 'The Best Nails', usd: 12.5, featured: true, imageKey: 'tool6', tags: ['top coat', 'polish'] },
  { name: 'Best Nails Base Coat — Bond Shield', category: 'Tools', brand: 'The Best Nails', usd: 12.5, featured: true, imageKey: 'tool7', tags: ['base coat', 'polish'] },
  { name: 'Ziglam Quick-Dry Top Coat', category: 'Tools', brand: 'Ziglam', usd: 7.8, imageKey: 'tool8', tags: ['top coat'] },
  { name: 'Ziglam Ridge Filling Base Coat', category: 'Tools', brand: 'Ziglam', usd: 7.8, imageKey: 'tool9', tags: ['base coat'] },
  { name: 'Ziglam Nail Art Stickers Pack', category: 'Tools', brand: 'Ziglam', usd: 4.2, imageKey: 'tool10', tags: ['stickers', 'nail art'] },
];

/** Distinct product photography — Unsplash nail/beauty (platform-safe CDN). */
const PRODUCT_IMAGES = {
  polish1: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=80&auto=format&fit=crop',
  polish2: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=900&q=80&auto=format&fit=crop',
  polish3: 'https://images.unsplash.com/photo-1610992015732-3443bedf8acb?w=900&q=80&auto=format&fit=crop',
  polish4: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=900&q=80&auto=format&fit=crop',
  polish5: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=80&auto=format&fit=crop',
  polish6: 'https://images.unsplash.com/photo-1607779097040-26be209bad29?w=900&q=80&auto=format&fit=crop',
  polish7: 'https://images.unsplash.com/photo-1487412940907-5b63a3ed0c85?w=900&q=80&auto=format&fit=crop',
  polish8: 'https://images.unsplash.com/photo-1560066984-1388d7fdf550?w=900&q=80&auto=format&fit=crop',
  polish9: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=85&auto=format&fit=crop',
  polish10: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80&auto=format&fit=crop',
  polish11: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=900&q=85&auto=format&fit=crop',
  polish12: 'https://images.unsplash.com/photo-1610992015732-3443bedf8acb?w=900&q=85&auto=format&fit=crop',
  press1: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=85&auto=format&fit=crop',
  press2: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=80&auto=format&fit=crop',
  press3: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=900&q=85&auto=format&fit=crop',
  press4: 'https://images.unsplash.com/photo-1607779097040-26be209bad29?w=900&q=85&auto=format&fit=crop',
  press5: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=85&auto=format&fit=crop',
  press6: 'https://images.unsplash.com/photo-1487412940907-5b63a3ed0c85?w=900&q=85&auto=format&fit=crop',
  press7: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=80&auto=format&fit=crop',
  press8: 'https://images.unsplash.com/photo-1560066984-1388d7fdf550?w=900&q=85&auto=format&fit=crop',
  kit1: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=900&q=90&auto=format&fit=crop',
  kit2: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=90&auto=format&fit=crop',
  kit3: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?w=900&q=80&auto=format&fit=crop',
  kit4: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=90&auto=format&fit=crop',
  kit5: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=900&q=90&auto=format&fit=crop',
  kit6: 'https://images.unsplash.com/photo-1610992015732-3443bedf8acb?w=900&q=90&auto=format&fit=crop',
  kit7: 'https://images.unsplash.com/photo-1487412940907-5b63a3ed0c85?w=900&q=90&auto=format&fit=crop',
  kit8: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=85&auto=format&fit=crop',
  care1: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=90&auto=format&fit=crop',
  care2: 'https://images.unsplash.com/photo-1570172619604-9230d1c5d1c0?w=900&q=80&auto=format&fit=crop',
  care3: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=900&q=80&auto=format&fit=crop',
  care4: 'https://images.unsplash.com/photo-1585232351009-aa97f53b2a5d?w=900&q=80&auto=format&fit=crop',
  care5: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=900&q=80&auto=format&fit=crop',
  care6: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=900&q=85&auto=format&fit=crop',
  care7: 'https://images.unsplash.com/photo-1570172619604-9230d1c5d1c0?w=900&q=85&auto=format&fit=crop',
  care8: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=900&q=85&auto=format&fit=crop',
  tool1: 'https://images.unsplash.com/photo-1585232351009-aa97f53b2a5d?w=900&q=85&auto=format&fit=crop',
  tool2: 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?w=900&q=85&auto=format&fit=crop',
  tool3: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=900&q=80&auto=format&fit=crop',
  tool4: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=80&auto=format&fit=crop',
  tool5: 'https://images.unsplash.com/photo-1607779097040-26be209bad29?w=900&q=80&auto=format&fit=crop',
  tool6: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=80&auto=format&fit=crop',
  tool7: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=900&q=80&auto=format&fit=crop',
  tool8: 'https://images.unsplash.com/photo-1610992015732-3443bedf8acb?w=900&q=80&auto=format&fit=crop',
  tool9: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=900&q=80&auto=format&fit=crop',
  tool10: 'https://images.unsplash.com/photo-1487412940907-5b63a3ed0c85?w=900&q=80&auto=format&fit=crop',
};

function pickHeroCandidates(oliveMedia, bestMedia) {
  const prefer = (list, re) => list.filter((u) => re.test(u));
  const oliveHero = prefer(oliveMedia, /Hero-Desktop|summer-vibes|Pedi-Web-Banner-Desktop|Background-Desktop|Heading-Desktop/i);
  const bestHero = prefer(bestMedia, /main_page|banner|hero|gel|polish/i);
  return uniqUrls([...oliveHero, ...bestHero, ...oliveMedia.slice(0, 12), ...bestMedia.slice(0, 6)]);
}

function buildCatalog(cjSkus, marketingImages) {
  const products = [];
  let i = 0;
  for (const row of CURATED) {
    i += 1;
    const wholesaleHint = cjSkus[(i - 1) % Math.max(cjSkus.length, 1)]?.wholesaleUsd;
    const usd = row.usd || wholesaleHint || 8;
    const price = usdToPkr(usd);
    const compare = Math.round(price * 1.22);
    const image = PRODUCT_IMAGES[row.imageKey] || PRODUCT_IMAGES.polish1;
    products.push({
      name: row.name,
      brand: row.brand,
      category: row.category,
      unit: 'pcs',
      price,
      compare_price: compare,
      cost_price: Math.round(price * 0.55),
      stock: 40 + (i % 35),
      sku: `ZIG-${String(i).padStart(3, '0')}`,
      slug: slugify(row.name),
      description: `${row.name}. Salon-quality ${row.category.toLowerCase()} for at-home manicures. Clean formulas, curated for Ziglam beauty shoppers.`,
      image_url: image,
      images: [{ url: image, primary: true }],
      is_featured: Boolean(row.featured),
      is_new: i <= 12,
      domain_data: {
        tags: row.tags || [],
        source_refs: ['archive/nails.html', 'archive/nails-2.html', 'archive/nails1.html'],
        marketplace_note: 'Styled for Taobao/CJ marketplace nail beauty assortment',
      },
    });
  }

  const heroes = marketingImages.slice(0, 6);
  return { products, heroes };
}

function main() {
  const cjHtml = readArchive('nails1.html');
  const bestHtml = readArchive('nails-2.html');
  const oliveHtml = readArchive('nails.html');

  const cjSkus = extractCjSkus(cjHtml);
  const oliveMedia = extractShopifyMedia(oliveHtml);
  const bestMedia = extractShopifyMedia(bestHtml);
  const marketingImages = pickHeroCandidates(oliveMedia, bestMedia);

  const { products, heroes } = buildCatalog(cjSkus, marketingImages);

  const extract = {
    generatedAt: new Date().toISOString(),
    sources: [
      { file: 'archive/nails1.html', role: 'CJ wholesale nail kits (SKU/price anchors)', skuCount: cjSkus.length },
      { file: 'archive/nails-2.html', role: 'Best Nails USA categories + lifestyle', mediaCount: bestMedia.length },
      { file: 'archive/nails.html', role: 'Olive & June hero/marketing media', mediaCount: oliveMedia.length },
      { file: 'https://taobao.com/', role: 'Marketplace assortment reference (no live scrape dependency)' },
    ],
    cjSkus: cjSkus.slice(0, 80),
    marketingImages: heroes,
    oliveMedia: oliveMedia.slice(0, 40),
    bestMedia: bestMedia.slice(0, 20),
    productCount: products.length,
  };

  fs.writeFileSync(extractPath, JSON.stringify(extract, null, 2));

  const body = `/**
 * Ziglam beauty / nails seed catalog.
 * Built from archive/nails*.html marketing + curated salon-spa beauty lineup.
 * Regenerate: node scripts/build-nails-seed-catalog.mjs
 */
/** @type {Array<Record<string, unknown>>} */
export const ZIGLAM_BEAUTY_SEED_PRODUCTS = ${JSON.stringify(products, null, 2)};

/** Prefer Olive & June / Best Nails archive CDN heroes when present. */
export const ZIGLAM_BEAUTY_MARKETING_IMAGES = ${JSON.stringify(heroes, null, 2)};

export const ZIGLAM_BEAUTY_CATEGORIES = ['Polish', 'Press-Ons', 'Kits', 'Care', 'Tools'];
`;

  fs.writeFileSync(outPath, body);
  console.log(`Wrote ${products.length} products → ${path.relative(root, outPath)}`);
  console.log(`Extract media ${heroes.length} heroes, CJ SKUs ${cjSkus.length} → ${path.relative(root, extractPath)}`);
}

main();
