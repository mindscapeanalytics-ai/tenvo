#!/usr/bin/env node
/**
 * Probe Unsplash photo IDs used in core storefront image pools.
 * Usage: node scripts/probe-storefront-unsplash.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDeadImageUrl } from '../lib/storefront/deadImageHosts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const FILES = [
  'lib/storefront/productImageFallback.js',
  'lib/storefront/storefrontImagePlaceholders.js',
  'lib/config/storefrontDomains.js',
  'lib/marketing/demoStoreGalleryMeta.js',
  'lib/dataLab/electronicsDemoCatalog.js',
  'lib/dataLab/electronicsSupplementProducts.js',
];

const re = /images\.unsplash\.com\/(photo-[a-zA-Z0-9_-]+)/g;
/** @type {Map<string, string[]>} */
const ids = new Map();

for (const rel of FILES) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, 'utf8');
  let m;
  re.lastIndex = 0;
  while ((m = re.exec(text))) {
    if (!ids.has(m[1])) ids.set(m[1], []);
    const list = ids.get(m[1]);
    if (!list.includes(rel)) list.push(rel);
  }
}

console.log(`Probing ${ids.size} Unsplash IDs…`);
const dead = [];
for (const id of [...ids.keys()].sort()) {
  const url = `https://images.unsplash.com/${id}?w=64&q=60&auto=format&fit=crop`;
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    let status = res.status;
    if (status !== 200 && status !== 304) {
      res = await fetch(url, { method: 'GET', redirect: 'follow' });
      status = res.status;
    }
    if (status === 404 || status === 410) {
      dead.push({ id, status, files: ids.get(id), alreadyListed: isDeadImageUrl(url) });
      process.stdout.write('x');
    } else {
      process.stdout.write(status === 200 || status === 304 ? '.' : '?');
    }
  } catch {
    dead.push({ id, status: 'ERR', files: ids.get(id), alreadyListed: isDeadImageUrl(url) });
    process.stdout.write('!');
  }
}

console.log(`\nDead: ${dead.length}`);
for (const row of dead) {
  console.log(
    `  ${row.id} (${row.status})${row.alreadyListed ? ' [listed]' : ' [NOT LISTED]'}`
  );
  for (const f of row.files || []) console.log(`    - ${f}`);
}

const unlisted = dead.filter((d) => !d.alreadyListed);
if (unlisted.length) {
  console.error(`\n${unlisted.length} dead IDs not in DEAD_IMAGE_URL_FRAGMENTS`);
  process.exit(1);
}

console.log('probe-storefront-unsplash OK');
