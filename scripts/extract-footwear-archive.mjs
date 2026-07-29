/**
 * One-off extract from archive/khazany.html + archive/nike.html for footwear seed planning.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');

const kh = fs.readFileSync(path.join(root, 'archive/khazany.html'), 'utf8');
const nike = fs.readFileSync(path.join(root, 'archive/nike.html'), 'utf8');

const handles = [...kh.matchAll(/"handle":"([^"]+)"/g)].map((m) => m[1]);
const khImgs = [
  ...new Set(
    [...kh.matchAll(/(?:src|data-src|data-bgset|srcset)=\"([^\"]*cdn\/shop[^\"]+)\"/g)].map(
      (m) => m[1].split(' ')[0]
    )
  ),
];

const nikeImgs = [
  ...new Set(
    [...nike.matchAll(/https:\/\/[^"'\s]+(?:static-nike|nike\.com\/a\/images)[^"'\s]*/g)].map(
      (m) => m[0]
    )
  ),
];

function titleFromHandle(handle) {
  return handle
    .replace(/-s-\d+$/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function brandFromHandle(handle) {
  const name = titleFromHandle(handle);
  const brands = [
    'New Balance',
    'Under Armour',
    'Skechers',
    'Adidas',
    'Nike',
    'Puma',
    'Asics',
    'Brooks',
    'Jordan',
    'Hummel',
    'Altra',
    'On',
    'Avia',
    'Varsity Vibe',
  ];
  for (const b of brands) {
    if (name.toLowerCase().startsWith(b.toLowerCase())) return b;
  }
  return name.split(' ')[0];
}

const products = handles.map((handle, i) => ({
  handle,
  name: titleFromHandle(handle),
  brand: brandFromHandle(handle),
  sku: `TF-SHOE-${String(i + 1).padStart(3, '0')}`,
}));

console.log(JSON.stringify({ khazanay: { productCount: products.length, products: products.slice(0, 5), sampleImages: khImgs.slice(0, 8), totalImages: khImgs.length }, nike: { totalImages: nikeImgs.length, sampleImages: nikeImgs.slice(0, 8) } }, null, 2));
