#!/usr/bin/env node
/**
 * Verify milk-shop Route Hisab wiring (helpers, schema, actions, hub tab).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isMilkHisabRelevant,
  resolveMilkHisabProducts,
  readMilkCustomerPrefs,
  toMilkHisabDateKey,
  toMilkHisabPeriodKey,
  toMilkHisabWeekKey,
  parseMilkHisabBillingPeriod,
  milkHisabPeriodMarker,
  invoiceHasMilkHisabPeriod,
  buildMilkHisabPeriodKpis,
  shortMilkHisabProductLabel,
  isMilkHisabWalkInCustomer,
} from '../lib/storefront/milkShopHisab.js';
import { isMilkShopStore } from '../lib/storefront/milkShopStorefront.js';
import { resolveDomainKey } from '../lib/config/domainKeyAliases.js';
import { getDomainKnowledge } from '../lib/domainKnowledge.js';
import { VALID_DASHBOARD_TABS, normalizeDashboardTab } from '../lib/config/tabs.js';
import { getNavItemAccess } from '../lib/rbac/permissions.js';
import { buildMilkHisabThermalOpts } from '../lib/print/milkHisabThermalBill.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const errors = [];

function assert(cond, msg) {
  if (!cond) errors.push(msg);
}

assert(isMilkHisabRelevant('milk-shop'), 'milk-shop should be hisab-relevant');
assert(isMilkHisabRelevant('milk'), 'milk alias should be hisab-relevant');
assert(isMilkHisabRelevant('doodh-shop'), 'doodh-shop alias should be hisab-relevant');
assert(!isMilkHisabRelevant('supermarket'), 'supermarket must not be hisab-relevant');
assert(!isMilkHisabRelevant('dairy-farm'), 'dairy-farm must not be hisab-relevant');
assert(isMilkShopStore('milk-shop') === isMilkHisabRelevant('milk-shop'), 'gate should align with isMilkShopStore');

assert(toMilkHisabDateKey('2026-07-23T12:00:00.000Z') === '2026-07-23', 'date key YYYY-MM-DD');
assert(toMilkHisabPeriodKey('2026-07-23') === '2026-07', 'period key YYYY-MM');
assert(toMilkHisabWeekKey('2026-07-23') === '2026-W30', 'ISO week key for 2026-07-23');
assert(milkHisabPeriodMarker('2026-07') === '[milk_hisab_period=2026-07]', 'period marker format');
assert(milkHisabPeriodMarker('2026-W30') === '[milk_hisab_period=2026-W30]', 'week marker format');
assert(invoiceHasMilkHisabPeriod('Milk route hisab 2026-07. [milk_hisab_period=2026-07]', '2026-07'), 'notes marker detect');
assert(invoiceHasMilkHisabPeriod('Weekly. [milk_hisab_period=2026-W30]', '2026-W30'), 'week notes marker');
assert(!invoiceHasMilkHisabPeriod('other notes', '2026-07'), 'unrelated notes must not match');

const monthBounds = parseMilkHisabBillingPeriod('2026-07');
assert(monthBounds.kind === 'month', 'month kind');
assert(monthBounds.startIso === '2026-07-01', 'month start');
assert(monthBounds.endIso === '2026-07-31', 'month end');

const weekBounds = parseMilkHisabBillingPeriod('2026-W30');
assert(weekBounds.kind === 'week', 'week kind');
assert(weekBounds.startIso === '2026-07-20', 'ISO week 30 2026 starts Mon 20 Jul');
assert(weekBounds.endIso === '2026-07-26', 'ISO week 30 2026 ends Sun 26 Jul');

const thermal = buildMilkHisabThermalOpts({
  business: { business_name: 'Tenvo Milk', settings: {}, currency: 'PKR', country: 'Pakistan' },
  invoice: {
    invoice_number: 'INV-0001',
    customer_name: 'Ali',
    grand_total: 1500,
    subtotal: 1500,
    payment_status: 'unpaid',
  },
  items: [{ name: 'Fresh Milk', quantity: 10, unit_price: 150, total_amount: 1500, product_unit: 'kg' }],
  houseNo: 'A-12',
  period: '2026-W30',
});
assert(thermal.paperSize === '58mm', 'thermal paperSize 58mm');
assert(thermal.documentLabel === 'Weekly Hisab Bill', 'weekly bill label');
assert(String(thermal.sale.customerName).includes('House A-12'), 'house on thermal customer line');
assert(thermal.lineItems?.length === 1, 'thermal line items');

const monthlyThermal = buildMilkHisabThermalOpts({
  business: { business_name: 'Tenvo Milk', settings: {} },
  invoice: { invoice_number: 'INV-0002', grand_total: 100, customer_name: 'Sara' },
  items: [],
  period: '2026-07',
});
assert(monthlyThermal.documentLabel === 'Monthly Hisab Bill', 'monthly bill label');

const products = [
  { id: '1', name: 'Fresh Milk', category: 'Fresh Milk', unit: 'kg', is_active: true },
  { id: '2', name: 'Farm Eggs', category: 'Eggs', unit: 'dozen', is_active: true },
  { id: '3', name: 'Butter', category: 'Cream & Butter', unit: 'kg', is_active: true },
  { id: '4', name: 'Bread Loaf', category: 'Bakery', unit: 'pcs', is_active: true },
];
const cols = resolveMilkHisabProducts(products, {});
assert(cols.length >= 4, 'default hisab columns should pick milk/eggs/bread/butter');
assert(cols[0]?.name === 'Fresh Milk', 'milk should be first matched column');

const prefs = readMilkCustomerPrefs({
  address: 'fallback',
  domain_data: { houseno: 'A-12', deliveryroute: 'Route A', dailymilkkg: 5, deliveryactive: 'Yes' },
});
assert(prefs.houseNo === 'A-12', 'house no from domain_data');
assert(prefs.routeLabel === 'Route A', 'route from domain_data');
assert(prefs.dailyMilkKg === 5, 'daily kg');
assert(prefs.deliveryActive === true, 'delivery active');

const inactive = readMilkCustomerPrefs({ domain_data: { deliveryactive: 'No' } });
assert(inactive.deliveryActive === false, 'delivery inactive when No');

assert(isMilkHisabWalkInCustomer('Walk-in Guest'), 'walk-in detect');
assert(!isMilkHisabWalkInCustomer('Zeeshan'), 'named customer is not walk-in');
assert(shortMilkHisabProductLabel('Anhaar Farm Fresh Milk (kg)', 18).length <= 18, 'short product label');

const kpi = buildMilkHisabPeriodKpis([
  { amount: 100, billed: false, stopCount: 2 },
  { amount: 200, billed: true, paymentStatus: 'unpaid', stopCount: 3 },
  { amount: 50, billed: true, paymentStatus: 'paid', stopCount: 1 },
  { amount: 0, billed: false, stopCount: 1 },
]);
assert(kpi.customers === 3, 'KPI customers ignores zero unbilled');
assert(kpi.unbilledCount === 1 && kpi.unbilledAmount === 100, 'KPI unbilled');
assert(kpi.unpaidCount === 1 && kpi.unpaidAmount === 200, 'KPI unpaid');
assert(kpi.paidCount === 1 && kpi.paidAmount === 50, 'KPI paid');
assert(kpi.totalAmount === 350, 'KPI period total');
assert(kpi.deliveryDays === 6, 'KPI delivery days');

const knowledge = getDomainKnowledge('milk-shop');
assert(
  Array.isArray(knowledge?.customerFields) && knowledge.customerFields.includes('House No'),
  'milk-shop customerFields include House No'
);
assert(knowledge?.fieldConfig?.houseno, 'fieldConfig.houseno required');
assert(knowledge?.fieldConfig?.dailymilkkg, 'fieldConfig.dailymilkkg required');
assert(
  Array.isArray(knowledge?.reports) && knowledge.reports.includes('Route Hisab'),
  'reports should list Route Hisab'
);

assert(VALID_DASHBOARD_TABS.has('route-hisab'), 'VALID_TAB_LIST must include route-hisab');
assert(normalizeDashboardTab('hisab') === 'route-hisab', 'hisab alias → route-hisab');
assert(normalizeDashboardTab('milk-hisab') === 'route-hisab', 'milk-hisab alias → route-hisab');

const nav = getNavItemAccess('route-hisab', 'owner', 'starter', {}, null, null);
assert(nav.visible === true, 'route-hisab nav should be visible for owner with sales.view');

const schema = readFileSync(resolve(root, 'prisma/schema.prisma'), 'utf8');
assert(schema.includes('model milk_delivery_stops'), 'schema must define milk_delivery_stops');
assert(schema.includes('model milk_delivery_lines'), 'schema must define milk_delivery_lines');
assert(
  schema.includes('milk_delivery_stops_business_date_customer_key'),
  'unique map on stops business/date/customer'
);

const mig = resolve(root, 'prisma/migrations/20260723_milk_delivery_hisab/migration.sql');
assert(existsSync(mig), 'migration 20260723_milk_delivery_hisab must exist');

const actionSrc = readFileSync(resolve(root, 'lib/actions/standard/milkHisab.js'), 'utf8');
for (const name of [
  'getMilkHisabDayAction',
  'saveMilkHisabDayAction',
  'getMilkHisabPeriodSummaryAction',
  'getMilkHisabMonthSummaryAction',
  'generateMilkHisabInvoicesAction',
  'getMilkHisabBillPrintAction',
  'prepareMilkHisabReminderAction',
  'sendMilkHisabReminderAction',
  'sendMilkHisabBulkRemindersAction',
]) {
  assert(actionSrc.includes(`export async function ${name}`), `missing action ${name}`);
}
assert(actionSrc.includes('skip_inventory: true'), 'month invoices must skip inventory');
assert(actionSrc.includes('isMilkHisabRelevant'), 'actions must gate on isMilkHisabRelevant');
assert(actionSrc.includes('parseMilkHisabBillingPeriod'), 'actions must parse week/month periods');
assert(actionSrc.includes('buildMilkHisabPeriodKpis'), 'period summary must build KPIs');
assert(actionSrc.includes('is_deleted: true'), 'save must soft-delete empty stops');
assert(actionSrc.includes('meaningfulLines'), 'period summary must skip empty line stops');
assert(
  !actionSrc.includes('business_name: true,\n        name: true') &&
    !actionSrc.includes('business_name: true,\r\n        name: true'),
  'businesses select must not use invalid name field'
);
assert(!/^\s*handle:\s*true,/m.test(actionSrc), 'businesses select must not use invalid handle field');
assert(actionSrc.includes('business?.domain ||'), 'reminder actionUrl must use domain (not handle)');

const ui = resolve(root, 'components/milk/MilkRouteHisab.jsx');
assert(existsSync(ui), 'MilkRouteHisab.jsx must exist');
const uiSrc = readFileSync(ui, 'utf8');
assert(uiSrc.includes('printMilkHisabThermalBill'), 'UI must print 58mm thermal bills');
assert(uiSrc.includes('Generate weekly') || uiSrc.includes('weekly'), 'UI must support weekly bills');
assert(uiSrc.includes('type="week"'), 'UI must use week picker');
assert(uiSrc.includes('sendMilkHisabReminderAction'), 'UI must wire reminders');
assert(uiSrc.includes('Remind unpaid'), 'UI must expose bulk remind');
assert(uiSrc.includes('HisabKpiStrip') || uiSrc.includes('billStatItems'), 'UI must render period KPIs');
assert(uiSrc.includes('MobileStatStrip'), 'UI must render mobile KPI strip');
assert(uiSrc.includes('shortMilkHisabProductLabel'), 'UI must shorten product headers');

const remindHelpers = resolve(root, 'lib/storefront/milkShopHisabReminders.js');
assert(existsSync(remindHelpers), 'milkShopHisabReminders.js must exist');
const remindSrc = readFileSync(remindHelpers, 'utf8');
assert(remindSrc.includes('buildMilkHisabWhatsAppUrl'), 'WhatsApp wa.me helper required');
assert(remindSrc.includes('resolveMilkHisabReminderChannels'), 'channel resolver required');

const thermalFile = resolve(root, 'lib/print/milkHisabThermalBill.js');
assert(existsSync(thermalFile), 'milkHisabThermalBill.js must exist');
const thermalSrc = readFileSync(thermalFile, 'utf8');
assert(thermalSrc.includes("paperSize: '58mm'"), 'thermal helper defaults to 58mm');
assert(thermalSrc.includes('dispatchThermalReceipt'), 'thermal helper reuses POS receipt path');
assert(thermalSrc.includes('buildMilkHisabThermalOptsFromRow'), 'thermal helper supports per-customer draft print');
assert(thermalSrc.includes('printMilkHisabThermalBillFromRow'), 'thermal helper exports row print');

const docNum = readFileSync(resolve(root, 'lib/db/documentNumber.js'), 'utf8');
assert(docNum.includes('::bigint'), 'document numbers must use BIGINT (not INTEGER)');
assert(!docNum.includes('AS INTEGER'), 'document numbers must not cast to INTEGER');
assert(uiSrc.includes('printMilkHisabThermalBillFromRow') || uiSrc.includes('canPrint'), 'UI must allow print per customer');

const tabs = readFileSync(resolve(root, 'app/business/[category]/components/DashboardTabs.jsx'), 'utf8');
assert(tabs.includes('route-hisab'), 'DashboardTabs must wire route-hisab');
assert(tabs.includes('MilkRouteHisab'), 'DashboardTabs must mount MilkRouteHisab');
assert(tabs.includes('milkHisabRelevant'), 'DashboardTabs must domain-gate milk hisab');

const sidebar = readFileSync(resolve(root, 'components/layout/Sidebar.jsx'), 'utf8');
assert(sidebar.includes("key: 'route-hisab'"), 'Sidebar must list route-hisab');
assert(sidebar.includes("domainRule: 'milkHisab'"), 'Sidebar must use milkHisab domainRule');

const mobile = readFileSync(resolve(root, 'lib/hooks/useHubMobileNav.js'), 'utf8');
assert(mobile.includes("key: 'route-hisab'"), 'mobile nav must include route-hisab');

assert(resolveDomainKey('milk') === 'milk-shop', 'milk alias still resolves');

if (errors.length) {
  console.error('verify-milk-shop-hisab FAILED:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log('verify-milk-shop-hisab OK');
