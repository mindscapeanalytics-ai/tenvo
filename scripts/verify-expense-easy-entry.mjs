/**
 * Smoke checks for Easy expense accuracy (no DB).
 * Run: bun scripts/verify-expense-easy-entry.mjs
 */
import { expenseSchema } from '../lib/validation/schemas.js';
import {
  findExpenseCategory,
  getExpenseCategoriesForDomain,
  normalizeExpenseCategory,
} from '../lib/utils/expenseCategories.js';
import { ACCOUNT_CODES } from '../lib/config/accounting.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
let failed = 0;

function ok(msg) {
  console.log(`OK: ${msg}`);
}
function mark(msg) {
  failed += 1;
  console.error(`FAIL: ${msg}`);
}

const milk = getExpenseCategoriesForDomain('milk-shop');
if (!milk.some((c) => c.value === 'route_fuel')) mark('milk-shop missing route_fuel');
else ok('milk-shop has route_fuel');

const route = findExpenseCategory('route_fuel');
if (!route || route.account_code !== ACCOUNT_CODES.LOGISTICS) {
  mark('findExpenseCategory(route_fuel) without domainKey should resolve logistics code');
} else ok('findExpenseCategory resolves overlay without domainKey');

const supplier = findExpenseCategory('supplier_milk', 'milk-shop');
if (!supplier?.account_code) mark('supplier_milk missing account_code');
else ok('supplier_milk has account_code');

if (normalizeExpenseCategory('Salary') !== 'salaries') mark('Salary normalize');
else ok('normalize Salary → salaries');

const easyPayload = {
  businessId: '00000000-0000-4000-8000-000000000001',
  accountId: null,
  category: 'route_fuel',
  amount: 500,
  taxAmount: 0,
  paymentMethod: 'cash',
  date: '2026-07-26',
  description: 'Route fuel',
};
const parsed = expenseSchema.safeParse(easyPayload);
if (!parsed.success) mark(`Easy payload schema: ${parsed.error.message}`);
else ok('Easy payload validates without accountId');

const bad = expenseSchema.safeParse({
  ...easyPayload,
  category: null,
  accountId: null,
  amount: 10,
});
if (bad.success) mark('Schema should reject missing category and accountId');
else ok('Schema rejects missing category+account');

const formSrc = readFileSync(join(root, 'components/ExpenseEntryForm.jsx'), 'utf8');
if (!formSrc.includes('Never keep a previous category') && !formSrc.includes('accountId: suggested || \'\'')) {
  mark('Form may still sticky-keep previous GL account');
} else ok('Form clears GL account on category change');
if (!formSrc.includes('showAccurate && accountRaw')) {
  mark('Easy mode should omit accountId so server resolves');
} else ok('Easy mode defers GL to server');
if (!formSrc.includes('domainKey')) mark('Form missing domainKey in payload');
else ok('Form sends domainKey');

const actionSrc = readFileSync(join(root, 'lib/actions/basic/expense.js'), 'utf8');
if (!actionSrc.includes('domainKey')) mark('createExpenseAction missing domainKey');
else ok('createExpenseAction uses domainKey');

const tr = readFileSync(join(root, 'lib/translations.js'), 'utf8');
if (!tr.includes('expense_record_title:') || !tr.includes('اخراجات لکھیں')) {
  mark('Urdu expense keys missing');
} else ok('Urdu expense keys present');

if (failed) {
  console.error(`\n=== FAIL (${failed}) ===`);
  process.exit(1);
}
console.log('\n=== PASS ===');
