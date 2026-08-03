/**
 * Rasterize public/tenvo.svg into installable PWA / Apple touch PNGs.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = path.join(root, 'public', 'tenvo.svg');
const outDir = path.join(root, 'public', 'icons');

const BRAND = { r: 210, g: 43, b: 43, alpha: 1 }; // #D22B2B

fs.mkdirSync(outDir, { recursive: true });
const svg = fs.readFileSync(svgPath);

async function writeAny(size, name) {
  const out = path.join(outDir, name);
  await sharp(svg)
    .resize(size, size, { fit: 'contain', background: BRAND })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('wrote', path.relative(root, out));
}

async function writeMaskable(size, name) {
  // Full-bleed square brand red + logo inset ~72% (Android maskable safe zone)
  const logoSize = Math.round(size * 0.72);
  const pad = Math.round((size - logoSize) / 2);
  const logoBuf = await sharp(svg)
    .resize(logoSize, logoSize, { fit: 'contain', background: BRAND })
    .png()
    .toBuffer();
  const out = path.join(outDir, name);
  await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND },
  })
    .composite([{ input: logoBuf, left: pad, top: pad }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log('wrote', path.relative(root, out));
}

await writeAny(192, 'icon-192.png');
await writeAny(512, 'icon-512.png');
await writeMaskable(192, 'icon-maskable-192.png');
await writeMaskable(512, 'icon-maskable-512.png');
await writeAny(180, 'apple-touch-icon.png');
await writeAny(32, 'icon-32.png');
console.log('PWA icons ready');
