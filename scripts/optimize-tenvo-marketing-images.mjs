/**
 * Re-optimize /public/tenvo-img → /public/tenvo-img/webp (WebP).
 * Usage: node scripts/optimize-tenvo-marketing-images.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../public/tenvo-img');
const outDir = path.join(dir, 'webp');

fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f));

for (const file of files) {
  const input = path.join(dir, file);
  const base = file.replace(/\.(png|jpe?g)$/i, '');
  const meta = await sharp(input).metadata();
  const isMobile = /IMG_|mobile|tab/i.test(file);
  const maxW = isMobile ? 900 : 1600;
  const pipeline = sharp(input).rotate();
  if ((meta.width || 0) > maxW) {
    pipeline.resize({ width: maxW, withoutEnlargement: true });
  }
  const out = path.join(outDir, `${base}.webp`);
  await pipeline.webp({ quality: 78, effort: 5 }).toFile(out);
  const inKB = Math.round(fs.statSync(input).size / 1024);
  const outKB = Math.round(fs.statSync(out).size / 1024);
  console.log(`${file} → ${base}.webp (${inKB}KB → ${outKB}KB)`);
}

console.log(`Optimized ${files.length} images into ${outDir}`);
