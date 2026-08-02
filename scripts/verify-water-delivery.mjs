/**
 * Verify water-delivery domain wiring: knowledge, aliases, hisab gates, package, areas.
 */
import assert from 'node:assert/strict';
import { resolveDomainKey } from '../lib/config/domainKeyAliases.js';
import { getDomainConfig } from '../lib/config/domains.js';
import { getDomainKnowledge } from '../lib/domainKnowledge.js';
import { getDomainPackage } from '../lib/config/domainPackages.js';
import {
  isWaterHisabRelevant,
  isRouteHisabRelevant,
  readWaterCustomerPrefs,
  isWaterCustomerDueOnDate,
  computeWaterBottleBalance,
  computeWaterSaleAmount,
} from '../lib/storefront/waterShopHisab.js';
import { isMilkHisabRelevant } from '../lib/storefront/milkShopHisab.js';
import {
  getDeliveryAreasForCity,
  waterDeliveryCadenceCoversDate,
  WATER_DELIVERY_CITIES,
  resolvePostalCodeForArea,
  getDeliveryAreaRecordsForCity,
} from '../lib/data/pakistanDeliveryAreas.js';
import { getBrandsForMarket } from '../lib/regionalMarket/index.js';
import { hasRichCatalog } from '../lib/dataLab/richProductCatalog.js';
import { WATER_SHOP_SEED_PRODUCTS, WATER_SHOP_SEED_PRODUCT_COUNT } from '../lib/dataLab/waterShopDemoCatalog.js';
import { isWaterShopStore, WATER_SHOP_HOW_IT_WORKS } from '../lib/storefront/waterShopStorefront.js';
import { resolveStorefrontVertical } from '../lib/config/storefrontDomains.js';
import { ALL_DEMO_SEEDS } from '../lib/dataLab/domains.mjs';
import { FEATURED_DEMO_STORES } from '../lib/marketing/demoStores.js';
import { shouldSeedRichCatalogOnRegistration } from '../lib/onboarding/registrationRichVerticals.js';

const knowledge = getDomainKnowledge('water-delivery', { countryIso: 'PK' });
assert.ok(knowledge?.fieldConfig?.deliveryarea, 'deliveryarea field');
assert.ok(knowledge?.fieldConfig?.postalcode, 'postalcode field');
assert.ok(knowledge?.fieldConfig?.deliverydays, 'deliverydays field');
assert.ok(knowledge?.fieldConfig?.towncode?.label?.includes('Header No'), 'Header No / Town Code field label (NEW.EXE)');
assert.ok(knowledge?.fieldConfig?.accountno?.label?.includes('Party Account No'), 'Party Account No field label (NEW.EXE)');
assert.ok(knowledge?.fieldConfig?.proprietorname?.label?.includes('Proprietor Name'), 'Proprietor Name field label (NEW.EXE)');
assert.ok(knowledge?.fieldConfig?.dayoffollow?.label?.includes('Day of Follow'), 'Day of Follow field label (NEW.EXE)');
assert.ok(knowledge?.fieldConfig?.productrate?.label?.includes('Product Rate'), 'Product Rate field label (NEW.EXE)');
assert.ok(knowledge?.customerFields?.length >= 5, 'customer fields');
assert.equal(knowledge.intelligence?.perishability, 'low');
assert.equal(knowledge.intelligence?.bottleCycleFormula, 'BAL = prev + DEL - REC');
assert.ok(knowledge.intelligence?.emptyBottleAssetRisk === 'high');

assert.ok(hasRichCatalog('water-delivery'), 'rich catalog registered');
assert.ok(WATER_SHOP_SEED_PRODUCT_COUNT >= 15, `seed products, got ${WATER_SHOP_SEED_PRODUCT_COUNT}`);
assert.equal(WATER_SHOP_SEED_PRODUCTS.length, WATER_SHOP_SEED_PRODUCT_COUNT);
assert.equal(isWaterShopStore('water-delivery'), true);
assert.equal(isWaterShopStore('bottled-water'), true);
assert.equal(resolveStorefrontVertical('water-delivery'), 'supermarket');
assert.ok(WATER_SHOP_HOW_IT_WORKS.length === 4, 'how-it-works steps');
assert.ok(ALL_DEMO_SEEDS.some((s) => s.domain === 'demo-water'), 'demo-water in ALL_DEMO_SEEDS');
assert.ok(FEATURED_DEMO_STORES.some((s) => s.domain === 'demo-water'), 'demo-water featured');
assert.equal(shouldSeedRichCatalogOnRegistration('water-delivery', 'PK'), true);
assert.equal(shouldSeedRichCatalogOnRegistration('water-delivery', 'AE', { domainPackageKey: 'water-commerce' }), true);

assert.equal(computeWaterBottleBalance({ previous: 0, delivered: 5, received: 5 }), 0);
assert.equal(computeWaterBottleBalance({ previous: 2, delivered: 5, received: 3 }), 4);
assert.equal(computeWaterSaleAmount({ qty: 5, accountRate: 150 }), 750);
assert.equal(computeWaterSaleAmount({ qty: 5, unitPrice: 100, accountRate: 150, discount: 50 }), 700);

assert.equal(resolveDomainKey('bottled-water'), 'water-delivery');
assert.equal(resolveDomainKey('water-supply'), 'water-delivery');
assert.equal(resolveDomainKey('aqua-delivery'), 'water-delivery');

const cfg = getDomainConfig('water-delivery');
assert.ok(cfg?.required_modules?.includes('pos'), 'POS required');
assert.ok(cfg?.label_overrides?.invoice, 'invoice label');

assert.equal(isWaterHisabRelevant('water-delivery'), true);
assert.equal(isWaterHisabRelevant('milk-shop'), false);
assert.equal(isMilkHisabRelevant('water-delivery'), false);
assert.equal(isRouteHisabRelevant('water-delivery'), true);
assert.equal(isRouteHisabRelevant('milk-shop'), true);

const pkg = getDomainPackage('water-commerce');
assert.ok(pkg, 'water-commerce package');
assert.deepEqual(pkg.verticals, ['water-delivery']);

assert.ok(WATER_DELIVERY_CITIES.includes('Karachi'));
assert.ok(WATER_DELIVERY_CITIES.includes('Hyderabad'));
assert.ok(WATER_DELIVERY_CITIES.includes('Lahore'));
assert.ok(getDeliveryAreasForCity('Karachi').includes('DHA Phase 6'));
assert.ok(getDeliveryAreasForCity('Karachi').some((n) => /Bahria Town Karachi/i.test(n)));
assert.ok(getDeliveryAreasForCity('Karachi').some((n) => /BTK Precinct 11A/i.test(n)), 'BTK Precinct 11A in Karachi');
assert.ok(getDeliveryAreasForCity('Karachi').some((n) => /BTK Precinct 10A/i.test(n)), 'BTK Precinct 10A in Karachi');
assert.ok(getDeliveryAreasForCity('Karachi').some((n) => /BTK Bahria Icon Tower/i.test(n)), 'BTK Bahria Icon Tower in Karachi');
assert.ok(getDeliveryAreasForCity('Karachi').some((n) => /Usmania Town|Osmania Town/i.test(n)), 'Usmania/Osmania Town in Karachi');
assert.ok(getDeliveryAreasForCity('Karachi').some((n) => /Gadap/i.test(n)), 'Gadap in Karachi');
assert.ok(getDeliveryAreasForCity('Karachi').some((n) => /Kathore/i.test(n)), 'Kathore in Karachi');
assert.ok(getDeliveryAreasForCity('Karachi').some((n) => /DHA City Karachi/i.test(n)), 'DHA City Karachi');
assert.ok(getDeliveryAreasForCity('Lahore').some((n) => /Bahria Town Sector C/i.test(n)), 'Bahria Town Sector C in Lahore');
assert.ok(getDeliveryAreasForCity('Lahore').length > 30, 'Lahore area count');
assert.ok(getDeliveryAreasForCity('Hyderabad').includes('Latifabad'));

assert.equal(resolvePostalCodeForArea('Karachi', 'DHA Phase 6'), '75500');
assert.equal(resolvePostalCodeForArea('Karachi', 'Clifton'), '75600');
assert.equal(resolvePostalCodeForArea('Karachi', 'Bahria Town Karachi'), '75340');
assert.equal(resolvePostalCodeForArea('Karachi', 'Usmania Town / Osmania Town'), '75340');
assert.equal(resolvePostalCodeForArea('Karachi', 'Gadap Town / Gadap City'), '75330');
assert.equal(resolvePostalCodeForArea('Karachi', 'BTK Precinct 11A (Bahria Homes)'), '75340');
assert.equal(resolvePostalCodeForArea('Karachi', 'BTK Bahria Icon Tower'), '75340');
assert.equal(resolvePostalCodeForArea('Karachi', 'Gulshan-e-Iqbal Block 5'), '75300');
assert.equal(resolvePostalCodeForArea('Hyderabad', 'Latifabad'), '71800');
assert.equal(resolvePostalCodeForArea('Hyderabad', 'Qasimabad'), '71100');
assert.equal(resolvePostalCodeForArea('Lahore', 'Johar Town Block H'), '54782');
assert.equal(resolvePostalCodeForArea('Lahore', 'Bahria Town Sector C (Jasmine Block)'), '53720');
assert.equal(resolvePostalCodeForArea('Islamabad', 'F-7'), '44210');

const khi = getDeliveryAreaRecordsForCity('Karachi');
assert.ok(khi.length >= 60, `Karachi should seed many areas, got ${khi.length}`);
assert.ok(khi.every((r) => r.postalCode && /^\d{5}$/.test(r.postalCode)), 'Karachi postal codes must be 5 digits');

assert.equal(waterDeliveryCadenceCoversDate('Daily', new Date('2026-07-31T12:00:00')), true);
// 2026-07-31 is Friday
assert.equal(waterDeliveryCadenceCoversDate('Mon Wed Fri', new Date('2026-07-31T12:00:00')), true);
assert.equal(waterDeliveryCadenceCoversDate('Tue Thu Sat', new Date('2026-07-31T12:00:00')), false);

const prefs = readWaterCustomerPrefs({
  domain_data: {
    deliveryactive: 'Yes',
    deliverydays: 'Mon Wed Fri',
    dailybottles: 2,
    city: 'Karachi',
    deliveryarea: 'Clifton',
    postalcode: '75600',
    customertype: 'Home & Flat',
    accountno: '55',
    towncode: '101',
    houseno: 'Villa 303',
    floorflat: '5F 11A',
    productrate: 150,
    bottlebalance: 0,
    dayoffollow: 1,
  },
});
assert.equal(prefs.dailyBottles, 2);
assert.equal(prefs.customerType, 'Home & Flat');
assert.equal(prefs.postalCode, '75600');
assert.equal(prefs.accountNo, '55');
assert.equal(prefs.townCode, '101');
assert.equal(prefs.floorFlat, '5F 11A');
assert.equal(prefs.productRate, 150);
assert.equal(prefs.bottleBalance, 0);
assert.equal(isWaterCustomerDueOnDate(prefs, new Date('2026-07-31T12:00:00')), true);

const monthlyPrefs = readWaterCustomerPrefs({
  domain_data: {
    deliveryactive: 'Yes',
    deliverydays: 'Custom',
    dayoffollow: 1,
  },
});
assert.equal(isWaterCustomerDueOnDate(monthlyPrefs, new Date('2026-08-01T12:00:00')), true);
assert.equal(isWaterCustomerDueOnDate(monthlyPrefs, new Date('2026-08-02T12:00:00')), false);

const brands = getBrandsForMarket('PK', 'water-delivery');
assert.ok(Array.isArray(brands) && brands.length > 0, 'PK water brands');
assert.ok(brands.some((b) => /Pure Life|Aquafina|Nestlé/i.test(String(b))), 'known water brand');
assert.ok(brands.some((b) => /Quice|Kinza|Culligan|Gourmet/i.test(String(b))), 'PK plant / local water brand');

assert.equal(knowledge.intelligence?.opsModel, 'plant_to_rider_home_flat');
assert.equal(knowledge.intelligence?.market, 'pakistan_bottled_water');
assert.ok(Array.isArray(knowledge.intelligence?.primaryCities) && knowledge.intelligence.primaryCities.includes('Karachi'));
assert.ok(Array.isArray(knowledge.intelligence?.heatWaveMonths) && knowledge.intelligence.heatWaveMonths.includes('June'));
assert.ok(knowledge.intelligence?.typical19LRefillRatePkr?.common >= 100);
assert.ok(knowledge.intelligence?.typical19LDepositPkr?.common >= 300);
assert.ok(knowledge.pakistaniFeatures?.taxCompliance?.includes('psqca'));
assert.ok(knowledge.pakistaniFeatures?.psqcaLicense === true);
assert.ok(knowledge.pakistaniFeatures?.deliveryAreasWithPostal === true);

const { existsSync } = await import('node:fs');
const { resolve } = await import('node:path');
const thermalFile = resolve(process.cwd(), 'lib/print/waterHisabThermalBill.js');
assert.ok(existsSync(thermalFile), 'waterHisabThermalBill.js must exist');

// Easy Mode + ops intelligence depth
const {
  resolveEasyDomainProfile,
  buildVerticalInsightCards,
  getDomainKpiLabels,
  getDomainTabGuidance,
} = await import('../lib/dashboard/easyDomainIntelligence.js');
const easyProfile = resolveEasyDomainProfile('water-delivery', knowledge, { country: 'Pakistan' });
assert.equal(easyProfile.playbook?.actionTab, 'route-hisab');
const waterCards = buildVerticalInsightCards(easyProfile, {});
assert.ok(waterCards.some((c) => /Daily Route/i.test(c.title)), 'Easy insight: Daily Route');
assert.ok(waterCards.some((c) => /deposit|Bottle/i.test(c.title)), 'Easy insight: bottles/deposits');
const waterKpis = getDomainKpiLabels(easyProfile);
assert.match(waterKpis.unitsSold, /Bottle/i);
assert.match(waterKpis.stockTabTitle, /Refill|deposit/i);
assert.match(getDomainTabGuidance(easyProfile, 'operations'), /DEL|REC|BAL|Daily Route/i);

const {
  resolveOperationsProfile,
  getOperationsTabGuidance,
  buildOperationsKpiTiles,
} = await import('../lib/dashboard/domainOperationsIntelligence.js');
const opsProfile = resolveOperationsProfile('water-delivery', knowledge, {
  country: 'Pakistan',
  currency: 'PKR',
});
assert.equal(opsProfile.tabLabel, 'Water ops');
assert.equal(opsProfile.showWaterRoute, true);
assert.match(String(opsProfile.regionalHint || ''), /PSQCA|deposit/i);
assert.match(getOperationsTabGuidance(opsProfile), /Daily Route|town code|BAL/i);
const opsTiles = buildOperationsKpiTiles(opsProfile, { activeBuyers: 12, collections: { total: 5000 }, storefront: {}, contacts: {} }, {
  formatCurrency: (n) => `Rs ${n}`,
});
assert.ok(opsTiles.some((t) => t.id === 'water_daily_route'), 'ops KPI Daily Route tile');

const { getExpenseCategoriesForDomain } = await import('../lib/utils/expenseCategories.js');
const waterExpenses = getExpenseCategoriesForDomain('water-delivery');
assert.ok(waterExpenses.some((c) => c.value === 'supplier_water'), 'water plant expense');
assert.ok(waterExpenses.some((c) => c.value === 'bottle_deposit_float'), 'deposit float expense');
assert.ok(waterExpenses.some((c) => c.value === 'route_fuel'), 'rider fuel expense');

const { buildRetailSimpleActions } = await import('../lib/dashboard/retailSimpleActions.js');
const simpleActions = buildRetailSimpleActions({
  category: 'water-delivery',
  canNav: () => ({ visible: true, locked: false }),
  planCan: () => true,
});
assert.equal(simpleActions[0]?.id, 'route-hisab');
assert.match(String(simpleActions[0]?.label || ''), /Water Route/i);

const {
  buildWaterDailySalePrintModel,
  formatWaterDailyLineHeader,
  formatWaterDailyProductLine,
  buildWaterPeriodPrintModel,
} = await import('../lib/print/waterHisabThermalBill.js');

const dailyModel = buildWaterDailySalePrintModel({
  business: { business_name: 'Zara Spring', category: 'water-delivery', currency: 'PKR' },
  deliveryDate: '2026-08-01',
  products: [{ id: 'p1', name: '19L Mineral Water', price: 150, unit: 'bottle' }],
  row: {
    customerName: 'Villa Customer',
    accountNo: '55',
    townCode: '101',
    houseNo: 'Villa 303',
    floorFlat: '5F 11A',
    productRate: 150,
    prevBottle: 0,
    qtyByProduct: { p1: 5 },
    recByProduct: { p1: 5 },
    cashCollected: 0,
    specialDiscount: 0,
  },
});
assert.equal(dailyModel.grandTotal, 750);
assert.equal(dailyModel.delTotal, 5);
assert.equal(dailyModel.recTotal, 5);
assert.equal(dailyModel.bottleBalance, 0);
assert.equal(dailyModel.documentLabel, 'Daily Sale Summary');
assert.ok(formatWaterDailyLineHeader().includes('DEL'));
assert.ok(formatWaterDailyProductLine(dailyModel.lines[0]).includes('5'));

const periodModel = buildWaterPeriodPrintModel({
  business: { business_name: 'Zara Spring', category: 'water-delivery', currency: 'PKR' },
  period: '2026-08',
  periodLabel: 'August 2026',
  customerName: 'Villa Customer',
  houseNo: '303',
  accountNo: '55',
  grandTotal: 750,
  breakdown: {
    columns: [{ id: 'p1', abbrev: '19L', shortLabel: '19L' }],
    days: [{ dayNum: 1, marks: { p1: 'Y' }, qtys: { p1: 5 }, hasDelivery: true }],
    activeDays: 1,
    totalsByProduct: [{ id: 'p1', name: '19L', shortLabel: '19L', qty: 5, unit: 'bottle' }],
  },
  productMeta: { p1: { name: '19L', unit: 'bottle', unitPrice: 150 } },
});
assert.equal(periodModel.documentLabel, 'Monthly Water Bill');
assert.ok(String(periodModel.accountNo) === '55');

// ---------- Rider shift + bottle float intelligence ----------
assert.ok(knowledge.intelligence?.riderShiftTracking === true, 'riderShiftTracking intelligence flag');
assert.ok(knowledge.intelligence?.bottleAssetControl === true, 'bottleAssetControl intelligence flag');
assert.ok(Array.isArray(knowledge.intelligence?.riderShiftHints) && knowledge.intelligence.riderShiftHints.length >= 3, 'rider shift hints');
assert.ok(Array.isArray(knowledge.intelligence?.bottleFloatHints) && knowledge.intelligence.bottleFloatHints.length >= 3, 'bottle float hints');
assert.ok(knowledge.intelligence?.revenuePerBottleTarget?.common >= 100, 'revenue per bottle target');
assert.ok(knowledge.intelligence?.costPerBottleEstimate?.raw_water > 0, 'cost per bottle estimate');
assert.ok(knowledge.intelligence?.marginHealthThreshold > 0, 'margin health threshold');

// Rider shift + bottle float helpers in waterShopHisab
const {
  computeWaterRiderShiftReconciliation,
  resolveWaterBottleFloatSummary,
  findIdleBottleCustomers,
} = await import('../lib/storefront/waterShopHisab.js');

const recon = computeWaterRiderShiftReconciliation({
  loadedBottles: 50,
  returnedFull: 10,
  returnedEmpty: 35,
  cashCollected: 4500,
  defaultUnitPrice: 150,
});
assert.equal(recon.deliveredBottles, 40, 'delivered bottles = loaded - returned full');
assert.equal(recon.expectedCash, 6000, 'expected cash = delivered * rate');
assert.equal(recon.cashShortage, 1500, 'cash shortage = expected - cash');
assert.equal(recon.emptyShortage, 5, 'empty shortage = delivered - returned empty');

const floatSummary = resolveWaterBottleFloatSummary({
  plantFull: 200,
  plantEmpty: 50,
  customerBalances: [3, 2, 0],
  damagedCount: 5,
  bottleUnitCost: 1200,
});
assert.equal(floatSummary.withCustomers, 5, 'bottles with customers');
assert.equal(floatSummary.totalFloatBottles, 260, 'total float bottles = full + empty + customers + damaged');
assert.equal(floatSummary.totalAssetValue, 312000, 'total asset value');

const idle = findIdleBottleCustomers([
  { id: '1', name: 'A', domain_data: { bottlebalance: 3, houseno: 'Villa 101' } },
  { id: '2', name: 'B', domain_data: { bottlebalance: 1, houseno: 'Villa 102' } },
  { id: '3', name: 'C', domain_data: { bottlebalance: 2, houseno: 'Villa 103' } },
], 2);
assert.equal(idle.length, 2, 'idle customers with 2+ unreturned bottles');
assert.ok(idle.some((c) => c.id === '1'), 'customer A is idle');

// ---------- Enhanced expense categories ----------
assert.ok(waterExpenses.some((c) => c.value === 'rider_commission'), 'rider commission expense');
assert.ok(waterExpenses.some((c) => c.value === 'vehicle_maintenance'), 'vehicle maintenance expense');
assert.ok(waterExpenses.some((c) => c.value === 'filter_replacement'), 'filter replacement expense');
assert.ok(waterExpenses.some((c) => c.value === 'bottle_loss'), 'bottle loss expense');

// ---------- Server actions exist ----------
const waterHisabSrc = (await import('node:fs')).readFileSync('lib/actions/standard/waterHisab.js', 'utf8');
assert.ok(waterHisabSrc.includes('export async function getWaterRiderShiftsAction'), 'getWaterRiderShiftsAction exported');
assert.ok(waterHisabSrc.includes('export async function saveWaterRiderShiftAction'), 'saveWaterRiderShiftAction exported');
assert.ok(waterHisabSrc.includes('export async function getWaterBottleFloatIntelligenceAction'), 'getWaterBottleFloatIntelligenceAction exported');
assert.ok(waterHisabSrc.includes('export async function saveWaterBottleFloatSettingsAction'), 'saveWaterBottleFloatSettingsAction exported');

// ---------- Hub nav ----------
const { isWaterDeliveryHubCategory, isWaterDeliveryHubNavAllowed } = await import('../lib/config/waterDeliveryHubNav.js');
assert.equal(isWaterDeliveryHubCategory('water-delivery'), true);
assert.equal(isWaterDeliveryHubCategory('bottled-water'), true);
assert.equal(isWaterDeliveryHubNavAllowed('restaurant', 'water-delivery'), false, 'restaurant hidden for water');
assert.equal(isWaterDeliveryHubNavAllowed('inventory', 'water-delivery'), true, 'inventory allowed for water');

// ---------- Operations KPI tiles: rider + bottle ----------
const opsTilesWithWaterOps = buildOperationsKpiTiles(opsProfile, {
  activeBuyers: 12,
  collections: { total: 5000 },
  storefront: {},
  contacts: {},
  waterOps: { activeRiders: 3, riderCashShortage: 500, bottlesWithCustomers: 80, idleBottleCustomers: 5 },
}, {
  formatCurrency: (n) => `Rs ${n}`,
});
assert.ok(opsTilesWithWaterOps.some((t) => t.id === 'rider_shift_status'), 'ops tile: rider shift status');
assert.ok(opsTilesWithWaterOps.some((t) => t.id === 'bottle_float'), 'ops tile: bottle float');

console.log('verify-water-delivery: ok');
