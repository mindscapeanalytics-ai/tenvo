/**
 * Validates inventory schema alignment + hub wiring (locations, transfers, dates, migrations).
 * Run: bun run verify:inventory-wiring
 */
import { readFileSync, existsSync } from 'fs';
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

// --- Prisma schema columns ---
const schema = read('prisma/schema.prisma');

if (!schema.includes('variant_id') || !schema.match(/model stock_movements[\s\S]*?variant_id/)) {
  fail('prisma/schema.prisma: stock_movements.variant_id missing');
} else {
  pass('stock_movements.variant_id in Prisma schema');
}

if (!schema.match(/model product_stock_locations[\s\S]*?created_at/)) {
  fail('prisma/schema.prisma: product_stock_locations.created_at missing');
} else {
  pass('product_stock_locations.created_at in Prisma schema');
}

if (!schema.includes('stock_movements_variant_id_fkey') && !schema.includes('product_variants')) {
  fail('prisma/schema.prisma: stock_movements → product_variants relation missing');
} else if (schema.match(/model stock_movements[\s\S]*?product_variants/)) {
  pass('stock_movements → product_variants relation in schema');
}

// --- Migration file ---
const migrationPath = 'prisma/migrations/20260706_inventory_stock_integrity/migration.sql';
if (!existsSync(join(root, migrationPath))) {
  fail(`${migrationPath} missing`);
} else {
  const sql = read(migrationPath);
  if (!sql.includes('variant_id') || !sql.includes('created_at')) {
    fail('inventory stock integrity migration incomplete');
  } else {
    pass('20260706_inventory_stock_integrity migration present');
  }
}

// --- Locations tab prop wiring (P0 fix) ---
const inventoryManager = read('components/InventoryManager.jsx');
if (/\bonAdd=\{onLocationAdd\}/.test(inventoryManager)) {
  fail('InventoryManager still passes onAdd={onLocationAdd} to MultiLocationInventory');
} else if (!inventoryManager.includes('onLocationAdd={onLocationAdd}')) {
  fail('InventoryManager missing onLocationAdd={onLocationAdd} for MultiLocationInventory');
} else {
  pass('InventoryManager uses onLocationAdd for MultiLocationInventory');
}

// --- MultiLocationInventory fallbacks ---
const multiLoc = read('components/MultiLocationInventory.tsx');
for (const api of ['warehouseAPI.createLocation', 'warehouseAPI.updateLocation', 'warehouseAPI.deleteLocation', 'warehouseAPI.createTransfer']) {
  if (!multiLoc.includes(api)) {
    fail(`MultiLocationInventory missing fallback ${api}`);
  }
}
if (!failed || multiLoc.includes('warehouseAPI.createTransfer')) {
  pass('MultiLocationInventory warehouseAPI fallbacks wired');
}

// --- InventoryService tenancy ---
const invSvc = read('lib/services/InventoryService.js');
if (!invSvc.match(/product_stock_locations WHERE warehouse_id.*business_id/)) {
  fail('InventoryService.removeStock location lock missing business_id');
} else {
  pass('InventoryService.removeStock scopes location lock by business_id');
}

if (!invSvc.match(/transferStock[\s\S]*?COALESCE\(state, 'sellable'\)/)) {
  fail('InventoryService.transferStock missing sellable state filter');
} else {
  pass('InventoryService.transferStock filters sellable state');
}

// --- Cycle count warehouse ---
const cycleRoute = read('app/api/v1/inventory/cycle-counts/[id]/route.js');
if (!cycleRoute.includes('cycleWarehouseId')) {
  fail('cycle-counts PATCH does not use cycle_counts.warehouse_id');
} else {
  pass('cycle-counts uses parent warehouse_id for adjustments');
}

// --- Date formatter (Finance crash fix) ---
if (!existsSync(join(root, 'lib/utils/formatDisplayDate.ts'))) {
  fail('lib/utils/formatDisplayDate.ts missing');
} else {
  pass('formatDisplayDate.ts present');
}

const expenseMgr = read('components/finance/ExpenseManager.jsx');
if (!expenseMgr.includes('formatDisplayDate(expense.date)')) {
  fail('ExpenseManager still renders raw expense.date');
} else {
  pass('ExpenseManager uses formatDisplayDate');
}

// --- Storefront FIFO ordering ---
const sfStock = read('lib/storefront/storefrontOrderStock.js');
if (!sfStock.includes('COALESCE(created_at, updated_at)')) {
  fail('storefrontOrderStock FIFO missing resilient date ordering');
} else {
  pass('storefrontOrderStock resilient FIFO ordering');
}

// --- Storefront checkout uses InventoryService ---
const sfInventory = read('lib/storefront/storefrontOrderInventory.js');
if (!sfInventory.includes('InventoryService.removeStock') || !sfInventory.includes('removeVariantStock')) {
  fail('storefrontOrderInventory must route through InventoryService');
} else {
  pass('storefront checkout stock uses InventoryService');
}

const ordersRoute = read('app/api/storefront/[businessDomain]/orders/route.js');
if (!ordersRoute.includes('decrementStorefrontOrderLineStock')) {
  fail('storefront orders route still uses raw SQL stock decrement');
} else {
  pass('storefront orders route uses decrementStorefrontOrderLineStock');
}

if (!invSvc.match(/transferStock[\s\S]*?transaction_type, quantity_change, notes[\s\S]*?'transfer'/)) {
  fail('InventoryService.transferStock missing stock_movements audit rows');
} else {
  pass('InventoryService.transferStock records stock_movements');
}

if (!invSvc.includes('removeVariantStock')) {
  fail('InventoryService.removeVariantStock missing');
} else {
  pass('InventoryService.removeVariantStock present');
}

// --- inventory_reservations FK relations ---
if (!schema.match(/model inventory_reservations[\s\S]*?product_batches/)) {
  fail('inventory_reservations → product_batches relation missing');
} else {
  pass('inventory_reservations batch FK in schema');
}

if (!schema.match(/model inventory_reservations[\s\S]*?warehouse_locations/)) {
  fail('inventory_reservations → warehouse_locations relation missing');
} else {
  pass('inventory_reservations warehouse FK in schema');
}

const reservationFkMigration = 'prisma/migrations/20260707_inventory_reservation_fks/migration.sql';
if (!existsSync(join(root, reservationFkMigration))) {
  fail(`${reservationFkMigration} missing`);
} else {
  pass('20260707_inventory_reservation_fks migration present');
}

// --- ApprovalQueue no longer uses Supabase stock_adjustments ---
const approvalQueue = read('components/inventory/ApprovalQueue.jsx');
if (approvalQueue.includes("from('stock_adjustments')") || approvalQueue.includes('createClient')) {
  fail('ApprovalQueue still queries Supabase stock_adjustments');
} else if (!approvalQueue.includes('useStockAdjustment')) {
  fail('ApprovalQueue not wired to useStockAdjustment');
} else {
  pass('ApprovalQueue uses Prisma-backed useStockAdjustment');
}

if (!existsSync(join(root, 'components/mobile/index.ts'))) {
  fail('components/mobile/index.ts barrel missing');
} else {
  const barrel = read('components/mobile/index.ts');
  if (!barrel.includes('HubSectionHeader')) {
    fail('mobile/index.ts does not export HubSectionHeader');
  } else {
    pass('mobile/index.ts exports HubSectionHeader');
  }
}

if (failed) {
  console.error('\nverify:inventory-wiring FAILED');
  process.exit(1);
}

console.log('\nverify:inventory-wiring passed');
