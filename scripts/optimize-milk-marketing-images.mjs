/**
 * Optimize public/tenvo-img/milk → public/tenvo-img/webp (WebP).
 * Usage: node scripts/optimize-milk-marketing-images.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const milkDir = path.join(__dirname, '../public/tenvo-img/milk');
const outDir = path.join(__dirname, '../public/tenvo-img/webp');

fs.mkdirSync(outDir, { recursive: true });

const jobs = [
  { src: 'milk-shop-pos.png', out: 'milk-shop-pos.webp', maxW: 1600, q: 80 },
  { src: 'milk-hisab-kitab.png', out: 'milk-hisab-kitab.webp', maxW: 1600, q: 82 },
  {
    src: 'milk-english-urdu-weekly-monthly-bill.png',
    out: 'milk-english-urdu-weekly-monthly-bill.webp',
    maxW: 1200,
    q: 85,
  },
  {
    src: 'retail-simple-dsahboard-tenvo.jpg',
    out: 'milk-retail-simple-dashboard.webp',
    maxW: 1600,
    q: 80,
  },
];

for (const job of jobs) {
  const input = path.join(milkDir, job.src);
  const output = path.join(outDir, job.out);
  if (!fs.existsSync(input)) {
    console.warn(`Missing: ${job.src}`);
    continue;
  }
  const meta = await sharp(input).metadata();
  let pipeline = sharp(input).rotate();
  if ((meta.width || 0) > job.maxW) {
    pipeline = pipeline.resize({ width: job.maxW, withoutEnlargement: true });
  }
  await pipeline.webp({ quality: job.q, effort: 6 }).toFile(output);
  const inKB = Math.round(fs.statSync(input).size / 1024);
  const outKB = Math.round(fs.statSync(output).size / 1024);
  console.log(
    `${job.src} (${meta.width}x${meta.height}, ${inKB}KB) → ${job.out} (${outKB}KB)`
  );
}
