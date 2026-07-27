/**
 * Assert installability assets + helpers exist (no SW / no cache layer).
 * Run: node scripts/verify-pwa-install.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function mustExist(rel) {
  const full = path.join(root, rel);
  assert.ok(fs.existsSync(full), `missing ${rel}`);
  return full;
}

const icons = [
  'public/icons/icon-192.png',
  'public/icons/icon-512.png',
  'public/icons/icon-maskable-192.png',
  'public/icons/icon-maskable-512.png',
  'public/icons/apple-touch-icon.png',
  'public/icons/icon-32.png',
];

for (const rel of icons) {
  const full = mustExist(rel);
  const size = fs.statSync(full).size;
  assert.ok(size > 200, `${rel} looks empty (${size} bytes)`);
}

mustExist('app/manifest.ts');
mustExist('lib/pwa/installApp.js');
mustExist('components/pwa/InstallAppPrompt.jsx');
mustExist('components/pwa/LazyInstallAppPrompt.jsx');

const manifestSrc = fs.readFileSync(path.join(root, 'app/manifest.ts'), 'utf8');
assert.ok(manifestSrc.includes('/icons/icon-192.png'), 'manifest must reference icon-192');
assert.ok(manifestSrc.includes('/icons/icon-512.png'), 'manifest must reference icon-512');
assert.ok(manifestSrc.includes('maskable'), 'manifest must include maskable icons');

const layoutSrc = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');
assert.ok(layoutSrc.includes('apple-touch-icon'), 'layout must reference apple-touch-icon');
assert.ok(layoutSrc.includes('appleWebApp'), 'layout must set appleWebApp');

const shellSrc = fs.readFileSync(
  path.join(root, 'components/layout/BusinessShellLayout.jsx'),
  'utf8'
);
assert.ok(
  shellSrc.includes('LazyInstallAppPrompt'),
  'hub shell must mount LazyInstallAppPrompt'
);

const nextConfig = fs.readFileSync(path.join(root, 'next.config.js'), 'utf8');
assert.ok(
  !/serwist|workbox|next-pwa/i.test(nextConfig),
  'next.config must not enable SW cache plugins'
);

const installSrc = fs.readFileSync(path.join(root, 'lib/pwa/installApp.js'), 'utf8');
assert.ok(installSrc.includes('INSTALL_PROMPT_DELAY_MS'), 'deferred reveal required');
const delayMatch = installSrc.match(/INSTALL_PROMPT_DELAY_MS\s*=\s*(\d+)/);
assert.ok(delayMatch, 'INSTALL_PROMPT_DELAY_MS must be numeric');
assert.ok(Number(delayMatch[1]) >= 3000, 'install prompt must be deferred to avoid first-paint lag');

console.log('verify-pwa-install: ok');
