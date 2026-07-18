/**
 * Static wiring check: child tables must have required business_id in schema
 * and write paths must include business_id for new inserts.
 *
 * Run: node scripts/verify-child-tables-business-id.mjs
 * Or: bun run verify:child-tables-business-id
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

let failed = false;
const mark = (msg) => {
  console.error(`FAIL: ${msg}`);
  failed = true;
};

const migration = 'prisma/migrations/20260718_child_tables_business_id_complete/migration.sql';
if (!exists(migration)) {
  mark(`${migration} must exist`);
} else {
  const sql = read(migration);
  for (const tbl of [
    'product_specifications',
    'cycle_count_items',
    'inventory_adjustments',
    'bank_statement_lines',
    'quotation_items',
    'sales_order_items',
    'storefront_order_items',
  ]) {
    if (!sql.includes(`"${tbl}"`) && !sql.includes(tbl)) {
      mark(`migration must cover ${tbl}`);
    }
  }
  if (!sql.includes('set_child_business_id')) {
    mark('migration must extend set_child_business_id triggers');
  }
}

if (!exists('lib/db/migrations/047_child_tables_business_id_complete.sql')) {
  mark('lib/db/migrations/047_child_tables_business_id_complete.sql must mirror Prisma migration');
}

const schema = read('prisma/schema.prisma');

const requiredModels = [
  'product_specifications',
  'cycle_count_items',
  'inventory_adjustments',
  'bank_statement_lines',
  'purchase_items',
  'pos_transaction_items',
  'storefront_order_items',
  'quotation_items',
  'sales_order_items',
  'product_reviews',
];

for (const model of requiredModels) {
  const re = new RegExp(`model ${model} \\{[\\s\\S]*?business_id\\s+String\\?`);
  if (re.test(schema)) {
    mark(`${model}.business_id must be required String (not String?)`);
  }
  const hasRequired = new RegExp(`model ${model} \\{[\\s\\S]*?business_id\\s+String\\s+@db\\.Uuid`);
  if (!hasRequired.test(schema)) {
    mark(`${model} must declare business_id String @db.Uuid`);
  }
}

const cycleRoute = read('app/api/v1/inventory/cycle-counts/route.js');
if (!cycleRoute.includes('business_id') || !/INSERT INTO cycle_count_items[\s\S]*business_id/.test(cycleRoute)) {
  mark('cycle-counts INSERT must include business_id');
}

const bankRoute = read('app/api/v1/finance/bank-reconciliation/route.js');
if (!/INSERT INTO bank_statement_lines[\s\S]*business_id/.test(bankRoute)) {
  mark('bank_statement_lines INSERT must include business_id');
}

const promo = read('lib/services/PromotionService.js');
if (!/INSERT INTO promotion_products[\s\S]*business_id/.test(promo)) {
  mark('PromotionService must write promotion_products.business_id');
}

if (failed) {
  process.exit(1);
}
console.log('OK: child tables business_id wiring verified.');
