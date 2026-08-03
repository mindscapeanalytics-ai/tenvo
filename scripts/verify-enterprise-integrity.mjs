/**
 * Enterprise integrity guards — P0 wiring that must not regress.
 * Run: bun run verify:enterprise-integrity
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
let failed = false;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed = true;
}

function pass(msg) {
  console.log(`OK: ${msg}`);
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

// --- Affiliate PII: no anonymous earnings leak ---
const affiliateLookup = read('app/api/affiliates/lookup/route.js');
if (!affiliateLookup.includes('getServerSession')) {
  fail('affiliates/lookup must require getServerSession');
} else {
  pass('affiliates/lookup requires session');
}
if (!affiliateLookup.includes('UNAUTHORIZED') && !affiliateLookup.includes('401')) {
  fail('affiliates/lookup must reject unauthenticated callers');
} else {
  pass('affiliates/lookup rejects unauthenticated');
}
if (!affiliateLookup.includes('isPlatformLevel') || !affiliateLookup.includes('isSelf')) {
  fail('affiliates/lookup must gate financial fields to admin or self');
} else {
  pass('affiliates/lookup gates financial fields (admin/self)');
}

const debugAffiliates = read('app/api/debug/affiliates/route.js');
if (!debugAffiliates.includes('isPlatformLevel') || !debugAffiliates.includes('403')) {
  fail('debug/affiliates must require platform admin (403)');
} else {
  pass('debug/affiliates requires platform admin');
}
if (
  debugAffiliates.includes('if (email)') &&
  debugAffiliates.indexOf('if (email)') < debugAffiliates.indexOf('isPlatformLevel')
) {
  fail('debug/affiliates must not serve email lookup before auth');
} else {
  pass('debug/affiliates auth before email lookup');
}

// --- Purchase / sales list pagination ---
const purchaseAction = read('lib/actions/standard/purchase.js');
if (!/getPurchasesAction[\s\S]*LIMIT \$2 OFFSET \$3/.test(purchaseAction)) {
  fail('getPurchasesAction must use LIMIT/OFFSET');
} else {
  pass('getPurchasesAction is paged');
}

const quotationAction = read('lib/actions/standard/quotation.js');
for (const name of ['getQuotationsAction', 'getSalesOrdersAction', 'getChallansAction']) {
  const idx = quotationAction.indexOf(`export async function ${name}`);
  if (idx < 0) {
    fail(`${name} missing`);
    continue;
  }
  const slice = quotationAction.slice(idx, idx + 900);
  if (!slice.includes('LIMIT $2 OFFSET $3')) {
    fail(`${name} must use LIMIT/OFFSET`);
  } else {
    pass(`${name} is paged`);
  }
}

const vendors = read('lib/actions/basic/vendor.js');
if (!/getVendorsAction[\s\S]*take:\s*2000/.test(vendors)) {
  fail('getVendorsAction must cap findMany with take');
} else {
  pass('getVendorsAction has take cap');
}

// --- Purchase void → InventoryService + journal reverse ---
const purchaseVoid = read('app/api/v1/purchases/[id]/route.js');
if (!purchaseVoid.includes('InventoryService.removeStock')) {
  fail('purchase DELETE void must call InventoryService.removeStock');
} else {
  pass('purchase void uses InventoryService.removeStock');
}
if (!purchaseVoid.includes('AccountingService.reverseJournalEntry')) {
  fail('purchase void must reverse journals (not hard-delete gl_entries)');
} else {
  pass('purchase void reverses journals');
}
if (/DELETE FROM gl_entries[\s\S]*purchase/.test(purchaseVoid) || purchaseVoid.includes("DELETE FROM gl_entries")) {
  fail('purchase void must not DELETE FROM gl_entries');
} else {
  pass('purchase void does not hard-delete gl_entries');
}

// --- POS must not drain full catalog into hub memory ---
const dashboardClient = read('app/business/[category]/DashboardClient.jsx');
if (dashboardClient.includes('loadAllPages: true')) {
  fail('DashboardClient must not use loadAllPages: true (POS/catalog RAM drain)');
} else {
  pass('DashboardClient has no loadAllPages: true');
}

// --- Storefront cancel: no headline-only restock fallback ---
const storefrontOrders = read('lib/actions/storefront/orders.js');
if (
  storefrontOrders.includes('InventoryService restock failed, using direct SQL') ||
  /InventoryService\.addStock[\s\S]{0,400}UPDATE products[\s\S]{0,120}SET stock = COALESCE\(stock/.test(
    storefrontOrders
  )
) {
  fail('storefront cancel must not fall back to headline-only UPDATE products.stock');
} else {
  pass('storefront cancel has no headline-only restock fallback');
}

if (failed) {
  console.error('\nverify:enterprise-integrity FAILED');
  process.exit(1);
}

console.log('\nverify:enterprise-integrity passed');
