#!/usr/bin/env node
/**
 * verify-performance-wiring.mjs
 *
 * Validates all performance and robustness improvements are correctly wired:
 * 1. Batch serial INSERTs (no serial loops)
 * 2. Stock sync trigger compatibility (readCurrentStock used instead of syncProductStock on hot paths)
 * 3. RLS tenant context injection (setTenantContext called in transactions)
 * 4. Connection pool config (max >= 30, statement_timeout set)
 * 5. Read pool export availability
 * 6. Cache invalidation uses pool.query (no manual connect/release leaks)
 * 7. Tenant cache module exists and exports correctly
 * 8. DataFetchingService: no bare React.useState references
 * 9. Redis TTLs expanded for hub cache
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
const errors = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    const msg = detail ? `${name}: ${detail}` : name;
    errors.push(msg);
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function readFile(relPath) {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf-8');
}

console.log('\n🔍 Verifying Performance & Robustness Wiring\n');

// ── 1. InventoryService: Batch serial INSERTs ─────────────────────────
console.log('─── InventoryService ───');
const invSrc = readFile('lib/services/InventoryService.js');
check(
  'Batch serial INSERT uses unnest',
  invSrc && invSrc.includes('unnest($5::text[])'),
  'Expected unnest-based batch INSERT for serials'
);
check(
  'No serial INSERT loop in addStock',
  invSrc && !invSrc.includes('for (const sn of serialNumbers)'),
  'Old O(n) serial loop still present'
);
check(
  'readCurrentStock method exists',
  invSrc && invSrc.includes('async readCurrentStock('),
  'readCurrentStock helper should replace syncProductStock on hot paths'
);
check(
  'setTenantContext method exists',
  invSrc && invSrc.includes('async setTenantContext('),
  'RLS tenant context setter should exist'
);
check(
  'setTenantContext called in addStock',
  invSrc && /addStock[\s\S]*?setTenantContext/.test(invSrc),
  'setTenantContext should be called after BEGIN in addStock'
);
check(
  'readCurrentStock used in addStock instead of syncProductStock',
  invSrc && /addStock[\s\S]*?readCurrentStock/.test(invSrc),
  'addStock should read trigger-synced stock, not call syncProductStock'
);

// ── 2. Database config ────────────────────────────────────────────────
console.log('─── Database Config ───');
const dbSrc = readFile('lib/db.js');
check(
  'Pool max >= 30',
  dbSrc && /max:.*?30/.test(dbSrc),
  'Default pool max should be 30+'
);
check(
  'statement_timeout configured',
  dbSrc && dbSrc.includes('statement_timeout'),
  'statement_timeout prevents runaway queries'
);
check(
  'readPool exported',
  dbSrc && dbSrc.includes('readPool'),
  'Read replica pool should be available'
);
check(
  'application_name set',
  dbSrc && dbSrc.includes("application_name: 'tenvo-app'"),
  'application_name helps DB monitoring'
);

// ── 3. Cache invalidation ─────────────────────────────────────────────
console.log('─── Cache Invalidation ───');
const invCatSrc = readFile('lib/storefront/invalidateStorefrontCatalog.js');
check(
  'No manual connect/release in invalidation',
  invCatSrc && !invCatSrc.includes('pool.connect()'),
  'Should use pool.query() to prevent connection leaks'
);
check(
  'purgeTenantCacheAll imported',
  invCatSrc && invCatSrc.includes('purgeTenantCacheAll'),
  'Hub cache should be purged on catalog invalidation'
);

// ── 4. Tenant cache module ────────────────────────────────────────────
console.log('─── Tenant Cache ───');
const tenantCacheSrc = readFile('lib/cache/tenantCache.js');
check(
  'tenantCache.js exists',
  tenantCacheSrc !== null,
  'lib/cache/tenantCache.js should exist'
);
check(
  'getTenantCache exported',
  tenantCacheSrc && tenantCacheSrc.includes('export async function getTenantCache'),
  'Read function should be exported'
);
check(
  'setTenantCache exported',
  tenantCacheSrc && tenantCacheSrc.includes('export async function setTenantCache'),
  'Write function should be exported'
);
check(
  'purgeTenantCacheAll exported',
  tenantCacheSrc && tenantCacheSrc.includes('export function purgeTenantCacheAll'),
  'Purge-all function should be exported'
);

// ── 5. Redis TTLs ─────────────────────────────────────────────────────
console.log('─── Redis TTLs ───');
const ttlSrc = readFile('lib/cache/redisTtl.js');
check(
  'tenantProducts TTL exists',
  ttlSrc && ttlSrc.includes('tenantProducts'),
  'Product list cache TTL should exist'
);
check(
  'tenantDashboard TTL exists',
  ttlSrc && ttlSrc.includes('tenantDashboard'),
  'Dashboard KPI cache TTL should exist'
);

// ── 6. DataFetchingService ────────────────────────────────────────────
console.log('─── DataFetchingService ───');
const dfSrc = readFile('lib/services/dataFetching.js');
check(
  'No bare React.useState in code',
  dfSrc && !dfSrc.match(/^\s*(?:const|let|var).*React\.useState/m),
  'React was never imported; bare React.useState would crash'
);
check(
  'evictStaleEntries method exists',
  dfSrc && dfSrc.includes('evictStaleEntries'),
  'Cache size limiter should prevent memory leaks'
);

// ── 7. Migration file ─────────────────────────────────────────────────
console.log('─── Migration ───');
const migSrc = readFile('prisma/migrations/20260726_performance_robustness/migration.sql');
check(
  'Migration file exists',
  migSrc !== null,
  'Performance migration SQL should exist'
);
check(
  'Stock sync trigger defined',
  migSrc && migSrc.includes('fn_sync_product_stock_from_locations'),
  'Trigger function for stock sync should be defined'
);
check(
  'Auto updated_at trigger defined',
  migSrc && migSrc.includes('fn_auto_updated_at'),
  'Auto updated_at trigger for raw SQL writes should be defined'
);
check(
  'RLS policies defined',
  migSrc && migSrc.includes('ROW LEVEL SECURITY'),
  'RLS policies for tenant isolation should be defined'
);
check(
  'Missing indexes added',
  migSrc && migSrc.includes('idx_businesses_domain'),
  'New indexes for businesses.domain should be defined'
);

// ── Summary ───────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (errors.length > 0) {
  console.log('\nFailures:');
  errors.forEach((e) => console.log(`  • ${e}`));
  process.exit(1);
} else {
  console.log('\n✅ All performance & robustness checks passed!\n');
}
