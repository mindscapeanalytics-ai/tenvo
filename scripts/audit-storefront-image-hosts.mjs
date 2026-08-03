#!/usr/bin/env node
/**
 * Audit HTTPS image hosts in storefront seeds vs next.config.js remotePatterns.
 * Also collects Unsplash photo- IDs for optional live HEAD checks.
 *
 * Usage:
 *   node scripts/audit-storefront-image-hosts.mjs
 *   node scripts/audit-storefront-image-hosts.mjs --probe-unsplash
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const probeUnsplash = process.argv.includes('--probe-unsplash');

const SCAN_DIRS = [
  'lib/dataLab',
  'lib/storefront',
  'lib/marketing',
  'lib/config',
  'components/storefront',
];

const SKIP_HOST_PREFIXES = [
  'localhost',
  '127.0.0.1',
  'www.w3.org',
  'schemas.',
  'schema.org',
  'ogp.me',
  'github.com',
  'npmjs.com',
  'twitter.com',
  'facebook.com',
  'instagram.com',
  'youtube.com',
  'youtu.be',
  'x.com',
  'linkedin.com',
  'calendly.com',
  'stripe.com',
  'vercel.com',
  'tenvo.store',
  'www.tenvo.store',
  'www.tanvo.store',
  'tenvo.local',
  'wa.me',
  'www.google.com',
  'maps.google.com',
  'www.mindscapeanalytics.com',
  'zellbury.com',
  'videos.pexels.com', // video backdrop URLs, not next/image
];

const hostRe = /https?:\/\/([a-zA-Z0-9.-]+)/g;
const unsplashRe = /images\.unsplash\.com\/(photo-[a-zA-Z0-9_-]+)/g;

/** @type {Map<string, string[]>} */
const hosts = new Map();
/** @type {Map<string, string[]>} */
const unsplashIds = new Map();

function shouldSkipHost(host) {
  const h = host.toLowerCase();
  return SKIP_HOST_PREFIXES.some((p) => h === p || h.startsWith(p));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '__tests__'].includes(entry.name)) continue;
      walk(full);
      continue;
    }
    if (!/\.(js|jsx|mjs|ts|tsx|json)$/.test(entry.name)) continue;
    // Archive extracts keep provenance URLs that must not ship as live next/image srcs.
    if (/ArchiveExtract\.json$/i.test(entry.name)) continue;
    const text = fs.readFileSync(full, 'utf8');
    const rel = path.relative(root, full).replace(/\\/g, '/');
    let m;
    hostRe.lastIndex = 0;
    while ((m = hostRe.exec(text))) {
      const host = m[1].toLowerCase();
      if (shouldSkipHost(host)) continue;
      if (!hosts.has(host)) hosts.set(host, []);
      const list = hosts.get(host);
      if (list.length < 4 && !list.includes(rel)) list.push(rel);
    }
    unsplashRe.lastIndex = 0;
    while ((m = unsplashRe.exec(text))) {
      const id = m[1];
      if (!unsplashIds.has(id)) unsplashIds.set(id, []);
      const list = unsplashIds.get(id);
      if (list.length < 3 && !list.includes(rel)) list.push(rel);
    }
  }
}

for (const d of SCAN_DIRS) walk(path.join(root, d));

const cfg = fs.readFileSync(path.join(root, 'next.config.js'), 'utf8');
const allowJson = JSON.parse(
  fs.readFileSync(path.join(root, 'lib/storefront/allowedImageHosts.json'), 'utf8')
);
const allowed = (allowJson.remotePatterns || []).map((p) => String(p.hostname || '').toLowerCase());
if (!cfg.includes('allowedImageHosts.json')) {
  console.error('next.config.js must require allowedImageHosts.json');
  process.exit(1);
}

function matchPattern(host, pattern) {
  if (pattern === host) return true;
  if (pattern.startsWith('**.')) {
    const base = pattern.slice(3);
    return host === base || host.endsWith(`.${base}`);
  }
  return false;
}

function isAllowed(host) {
  return allowed.some((p) => matchPattern(host, p));
}

const missing = [...hosts.keys()].filter((h) => !isAllowed(h)).sort();

console.log(`Hosts scanned: ${hosts.size}; patterns: ${allowed.length}; missing: ${missing.length}`);
if (missing.length) {
  console.log('\nMISSING FROM remotePatterns (may crash next/image in production):');
  for (const h of missing) {
    console.log(`  ${h}`);
    for (const f of hosts.get(h) || []) console.log(`    - ${f}`);
  }
}

if (probeUnsplash) {
  console.log(`\nProbing ${unsplashIds.size} Unsplash photo IDs…`);
  const dead = [];
  const ids = [...unsplashIds.keys()].sort();
  // sequential to avoid rate limits
  for (const id of ids) {
    const url = `https://images.unsplash.com/${id}?w=64&q=60&auto=format&fit=crop`;
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (res.status === 404 || res.status === 410) {
        dead.push({ id, status: res.status, files: unsplashIds.get(id) });
        process.stdout.write('x');
      } else if (!res.ok && res.status !== 200 && res.status !== 304) {
        // Some CDNs reject HEAD; try GET range-less
        const getRes = await fetch(url, { method: 'GET', redirect: 'follow' });
        if (getRes.status === 404 || getRes.status === 410) {
          dead.push({ id, status: getRes.status, files: unsplashIds.get(id) });
          process.stdout.write('x');
        } else {
          process.stdout.write(getRes.ok ? '.' : '?');
        }
      } else {
        process.stdout.write('.');
      }
    } catch {
      process.stdout.write('!');
    }
  }
  console.log(`\nDead Unsplash IDs: ${dead.length}`);
  for (const row of dead) {
    console.log(`  ${row.id} (${row.status})`);
    for (const f of row.files || []) console.log(`    - ${f}`);
  }
  if (dead.length) process.exitCode = 2;
} else if (missing.length) {
  process.exitCode = 1;
} else {
  console.log('\nAll scanned image hosts are covered by remotePatterns.');
}
