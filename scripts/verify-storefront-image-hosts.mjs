#!/usr/bin/env node
/**
 * Guard: shared image allowlist + SmartProductImage safety + no crash hosts in live seeds.
 * Run: bun run verify:storefront-image-hosts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAllowedNextImageSrc } from '../lib/storefront/allowedImageHosts.js';
import { isDeadImageUrl } from '../lib/storefront/deadImageHosts.js';
import { ELECTRONICS_SEED_PRODUCTS } from '../lib/dataLab/electronicsDemoCatalog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const nextConfig = fs.readFileSync(path.join(root, 'next.config.js'), 'utf8');
assert.match(
  nextConfig,
  /allowedImageHosts\.json/,
  'next.config.js must load shared allowedImageHosts.json'
);

const smartSrc = fs.readFileSync(
  path.join(root, 'components/storefront/SmartProductImage.jsx'),
  'utf8'
);
assert.match(smartSrc, /isAllowedNextImageSrc/, 'SmartProductImage must gate next/image by allowlist');
assert.match(smartSrc, /isDeadImageUrl/, 'SmartProductImage must skip dead hosts');

assert.equal(isAllowedNextImageSrc('https://images.unsplash.com/photo-1'), true);
assert.equal(isAllowedNextImageSrc('https://www.gulahmedshop.com/cdn/shop/x.webp'), true);
assert.equal(isAllowedNextImageSrc('https://imraneshop.com/pub/media/x.jpg'), false);
assert.equal(isAllowedNextImageSrc('/storefront/local.png'), true);

assert.equal(isDeadImageUrl('https://imraneshop.com/pub/media/x.jpg'), true);
assert.equal(isDeadImageUrl('https://www.imraneshop.com/x.jpg'), true);
assert.equal(isDeadImageUrl('https://images.unsplash.com/photo-1592899677977-99c296376d88'), true);

for (const p of ELECTRONICS_SEED_PRODUCTS) {
  assert.ok(
    !/imraneshop\.com/i.test(String(p.image_url || '')),
    `electronics seed must not use imraneshop: ${p.sku}`
  );
  assert.ok(
    isAllowedNextImageSrc(p.image_url) || isDeadImageUrl(p.image_url),
    `electronics seed image must be allowlisted or treated dead: ${p.sku}`
  );
  assert.ok(!isDeadImageUrl(p.image_url), `electronics seed image must be live: ${p.sku} ${p.image_url}`);
}

// Wishlist must not use raw next/image for arbitrary product URLs
const wishlistSrc = fs.readFileSync(
  path.join(root, 'app/store/[businessDomain]/account/wishlist/page.jsx'),
  'utf8'
);
assert.match(wishlistSrc, /SmartProductImage/, 'wishlist must use SmartProductImage');
assert.doesNotMatch(
  wishlistSrc,
  /from ['\"]next\/image['\"]/,
  'wishlist must not import next/image directly'
);

console.log('verify:storefront-image-hosts OK');
