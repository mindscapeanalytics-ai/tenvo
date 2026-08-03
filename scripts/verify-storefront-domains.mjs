/**
 * Audit public storefront wiring for every domainKnowledge key (~65 verticals).
 * Run: node scripts/verify-storefront-domains.mjs
 *
 * Avoids hero/landing runtime imports (they pull TS regional helpers).
 */
import { DOMAIN_KNOWLEDGE_KEYS, domainKnowledge } from '../lib/domainKnowledge.js';
import { DOMAIN_KEY_ALIASES, resolveDomainKey } from '../lib/config/domainKeyAliases.js';
import {
  STOREFRONT_DOMAIN_CONFIG,
  STOREFRONT_CATEGORY_TO_VERTICAL,
  resolveStorefrontVertical,
  getDomainConfig,
} from '../lib/config/storefrontDomains.js';
import { hasStorefrontBookingVertical, STOREFRONT_BOOKING_VERTICALS } from '../lib/storefront/storefrontBooking.js';
import { isPharmacyElevatedStore } from '../lib/storefront/pharmacyStorefront.js';
import { isFashionEditorialStore } from '../lib/storefront/fashionEditorial.js';
import { isAutoDealershipStore } from '../lib/storefront/autoDealership.js';
import { isAutoMarketplaceStore } from '../lib/storefront/autoMarketplace.js';
import { isAutoPartsStore } from '../lib/storefront/autoParts.js';
import { isFurnitureElevatedStore } from '../lib/storefront/furnitureStorefront.js';
import { isRestaurantElevatedStore } from '../lib/storefront/restaurantStorefront.js';
import { isFitnessElevatedStore } from '../lib/storefront/fitnessStorefront.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

/** @type {string[]} */
const warnings = [];
/** @type {string[]} */
const failures = [];

function warn(msg) {
  warnings.push(msg);
}

function fail(msg) {
  failures.push(msg);
}

// Static: every domain should appear in category map OR infer via storefrontDomains
for (const key of DOMAIN_KNOWLEDGE_KEYS) {
  const vertical = resolveStorefrontVertical(key);
  if (!STOREFRONT_DOMAIN_CONFIG[vertical]) {
    fail(`"${key}" → unknown vertical "${vertical}"`);
  }
}

// Alias targets must exist
for (const [alias, target] of Object.entries(DOMAIN_KEY_ALIASES)) {
  if (!domainKnowledge[target]) {
    fail(`alias "${alias}" → "${target}" missing from domainKnowledge`);
  }
}

// Legacy booking alias slugs must resolve to booking-capable canonicals
for (const legacy of ['beauty-salon', 'medical-clinic', 'spa-wellness', 'mobile-phone-shop']) {
  const resolved = resolveDomainKey(legacy);
  if (!domainKnowledge[resolved]) {
    fail(`legacy slug "${legacy}" → "${resolved}" missing from domainKnowledge`);
  }
}
if (!hasStorefrontBookingVertical('salon-spa')) {
  fail('salon-spa should be booking-capable');
}
if (!hasStorefrontBookingVertical(resolveDomainKey('beauty-salon'))) {
  fail('beauty-salon alias should resolve to booking-capable vertical');
}
if (resolveDomainKey('mobile') !== 'mobile') {
  fail('mobile should resolve to domainKnowledge key "mobile"');
}

for (const key of STOREFRONT_BOOKING_VERTICALS) {
  if (!domainKnowledge[key]) {
    fail(`STOREFRONT_BOOKING_VERTICALS "${key}" not in domainKnowledge`);
  }
}

// Static wiring files must exist
const requiredFiles = [
  'app/store/[businessDomain]/page.jsx',
  'app/store/[businessDomain]/products/page.jsx',
  'app/store/[businessDomain]/products/[slug]/page.jsx',
  'app/store/[businessDomain]/cart/page.jsx',
  'app/store/[businessDomain]/checkout/page.jsx',
  'app/store/[businessDomain]/contact/page.jsx',
  'app/api/storefront/[businessDomain]/orders/route.js',
  'app/api/storefront/[businessDomain]/contact/route.js',
  'lib/actions/storefront/products.js',
  'lib/storefront/storefrontDisplayStock.js',
  'lib/storefront/storefrontProductVariants.js',
  'components/storefront/ProductPurchasePanel.jsx',
];
for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) {
    fail(`missing storefront file: ${rel}`);
  }
}

/** @type {{ key: string; vertical: string; elevated: string; booking: boolean; explicitMap: boolean }[]} */
const report = [];

for (const key of DOMAIN_KNOWLEDGE_KEYS) {
  const resolved = resolveDomainKey(key);
  if (!domainKnowledge[resolved]) {
    fail(`resolveDomainKey("${key}") → "${resolved}" missing`);
    continue;
  }

  if (!domainKnowledge[key]?.icon) {
    fail(`domainKnowledge["${key}"] missing icon`);
  }

  const cfg = getDomainConfig(resolved);
  if (!cfg?.heroTagline) {
    fail(`getDomainConfig("${key}") missing heroTagline`);
  }

  const vertical = resolveStorefrontVertical(resolved);
  const elevated = [
    isPharmacyElevatedStore(resolved) && 'pharmacy',
    isFashionEditorialStore(resolved) && 'fashion',
    isAutoDealershipStore(resolved) && 'dealership',
    isAutoMarketplaceStore(resolved) && 'marketplace',
    isAutoPartsStore(resolved) && 'autoparts',
    isFurnitureElevatedStore(resolved) && 'furniture',
    isRestaurantElevatedStore(resolved) && 'restaurant',
    isFitnessElevatedStore(resolved) && 'fitness',
  ].filter(Boolean).join('+') || 'standard';

  const explicitMap = Boolean(STOREFRONT_CATEGORY_TO_VERTICAL[key]);
  if (vertical === 'default' && elevated === 'standard') {
    warn(`"${key}" uses generic default storefront (no elevated module)`);
  }

  report.push({
    key,
    vertical,
    elevated,
    booking: hasStorefrontBookingVertical(resolved),
    explicitMap,
  });
}

const byVertical = report.reduce((acc, row) => {
  acc[row.vertical] = (acc[row.vertical] || 0) + 1;
  return acc;
}, {});

console.log('\n=== Storefront domain audit ===\n');
console.log(`Domains checked: ${DOMAIN_KNOWLEDGE_KEYS.length}`);
console.log(`Elevated modules: ${report.filter((r) => r.elevated !== 'standard').length}`);
console.log(`Generic default template: ${report.filter((r) => r.vertical === 'default').length}`);
console.log(`Booking-capable: ${report.filter((r) => r.booking).length}`);
console.log('\nVertical distribution:');
for (const [v, n] of Object.entries(byVertical).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${v}: ${n}`);
}

if (warnings.length) {
  console.log(`\nInfo — generic template domains (${warnings.length}):`);
  for (const w of warnings.slice(0, 12)) console.log(`  · ${w.replace(' uses generic default storefront (no elevated module)', '')}`);
  if (warnings.length > 12) console.log(`  … and ${warnings.length - 12} more (B2B/industrial — catalog + checkout still work)`);
}

if (failures.length) {
  console.error(`\nFAILURES (${failures.length}):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.log('\nOK: all storefront domains wired (config, aliases, booking keys, core routes).');
