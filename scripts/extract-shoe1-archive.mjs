/**
 * Extract Foot Locker homepage banners from archive/shoe1.html
 * Run: node scripts/extract-shoe1-archive.mjs
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const htmlPath = path.join(root, 'archive/shoe1.html');
const outJson = path.join(root, 'lib/dataLab/shoe1ArchiveExtract.json');

const html = fs.readFileSync(htmlPath, 'utf8');
console.log('bytes', html.length);

const urlRe = /https?:\/\/[^"'\\\s)>]+/gi;
const urls = [...new Set([...html.matchAll(urlRe)].map((m) => m[0].replace(/&amp;/g, '&')))];

function isJunk(u) {
  return /font|woff|favicon|sprite|pixel|1x1|tracking|analytics|\.svg|logo\.|gtm|doubleclick|facebook|twitter/i.test(u);
}
function isRaster(u) {
  return /\.(jpe?g|png|webp|avif)(?:\?|$)/i.test(u) || /images\.footlocker|fl-img|scene7|cloudinary|akamai|footlocker\.com\/.*\.(jpg|png|webp)/i.test(u);
}

const images = urls.filter((u) => !isJunk(u) && (isRaster(u) || /footlocker|flresources|images\.ctfassets|dam\.footlocker/i.test(u)));
const hosts = {};
for (const u of images) {
  try {
    const h = new URL(u).host;
    hosts[h] = (hosts[h] || 0) + 1;
  } catch {}
}
console.log('hosts', hosts);
console.log('images', images.length);

const fl = images.filter((u) => /footlocker|flresources|fl-img|scene7|ctfassets/i.test(u));
const large = fl.filter((u) => /hero|banner|promo|homepage|desktop|wide|1920|1600|1440|1200|sale|bts|energy|brand/i.test(u) || u.length > 90);

const extract = {
  scrapedAt: new Date().toISOString(),
  source: 'archive/shoe1.html',
  hosts,
  all: images.slice(0, 200),
  footlocker: [...new Set(fl)].slice(0, 120),
  banners: [...new Set(large.length ? large : fl)].slice(0, 60),
  products: images.filter((u) => /product|_AC_|sku|style|sneaker|shoe/i.test(u)).slice(0, 40),
};

fs.writeFileSync(outJson, JSON.stringify(extract, null, 2));
extract.banners.slice(0, 30).forEach((u, i) => console.log('B', i, u.slice(0, 180)));
extract.footlocker.slice(0, 20).forEach((u, i) => console.log('F', i, u.slice(0, 180)));
