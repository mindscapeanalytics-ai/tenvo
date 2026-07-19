/**
 * Static integrity: hub sidebar keys ↔ DashboardTabs ↔ tab aliases ↔ forms wiring.
 * Run: bun scripts/verify-hub-tabs-forms.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const require = createRequire(import.meta.url);
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

function extractSidebarKeys(src) {
  const keys = new Set();
  const re = /key:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[1] === 'view-storefront' || m[1] === 'platform-admin') continue;
    keys.add(m[1]);
  }
  return keys;
}

function extractTabsContentValues(src) {
  const keys = new Set();
  const re = /TabsContent\s+value="([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) keys.add(m[1]);
  return keys;
}

// --- Load tabs helpers (transpile-free ESM/CJS via dynamic import of source through node -- won't work for path aliases)
// Inline mirror of critical alias expectations instead of importing @/ paths.
const tabsSrc = read('lib/config/tabs.js');

// Dynamic import of tabs.js — it's plain ESM-compatible JS without @/ imports
const tabsMod = await import(pathToFileURL(path.join(root, 'lib/config/tabs.js')).href);
const {
  normalizeDashboardTab,
  resolveDashboardTab,
  resolveFinanceViewForTab,
  resolveFinanceHubNavigation,
} = tabsMod;

const paymentTypes = await import(pathToFileURL(path.join(root, 'lib/utils/paymentTypes.js')).href);

console.log('=== Hub tabs / forms integrity ===\n');

// 1. Finance aliases
const financeAliasCases = [
  ['expenses', 'finance', 'expenses'],
  ['exp', 'finance', 'expenses'],
  ['accounting', 'finance', 'accounts'],
  ['acc', 'finance', 'accounts'],
  ['accounts', 'finance', 'accounts'],
  ['credit-notes', 'finance', 'credit-notes'],
  ['fiscal', 'finance', 'fiscal'],
  ['exchange-rates', 'finance', 'exchange'],
  ['journal', 'finance', 'journal'],
  ['trial-balance', 'finance', 'trial-balance'],
  ['day-book', 'finance', 'day-book'],
];

for (const [raw, tab, view] of financeAliasCases) {
  const n = normalizeDashboardTab(raw);
  const r = resolveDashboardTab(raw);
  const v = resolveFinanceViewForTab(raw);
  if (n !== tab || r !== tab) {
    mark(`alias ${raw} → expected tab ${tab}, got normalize=${n} resolve=${r}`);
  } else if (v !== view) {
    mark(`alias ${raw} → expected financeView ${view}, got ${v}`);
  } else {
    ok(`alias ${raw} → ${tab} + financeView=${view}`);
  }
}

const hubNavCases = [
  ['trial-balance', 'statements', 'tb', false],
  ['day-book', 'statements', 'day-book', false],
  ['vouchers', 'overview', null, true],
  ['accounts', 'accounts', null, false],
];
for (const [raw, tab, report, preferPayments] of hubNavCases) {
  const nav = resolveFinanceHubNavigation(raw);
  if (nav.tab !== tab || (nav.statementReport || null) !== report || Boolean(nav.preferPayments) !== preferPayments) {
    mark(`hubNav ${raw} → expected ${tab}/${report}/pay=${preferPayments}, got ${nav.tab}/${nav.statementReport}/pay=${Boolean(nav.preferPayments)}`);
  } else {
    ok(`hubNav ${raw} → ${nav.tab}${report ? ` + ${report}` : ''}${preferPayments ? ' → payments' : ''}`);
  }
}

// 2. Core shortcuts
const shortcuts = [
  ['dash', 'dashboard'],
  ['prod', 'inventory'],
  ['fin', 'finance'],
  ['pay', 'payments'],
  ['rep', 'reports'],
  ['inv', 'inventory'],
  ['po', 'purchases'],
];
for (const [raw, expect] of shortcuts) {
  if (resolveDashboardTab(raw) !== expect) {
    mark(`shortcut ${raw} → expected ${expect}, got ${resolveDashboardTab(raw)}`);
  } else ok(`shortcut ${raw} → ${expect}`);
}

// 3. Sidebar keys must have a TabsContent (or alias into one)
const sidebar = read('components/layout/Sidebar.jsx');
const easyStart = sidebar.indexOf('const EASY_NAV_SECTIONS');
const advStart = sidebar.indexOf('const ADVANCED_NAV_SECTIONS');
const easyKeys = extractSidebarKeys(sidebar.slice(easyStart));
const advKeys = extractSidebarKeys(sidebar.slice(advStart, easyStart));
const allNavKeys = new Set([...easyKeys, ...advKeys]);

const dashTabs = read('app/business/[category]/components/DashboardTabs.jsx');
const tabPanels = extractTabsContentValues(dashTabs);

for (const key of allNavKeys) {
  const resolved = resolveDashboardTab(key);
  if (!tabPanels.has(resolved) && resolved !== key) {
    // aliased away — panel must exist for resolved
    if (!tabPanels.has(resolved)) {
      mark(`nav key "${key}" resolves to "${resolved}" but no TabsContent`);
      continue;
    }
  }
  if (!tabPanels.has(resolved)) {
    mark(`nav key "${key}" has no TabsContent value="${resolved}"`);
  } else {
    ok(`nav ${key} → panel ${resolved}`);
  }
}

// Easy mode must expose finance + gst
if (![...easyKeys].includes('finance')) mark('Easy nav missing finance');
else ok('Easy nav has finance');
if (![...easyKeys].includes('gst')) mark('Easy nav missing gst');
else ok('Easy nav has gst');

// 4. No duplicate GlobalCommandPalette in shell
const shell = read('components/layout/BusinessShellLayout.jsx');
const mountsGlobal = /import\s+.*GlobalCommandPalette|<\s*GlobalCommandPalette/.test(shell);
if (mountsGlobal) {
  mark('BusinessShellLayout still mounts GlobalCommandPalette');
} else if (!shell.includes('LazyCommandPalette')) {
  mark('BusinessShellLayout missing LazyCommandPalette');
} else ok('Single LazyCommandPalette in hub shell');

// 5. Expenses double-stack removed
if (dashTabs.includes('ExpenseManager')) {
  mark('DashboardTabs still references ExpenseManager (duplicate finance surface)');
} else ok('ExpenseManager removed from DashboardTabs');

if (!dashTabs.includes('value="finance"') || !dashTabs.includes('FinanceHub')) {
  mark('FinanceHub missing from finance tab');
} else ok('FinanceHub wired on finance tab');

// Legacy finance panels should not remain as top-level TabsContent
for (const dead of ['accounting', 'expenses', 'credit-notes', 'fiscal', 'exchange-rates']) {
  if (dashTabs.includes(`value="${dead}"`)) {
    mark(`Dead TabsContent value="${dead}" still present (should alias → finance)`);
  } else ok(`no dead panel ${dead}`);
}

// 6. Payment types
const { normalizePaymentType, paymentTypeFilterValues } = paymentTypes;
if (normalizePaymentType('in') !== 'receipt') mark("normalizePaymentType('in') !== receipt");
else ok("payment_type 'in' → receipt");
if (normalizePaymentType('receipt') !== 'receipt') mark('receipt normalize broken');
else ok('payment_type receipt canonical');

const writers = [
  'lib/actions/storefront/payments.js',
  'lib/actions/storefront/orders.js',
  'lib/actions/standard/restaurant.js',
];
for (const f of writers) {
  const src = read(f);
  if (src.includes("'in'") && /payment_type[\s\S]{0,80}'in'/.test(src)) {
    // Allow stock_movements movement_type 'in'
    const paymentInserts = src.match(/INSERT INTO payments[\s\S]{0,400}/g) || [];
    for (const block of paymentInserts) {
      if (block.includes("'in'") || block.includes(',\'in\'')) {
        mark(`${f} still writes payments.payment_type 'in'`);
      }
    }
  }
  if (/VALUES \(\$1,\s*'receipt'/.test(src) || /VALUES \(\$1,'receipt'/.test(src)) {
    ok(`${f} writes receipt`);
  }
}

// 7. Migration present
const mig = path.join(root, 'prisma/migrations/20260712_schema_audit_fixes/migration.sql');
if (!fs.existsSync(mig)) mark('missing migration 20260712_schema_audit_fixes');
else {
  const sql = fs.readFileSync(mig, 'utf8');
  for (const needle of [
    'tax_payments',
    'storefront_order_items',
    'business_id',
    'invoices_business_invoice_number_active_key',
    "payment_type\" = 'receipt'",
  ]) {
    if (!sql.includes(needle)) mark(`migration missing ${needle}`);
  }
  ok('migration 20260712_schema_audit_fixes present');
}

// 8. Schema models
const schema = read('prisma/schema.prisma');
if (!schema.includes('model tax_payments')) mark('schema missing tax_payments');
else ok('schema has tax_payments');
if (!/model storefront_order_items \{[\s\S]*?business_id/.test(schema)) {
  mark('storefront_order_items missing business_id in schema');
} else ok('storefront_order_items.business_id in schema');
if (!/model invoice_payments \{[\s\S]*?business_id\s+String\s/.test(schema)) {
  mark('invoice_payments.business_id still optional in schema');
} else ok('invoice_payments.business_id required');

// 9. InventoryService dead CRUD gone + FIFO filters
const inv = read('lib/services/InventoryService.js');
if (/\basync createProduct\b/.test(inv)) mark('InventoryService.createProduct still present');
else ok('dead createProduct removed');
if (/\basync updateProduct\b/.test(inv)) mark('InventoryService.updateProduct still present');
else ok('dead updateProduct removed');
if (!inv.includes("COALESCE(is_deleted, false) = false") || !inv.includes('product_batches')) {
  mark('InventoryService missing soft-delete batch filters');
} else ok('InventoryService soft-delete filters present');

// 10. Form actionSuccess pattern on key product path
const composite = read('lib/actions/premium/automation/inventory_composite.js');
if (!composite.includes('upsertIntegratedProduct') && !composite.includes('upsertIntegratedProductAction')) {
  // file may export differently
  if (!/export async function upsertIntegratedProduct/.test(composite)) {
    mark('upsertIntegratedProductAction missing from inventory_composite');
  }
} else ok('integrated product upsert present');

if (!composite.includes('COALESCE(is_deleted, false) = false')) {
  mark('inventory_composite missing soft-delete batch/serial filters');
} else ok('inventory_composite soft-delete filters present');

// 11. Mobile nav overflow includes customers/purchases/reports
const mobile = read('lib/hooks/useHubMobileNav.js');
for (const k of ['customers', 'purchases', 'reports', 'vendors', 'settings']) {
  if (!mobile.includes(`key: '${k}'`)) mark(`mobile overflow missing ${k}`);
  else ok(`mobile overflow has ${k}`);
}

// 12. Header normalizes tab
const header = read('components/layout/Header.jsx');
if (!header.includes('normalizeDashboardTab')) mark('Header missing normalizeDashboardTab');
else ok('Header normalizes tab param');

// 13. Instant tab nav — shallow URL sync + HubTabProvider SOT
const hubNav = read('lib/utils/hubTabNavigation.js');
const hubTabCtx = read('lib/context/HubTabContext.jsx');
const shellLayout = read('components/layout/BusinessShellLayout.jsx');
const sidebarSrc = read('components/layout/Sidebar.jsx');
const mobileNavSrc = read('components/layout/HubMobileBottomNav.jsx');
const dashClient = read('app/business/[category]/DashboardClient.jsx');
const cmdPalette = read('components/layout/CommandPalette.jsx');
const tabsUi = read('components/ui/tabs.jsx');
if (!hubNav.includes('history') || !hubNav.includes('pushState') || !hubNav.includes('navigateHubTab')) {
  mark('hubTabNavigation missing pushState / navigateHubTab');
} else ok('hubTabNavigation shallow pushState');
if (!hubTabCtx.includes('HubTabProvider') || !hubTabCtx.includes('goToTab')) {
  mark('HubTabContext missing provider/goToTab');
} else ok('HubTabProvider SOT');
if (!shellLayout.includes('HubTabProvider')) mark('BusinessShellLayout missing HubTabProvider');
else ok('BusinessShellLayout wraps HubTabProvider');
if (!sidebarSrc.includes('useHubTab') || !sidebarSrc.includes('goToTab')) {
  mark('Sidebar not using HubTabProvider');
} else ok('Sidebar uses HubTabProvider');
if (!mobileNavSrc.includes('useHubTab')) mark('HubMobileBottomNav not using HubTabProvider');
else ok('HubMobileBottomNav uses HubTabProvider');
if (!dashClient.includes('useHubTab') || !dashClient.includes('goToTab')) {
  mark('DashboardClient missing useHubTab/goToTab');
} else ok('DashboardClient uses HubTabProvider');
if (!cmdPalette.includes('goToTab') && !cmdPalette.includes('navigateHubTabFromLocation')) {
  mark('CommandPalette still router.push(?tab=)');
} else ok('CommandPalette shallow tab nav');
if (/router\.push\([^)]*tab=/.test(sidebarSrc)) {
  mark('Sidebar still router.push(?tab=) — causes RSC soft-nav lag');
} else ok('Sidebar no router.push(?tab=)');
if (/router\.push\([^)]*\$\{[^}]*\}.*tab/.test(cmdPalette) || /router\.push\(`\/business\/\$\{[^}]+\}?\?\$\{qs/.test(cmdPalette)) {
  mark('CommandPalette still router.push with tab query');
} else ok('CommandPalette no router.push tab query');
if (!tabsUi.includes('data-[state=inactive]:hidden')) {
  mark('TabsContent missing inactive hide (forceMount overlap)');
} else ok('TabsContent hides inactive forceMount panels');
if (!hubNav.includes('prefetchHotHubTabsIdle')) mark('missing idle hot-tab prefetch');
else ok('idle hot-tab prefetch');

console.log(`\n=== ${failed === 0 ? 'PASS' : 'FAIL'} (${failed} failure(s)) ===`);
process.exit(failed === 0 ? 0 : 1);
