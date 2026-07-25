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
  milkHisabPeriodsOverlap,
  resolveMilkHisabInvoiceForPeriod,
  extractMilkHisabPeriodFromNotes,
  abbreviateMilkHisabColumn,
  buildMilkHisabDayBreakdownGrid,
  formatMilkHisabDayLine,
  isMilkHisabBillRemindable,
  MILK_HISAB_COLLECTION_NOTE,
} from '../lib/storefront/milkShopHisab.js';
import {
  normalizeMilkHisabBillLocale,
  getMilkHisabDaySheetCopy,
  milkHisabUrduProductLabel,
  localizeMilkHisabPeriodLabel,
  localizeMilkHisabPeriodParts,
  formatMilkHisabPkDate,
  formatMilkHisabTotalLine,
  sortMilkHisabPrintColumns,
} from '../lib/storefront/milkHisabUrdu.js';
import {
  parseWhatsAppWebUrl,
  buildWhatsAppAppUrl,
  toWhatsAppAppUrlFromWeb,
} from '../lib/utils/whatsappOpen.js';
import { isMilkHisabOfflineEnabled, isMilkHisabNetworkFailure } from '../lib/utils/milkHisabOfflineAccess.js';
import {
  milkHisabDaySnapshotKey,
  milkHisabBusinessDateKey,
} from '../lib/utils/milkHisabOfflineDb.js';
import { resolveDomainFieldKey } from '../lib/utils/domainHelpers.ts';
import { isMilkShopStore } from '../lib/storefront/milkShopStorefront.js';
import { resolveDomainKey } from '../lib/config/domainKeyAliases.js';
import { getDomainKnowledge } from '../lib/domainKnowledge.js';
import { VALID_DASHBOARD_TABS, normalizeDashboardTab } from '../lib/config/tabs.js';
import { getNavItemAccess } from '../lib/rbac/permissions.js';
import { buildMilkHisabThermalOpts } from '../lib/print/milkHisabThermalBill.js';
import {
  isMilkShopHubNavAllowed,
  MILK_SHOP_HIDDEN_NAV_KEYS,
  MILK_SHOP_PLAN_NAV_MATRIX,
  mergeMilkShopLeanNavSettings,
} from '../lib/config/milkShopHubNav.js';
import { getMilkShopLeanFeatureStrip } from '../lib/config/domainPackageFeatures.js';
import { getRegistrationVerticalFeatureOverrides } from '../lib/onboarding/registrationVerticalPackaging.js';
import { planHasFeatureWithPackaging } from '../lib/subscription/effectivePlanAccess.js';

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

assert(toMilkHisabDateKey('2026-07-23') === '2026-07-23', 'date key YYYY-MM-DD passthrough');
assert(toMilkHisabPeriodKey('2026-07-23') === '2026-07', 'period key YYYY-MM');
assert(toMilkHisabWeekKey('2026-07-23') === '2026-W30', 'ISO week key for 2026-07-23');
// Local calendar (not UTC): afternoon PK must not shift the day key
{
  const localAfternoon = new Date(2026, 6, 23, 23, 30, 0); // 23 Jul 2026 local
  assert(toMilkHisabDateKey(localAfternoon) === '2026-07-23', 'local date key ignores UTC shift');
}
assert(milkHisabPeriodMarker('2026-07') === '[milk_hisab_period=2026-07]', 'period marker format');
assert(milkHisabPeriodMarker('2026-W30') === '[milk_hisab_period=2026-W30]', 'week marker format');
assert(invoiceHasMilkHisabPeriod('Milk route hisab 2026-07. [milk_hisab_period=2026-07]', '2026-07'), 'notes marker detect');
assert(invoiceHasMilkHisabPeriod('Weekly. [milk_hisab_period=2026-W30]', '2026-W30'), 'week notes marker');
assert(!invoiceHasMilkHisabPeriod('other notes', '2026-07'), 'unrelated notes must not match');
assert(extractMilkHisabPeriodFromNotes('x [milk_hisab_period=2026-W30] y') === '2026-W30', 'extract period');
assert(milkHisabPeriodsOverlap('2026-W30', '2026-07'), 'week overlaps containing month');
assert(!milkHisabPeriodsOverlap('2026-W30', '2026-08'), 'week does not overlap other month');
{
  const invs = [
    {
      id: 'i1',
      customer_id: 'c1',
      invoice_number: 'INV-1',
      notes: 'Milk [milk_hisab_period=2026-W30]',
      payment_status: 'unpaid',
    },
  ];
  const hit = resolveMilkHisabInvoiceForPeriod(invs, 'c1', '2026-07');
  assert(hit?.invoice_number === 'INV-1', 'month summary finds overlapping week invoice');
}

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
assert(cols[0]?.hisabShortLabel === 'Milk', 'milk column short label');
assert(cols.find((c) => /egg/i.test(c.name))?.hisabShortLabel === 'Eggs', 'eggs short label');

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
assert(shortMilkHisabProductLabel({ name: 'Anhaar Farm Fresh Milk', hisabShortLabel: 'Milk' }, 14) === 'Milk', 'prefer hisabShortLabel');
assert(shortMilkHisabProductLabel({ name: 'FARM FRESH EGGS (dozen)' }, 14) === 'Eggs', 'hint eggs from name');

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
assert(knowledge?.fieldConfig?.preferredpayment, 'fieldConfig.preferredpayment required');
assert(
  resolveDomainFieldKey('Preferred Payment Method', 'milk-shop') === 'preferredpayment',
  'Preferred Payment Method alias → preferredpayment'
);
assert(
  resolveDomainFieldKey('Preferred Payment', 'milk-shop') === 'preferredpayment',
  'Preferred Payment → preferredpayment'
);
assert(
  Array.isArray(knowledge?.pakistaniFeatures?.popularBrands) &&
    knowledge.pakistaniFeatures.popularBrands.some((b) => /Olper/i.test(b)),
  'PK milk brands pre-fed'
);
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
  'getMilkHisabCustomerDayBreakdownAction',
  'prepareMilkHisabReminderAction',
  'sendMilkHisabReminderAction',
  'sendMilkHisabBulkRemindersAction',
]) {
  assert(actionSrc.includes(`export async function ${name}`), `missing action ${name}`);
}
assert(actionSrc.includes('skip_inventory: true'), 'month invoices must skip inventory');
assert(actionSrc.includes('skip_credit_check: true'), 'hisab invoices skip credit guard');
assert(actionSrc.includes('resolveMilkHisabInvoiceForPeriod'), 'period billed uses overlap resolver');
assert(actionSrc.includes('failed.push'), 'generate must capture per-customer failures');
assert(actionSrc.includes('MILK_HISAB_PERIOD_PREFIX'), 'period summary loads all hisab invoices');
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
assert(uiSrc.includes('printMilkHisabDayBreakdownBill'), 'UI must print day Y/N sheet');
assert(uiSrc.includes('getMilkHisabCustomerDayBreakdownAction'), 'UI must load day breakdown');
assert(uiSrc.includes('onPrintUrdu') || uiSrc.includes("billLocale: localeKey"), 'UI must offer Urdu print');
assert(uiSrc.includes('اردو'), 'UI must show Urdu print label');
assert(uiSrc.includes('Generate weekly') || uiSrc.includes('weekly'), 'UI must support weekly bills');
assert(uiSrc.includes('type="week"'), 'UI must use week picker');
assert(uiSrc.includes('sendMilkHisabReminderAction'), 'UI must wire reminders');
assert(uiSrc.includes('Remind unpaid'), 'UI must expose bulk remind');
assert(uiSrc.includes('setMilkHisabBillPaymentStatusAction'), 'UI must wire payment toggle action');
assert(uiSrc.includes('MilkHisabPaymentToggle'), 'UI must render compact Unpaid/Paid toggle');
assert(uiSrc.includes('isMilkHisabBillRemindable'), 'UI must gate WhatsApp on unpaid');
assert(uiSrc.includes('lg:hidden'), 'Bills must have mobile card layout');
assert(uiSrc.includes('hidden lg:block'), 'Bills desktop table dual-layout');
assert(actionSrc.includes('setMilkHisabBillPaymentStatusAction'), 'actions must export payment status setter');
assert(actionSrc.includes('MILK_HISAB_COLLECTION_NOTE'), 'payment uses Route Hisab collection marker');
assert(actionSrc.includes('MILK_HISAB_ALREADY_PAID'), 'remind must reject paid invoices');
assert(isMilkHisabBillRemindable({ amount: 100, paymentStatus: 'unpaid' }), 'unpaid remindable');
assert(isMilkHisabBillRemindable({ amount: 100, paymentStatus: null }), 'unbilled remindable');
assert(!isMilkHisabBillRemindable({ amount: 100, paymentStatus: 'paid' }), 'paid not remindable');
assert(!isMilkHisabBillRemindable({ amount: 0, paymentStatus: 'unpaid' }), 'zero amount not remindable');
assert(String(MILK_HISAB_COLLECTION_NOTE).includes('Route Hisab'), 'collection note marker');
assert(uiSrc.includes('HisabKpiStrip') || uiSrc.includes('billStatItems'), 'UI must render period KPIs');
assert(uiSrc.includes('MobileStatStrip'), 'UI must render mobile KPI strip');
assert(uiSrc.includes('shortMilkHisabProductLabel'), 'UI must shorten product headers');

const remindHelpers = resolve(root, 'lib/storefront/milkShopHisabReminders.js');
assert(existsSync(remindHelpers), 'milkShopHisabReminders.js must exist');
const remindSrc = readFileSync(remindHelpers, 'utf8');
assert(remindSrc.includes('buildMilkHisabWhatsAppUrl'), 'WhatsApp wa.me helper required');
assert(remindSrc.includes('resolveMilkHisabReminderChannels'), 'channel resolver required');
assert(remindSrc.includes('openWhatsAppSmart'), 'reminders re-export smart WhatsApp open');
assert(uiSrc.includes('openWhatsAppSmart'), 'UI must use smart WhatsApp open');
assert(uiSrc.includes('useMilkHisabOffline'), 'UI must use Route Hisab offline hook');
assert(uiSrc.includes('MilkHisabOfflineBanner'), 'UI must show offline banner');
assert(uiSrc.includes('Save offline') || uiSrc.includes('queueDaySave'), 'UI must queue offline saves');

assert(
  isMilkHisabOfflineEnabled({
    category: 'milk-shop',
    planTier: 'professional',
    settings: {},
  }) === true,
  'milk-shop professional offline default on'
);
assert(
  isMilkHisabOfflineEnabled({
    category: 'milk-shop',
    planTier: 'professional',
    settings: { milkHisab: { offlineEnabled: false } },
  }) === false,
  'owner can disable milk hisab offline'
);
assert(
  isMilkHisabOfflineEnabled({ category: 'supermarket', planTier: 'professional', settings: {} }) ===
    false,
  'supermarket must not get milk hisab offline'
);
assert(
  milkHisabDaySnapshotKey('b1', '2026-07-01') === 'b1::2026-07-01',
  'day snapshot key'
);
assert(
  milkHisabBusinessDateKey('b1', '2026-07-01') === 'b1::2026-07-01',
  'business date key'
);

const offlineBanner = resolve(root, 'components/milk/MilkHisabOfflineBanner.jsx');
assert(existsSync(offlineBanner), 'MilkHisabOfflineBanner.jsx must exist');
assert(existsSync(resolve(root, 'lib/hooks/useMilkHisabOffline.js')), 'useMilkHisabOffline hook');
assert(existsSync(resolve(root, 'lib/utils/milkHisabOfflineQueue.js')), 'offline queue util');
assert(existsSync(resolve(root, 'lib/utils/milkHisabOfflineCache.js')), 'offline cache util');
assert(isMilkHisabNetworkFailure(new Error('Failed to fetch')) === true, 'detect fetch failure');
assert(isMilkHisabNetworkFailure(null, 'Permission denied') === false, 'ignore auth errors');

{
  const web =
    'https://wa.me/923077367967?text=' + encodeURIComponent('Assalamualaikum test');
  const parsed = parseWhatsAppWebUrl(web);
  assert(parsed?.phone === '923077367967', 'parse wa.me phone');
  assert(parsed?.text.startsWith('Assalamualaikum'), 'parse wa.me text');
  const app = buildWhatsAppAppUrl('923077367967', 'Hello');
  assert(app === 'whatsapp://send?phone=923077367967&text=Hello', `app url got ${app}`);
  const fromWeb = toWhatsAppAppUrlFromWeb(web);
  assert(String(fromWeb).startsWith('whatsapp://send?phone=923077367967'), 'web→app deep link');
}

const thermalFile = resolve(root, 'lib/print/milkHisabThermalBill.js');
assert(existsSync(thermalFile), 'milkHisabThermalBill.js must exist');
const thermalSrc = readFileSync(thermalFile, 'utf8');
assert(thermalSrc.includes("paperSize: '58mm'"), 'thermal helper defaults to 58mm');
assert(thermalSrc.includes('dispatchThermalReceipt'), 'thermal helper reuses POS receipt path');
assert(thermalSrc.includes('buildMilkHisabThermalOptsFromRow'), 'thermal helper supports per-customer draft print');
assert(thermalSrc.includes('printMilkHisabThermalBillFromRow'), 'thermal helper exports row print');
assert(thermalSrc.includes('printMilkHisabDayBreakdownBill'), 'thermal helper exports day sheet print');
assert(thermalSrc.includes('buildMilkHisabDayBreakdownHtml'), 'thermal helper builds day sheet HTML');
assert(thermalSrc.includes('billLocale'), 'thermal day sheet supports billLocale');
assert(thermalSrc.includes('Noto Naskh Arabic') || thermalSrc.includes('Noto+Naskh'), 'Urdu HTML loads Naskh');

const urduFile = resolve(root, 'lib/storefront/milkHisabUrdu.js');
assert(existsSync(urduFile), 'milkHisabUrdu.js must exist');
assert(normalizeMilkHisabBillLocale('ur') === 'ur', 'ur locale normalize');
assert(normalizeMilkHisabBillLocale('en') === 'en', 'en locale normalize');
assert(getMilkHisabDaySheetCopy('ur', 'month').total.includes('کل'), 'Urdu total label');
assert(getMilkHisabDaySheetCopy('ur', 'week').daySection.includes('Y/N'), 'Urdu day section');
assert(milkHisabUrduProductLabel({ name: 'Fresh Milk' }) === 'دودھ', 'Milk → دودھ');
assert(milkHisabUrduProductLabel({ name: 'Dahi Cup' }) === 'دہی', 'Dahi → دہی');
assert(milkHisabUrduProductLabel({ name: 'Sweet Lassi' }) === 'لسی', 'Lassi → لسی');
assert(
  localizeMilkHisabPeriodLabel('July 2026', 'ur', 'month').includes('جولائی'),
  'July localizes to جولائی'
);
assert(formatMilkHisabPkDate('2026-07-20') === '20-07-2026', 'PK date DD-MM-YYYY');
{
  const weekParts = localizeMilkHisabPeriodParts(
    'Week 30 (2026-07-20 to 2026-07-26)',
    'ur',
    'week',
    { startIso: '2026-07-20', endIso: '2026-07-26' }
  );
  assert(weekParts.title === 'ہفتہ 30', `week title got: ${weekParts.title}`);
  assert(
    weekParts.range === '20-07-2026 تا 26-07-2026',
    `week range must be LTR-safe got: ${weekParts.range}`
  );
  assert(!weekParts.range.includes('to '), 'Urdu range must not use English to');
}
assert(
  formatMilkHisabTotalLine({ label: 'دودھ', qty: 7, unit: 'کلو' }, 'ur') === 'دودھ · 7 کلو',
  'Urdu total line readable'
);
assert(
  formatMilkHisabTotalLine({ label: 'Milk', qty: 7, unit: 'kg' }, 'en') === 'Milk 7 kg',
  'EN total line readable'
);
{
  const sorted = sortMilkHisabPrintColumns([
    { name: 'Eggs', shortLabel: 'Egg' },
    { name: 'Fresh Milk', shortLabel: 'Milk' },
    { name: 'Dahi', shortLabel: 'Dahi' },
  ]);
  assert(sorted[0].shortLabel === 'Milk', 'print columns milk-first');
  assert(sorted[1].shortLabel === 'Dahi', 'print columns dahi second');
}
assert(thermalSrc.includes('periodRange'), 'day sheet separates period range for RTL safety');
assert(thermalSrc.includes('formatMilkHisabTotalLine'), 'day sheet uses readable total lines');
assert(abbreviateMilkHisabColumn('Milk') === 'Mil', 'Milk abbreviates to 3 letters');
assert(isMilkHisabWalkInCustomer('Walk-in') === true, 'walk-in detector');

{
  const grid = buildMilkHisabDayBreakdownGrid({
    startIso: '2026-07-01',
    endIso: '2026-07-03',
    columns: [
      { id: 'p-milk', name: 'Fresh Milk', hisabShortLabel: 'Milk', unit: 'kg' },
      { id: 'p-dahi', name: 'Dahi', hisabShortLabel: 'Dahi', unit: 'kg' },
      { id: 'p-lassi', name: 'Lassi', hisabShortLabel: 'Lassi', unit: 'pcs' },
    ],
    stops: [
      {
        delivery_date: '2026-07-01',
        lines: [
          { product_id: 'p-milk', quantity: 2 },
          { product_id: 'p-dahi', quantity: 1 },
        ],
      },
      {
        delivery_date: '2026-07-02',
        lines: [{ product_id: 'p-dahi', quantity: 1 }],
      },
    ],
  });
  assert(grid.days.length === 3, 'day grid fills full calendar span');
  assert(grid.days[0].marks['p-milk'] === 'Y', 'day 1 milk delivered');
  assert(grid.days[0].marks['p-lassi'] === 'N', 'day 1 lassi not delivered');
  assert(grid.days[1].marks['p-milk'] === 'N', 'day 2 milk missing');
  assert(grid.days[1].marks['p-dahi'] === 'Y', 'day 2 dahi delivered');
  assert(grid.days[2].hasDelivery === false, 'day 3 empty');
  const line = formatMilkHisabDayLine(grid.days[0], grid.columns);
  assert(/01 /.test(line) && /Y/.test(line) && /N/.test(line), `day line format got: ${line}`);
  assert(line.includes(' '), 'day line keeps spaces for 58mm readability');
}

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
assert(sidebar.includes('isMilkShopHubNavAllowed'), 'Sidebar must hide milk-irrelevant nav');
assert(sidebar.includes('mergeMilkShopLeanNavSettings'), 'Sidebar must apply milk lean packaging');

const mobile = readFileSync(resolve(root, 'lib/hooks/useHubMobileNav.js'), 'utf8');
assert(mobile.includes("key: 'route-hisab'"), 'mobile nav must include route-hisab');
assert(mobile.includes('isMilkShopHubNavAllowed'), 'mobile nav must hide milk-irrelevant items');

assert(resolveDomainKey('milk') === 'milk-shop', 'milk alias still resolves');

{
  assert(!isMilkShopHubNavAllowed('loyalty', 'milk-shop'), 'milk hides loyalty');
  assert(!isMilkShopHubNavAllowed('payroll', 'milk-shop'), 'milk hides payroll');
  assert(!isMilkShopHubNavAllowed('campaigns', 'doodh-shop'), 'milk alias hides campaigns');
  assert(!isMilkShopHubNavAllowed('restaurant', 'milk-shop'), 'milk hides restaurant');
  assert(isMilkShopHubNavAllowed('route-hisab', 'milk-shop'), 'milk keeps route-hisab');
  assert(isMilkShopHubNavAllowed('pos', 'milk-shop'), 'milk keeps pos');
  assert(isMilkShopHubNavAllowed('loyalty', 'supermarket'), 'supermarket still allows loyalty nav key');
  assert(MILK_SHOP_HIDDEN_NAV_KEYS.includes('loyalty'), 'hidden list includes loyalty');

  const strip = getMilkShopLeanFeatureStrip();
  assert(strip.loyalty_programs === false, 'lean strip disables loyalty');
  assert(strip.restaurant_pos === false, 'lean strip disables restaurant');
  assert(strip.payroll === false, 'lean strip disables payroll');
  assert(strip.multi_warehouse === false, 'lean strip disables multi warehouse');

  const regStrip = getRegistrationVerticalFeatureOverrides('milk-shop');
  assert(regStrip.loyalty_programs === false, 'registration applies milk lean strip');
  assert(
    Object.keys(getRegistrationVerticalFeatureOverrides('supermarket') || {}).length === 0,
    'supermarket gets no auto strip'
  );

  const leanSettings = mergeMilkShopLeanNavSettings({}, 'milk-shop');
  assert(
    planHasFeatureWithPackaging('enterprise', 'loyalty_programs', leanSettings) === false,
    'enterprise milk lean locks loyalty'
  );
  assert(planHasFeatureWithPackaging('enterprise', 'pos', leanSettings) === true, 'enterprise milk keeps POS');
  assert(
    planHasFeatureWithPackaging('professional', 'batch_tracking', leanSettings) === true,
    'professional milk keeps FEFO batches'
  );

  const loyaltyAccess = getNavItemAccess('loyalty', 'owner', 'enterprise', leanSettings);
  assert(loyaltyAccess.locked === true || loyaltyAccess.visible === false, 'loyalty not usable on milk enterprise');

  for (const key of MILK_SHOP_PLAN_NAV_MATRIX.professional.lockedOrHidden) {
    if (key === 'batches') continue;
    assert(!isMilkShopHubNavAllowed(key, 'milk-shop'), `pro matrix hide ${key}`);
  }
  assert(MILK_SHOP_PLAN_NAV_MATRIX.starter.visible.includes('route-hisab'), 'starter matrix includes route-hisab');
  assert(MILK_SHOP_PLAN_NAV_MATRIX.professional.visible.includes('batches'), 'pro matrix includes batches');
}

if (errors.length) {
  console.error('verify-milk-shop-hisab FAILED:');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log('verify-milk-shop-hisab OK');
