/**
 * POS hotkey + domain shell wiring integrity.
 * Run: bun run verify:pos-hotkeys
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
let failed = 0;

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function mark(msg) {
  failed += 1;
  console.error(`FAIL: ${msg}`);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function includes(rel, needle, label) {
  const src = read(rel);
  if (!src.includes(needle)) mark(`${label} — missing "${needle}" in ${rel}`);
  else ok(label);
}

console.log('=== POS hotkeys / domain shells ===\n');

// Plain ESM (no @/ imports)
const hotkeysMod = await import(pathToFileURL(path.join(root, 'lib/config/posHotkeys.js')).href);
const aliasesMod = await import(pathToFileURL(path.join(root, 'lib/config/domainKeyAliases.js')).href);

const map = hotkeysMod.POS_HOTKEY_MAP;
const expected = {
  F1: 'search',
  F2: 'customer',
  F3: 'discount',
  F4: 'hold',
  F5: 'pay',
  F6: 'payment',
  F7: 'tax',
  F8: 'clear',
  F9: 'print',
};
for (const [key, action] of Object.entries(expected)) {
  if (map[key] !== action) mark(`POS_HOTKEY_MAP[${key}] expected ${action}, got ${map[key]}`);
  else ok(`Map ${key} → ${action}`);
}

if (hotkeysMod.POS_HOTKEY_DOCK_ITEMS.length !== 9) {
  mark(`Dock items expected 9, got ${hotkeysMod.POS_HOTKEY_DOCK_ITEMS.length}`);
} else {
  ok('Dock has 9 F-keys');
}

const SUPERSTORE = new Set([
  'supermarket', 'grocery', 'wholesale-distribution', 'bakery-confectionery',
  'pharmacy', 'cold-storage', 'fmcg', 'petrol-pump',
]);
const SERVICE = new Set([
  'salon-spa', 'courier-logistics', 'mobile-repairing', 'clinics-healthcare', 'gym-fitness',
]);

function resolveVariant(category) {
  const key = aliasesMod.resolveDomainKey(category);
  if (key === 'restaurant-cafe') return 'restaurant';
  if (SUPERSTORE.has(key)) return 'superstore';
  if (SERVICE.has(key)) return 'service';
  return 'retail';
}

const variantCases = [
  ['restaurant-cafe', 'restaurant'],
  ['restaurant', 'restaurant'],
  ['cafe', 'restaurant'],
  ['supermarket', 'superstore'],
  ['grocery', 'superstore'],
  ['pharmacy', 'superstore'],
  ['cold-storage', 'superstore'],
  ['salon-spa', 'service'],
  ['gym-fitness', 'service'],
  ['clinics-healthcare', 'service'],
  ['retail-shop', 'retail'],
  ['auto-parts', 'retail'],
  ['garments', 'retail'],
];

for (const [cat, want] of variantCases) {
  const got = resolveVariant(cat);
  if (got !== want) mark(`resolvePosVariant(${cat}) expected ${want}, got ${got}`);
  else ok(`Variant ${cat} → ${want}`);
}

const posDomainsSrc = read('lib/config/posDomains.js');
if (!posDomainsSrc.includes('resolveDomainKey')) {
  mark('posDomains.js must normalize via resolveDomainKey');
} else {
  ok('posDomains normalizes aliases');
}

const shells = [
  'components/pos/PosTerminal.jsx',
  'components/pos/SuperStorePOS.jsx',
  'components/restaurant/RestaurantPOS.jsx',
];

for (const rel of shells) {
  includes(rel, 'usePosHotkeys', `${path.basename(rel)} wires usePosHotkeys`);
  includes(rel, 'PosHotkeyDock', `${path.basename(rel)} mounts PosHotkeyDock`);
  includes(rel, 'onFullscreen', `${path.basename(rel)} passes F11 fullscreen`);
  includes(rel, 'data-pos-root', `${path.basename(rel)} marks POS root`);
  includes(rel, 'focusPosScanInput', `${path.basename(rel)} focuses visible scan field`);
}

includes('lib/hooks/usePosHotkeys.js', "addEventListener('keydown', onKeyDown, true)", 'usePosHotkeys uses capture phase');
includes('lib/hooks/usePosHotkeys.js', 'resolvePosFunctionKey', 'usePosHotkeys uses key resolver');
includes('lib/utils/posHotkeyHelpers.js', 'focusPosScanInput', 'posHotkeyHelpers exports visible scan focus');

const dash = read('app/business/[category]/components/DashboardTabs.jsx');
if (!dash.includes('RestaurantPOS') || !dash.includes('SuperStorePOS') || !dash.includes('PosTerminal')) {
  mark('DashboardTabs must mount RestaurantPOS, SuperStorePOS, and PosTerminal');
} else {
  ok('DashboardTabs mounts all three POS shells');
}

const domainsSrc = read('lib/config/domains.js');
for (const key of ['gym-fitness', 'clinics-healthcare']) {
  if (!domainsSrc.includes(`'${key}'`)) mark(`_POS_LIST missing ${key}`);
  else ok(`POS relevant includes ${key}`);
}

console.log('');
if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('All POS hotkey checks passed.');
