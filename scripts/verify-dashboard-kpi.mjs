/**
 * Static wiring checks for dashboard KPI truth paths.
 * Run: node scripts/verify-dashboard-kpi.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

let failed = false;
const mark = (msg) => {
  console.error(`FAIL: ${msg}`);
  failed = true;
};
const ok = (msg) => console.log(`OK: ${msg}`);

const dataContext = read('lib/context/DataContext.js');
const salesPerf = read('lib/actions/basic/dashboard.js');
const salesInsights = read('lib/analytics/salesInsights.js');
const salesFilter = read('lib/analytics/salesPerformanceFilter.js');
const salesManager = read('components/SalesManager.jsx');
const filterBar = read('components/sales/SalesInsightsFilterBar.jsx');
const inventory = read('components/InventoryManager.jsx');
const reportBuilder = read('components/reports/ReportBuilder.jsx');
const storefrontNav = read('lib/config/storefrontMobileNav.js');

if (dataContext.includes('getDashboardMetricsAction(')) {
  mark('DataContext must not call getDashboardMetricsAction (overwrites shell KPIs)');
} else {
  ok('DataContext does not call getDashboardMetricsAction');
}

if (!dataContext.includes('buildDashboardMetricsFromSnapshot')) {
  mark('DataContext must map shell snapshot into dashboardMetrics');
} else {
  ok('Hub shell owns dashboardMetrics');
}

if (salesPerf.includes('* 0.4') || salesManager.includes('* 0.4')) {
  mark('Sales profit must not use 40% margin heuristic');
} else {
  ok('No 40% profit heuristic in sales paths');
}

if (!salesInsights.includes('SALES_COGS_PERIOD_SQL')) {
  mark('salesInsights must export SALES_COGS_PERIOD_SQL');
} else {
  ok('COGS period SQL present');
}

if (!salesPerf.includes('SALES_COGS_PERIOD_SQL') || !salesPerf.includes('profitBasis')) {
  mark('getSalesPerformanceAction must use cost-based COGS / profitBasis');
} else {
  ok('Sales performance uses cost-based gross profit');
}

if (!salesPerf.includes('normalizeSalesPerformanceOptions') || !salesPerf.includes('channel')) {
  mark('getSalesPerformanceAction must accept normalized channel/from/to options');
} else {
  ok('getSalesPerformanceAction accepts channel + date range options');
}

if (!salesPerf.includes('TOP_CUSTOMERS_UNIFIED_SQL') || !salesPerf.includes('topCustomers')) {
  mark('getSalesPerformanceAction must return unified topCustomers');
} else {
  ok('Sales performance returns topCustomers');
}

if (!salesInsights.includes('TOP_CUSTOMERS_UNIFIED_SQL')) {
  mark('salesInsights must export TOP_CUSTOMERS_UNIFIED_SQL');
} else {
  ok('TOP_CUSTOMERS_UNIFIED_SQL present');
}

{
  const trendStart = salesInsights.indexOf('export const SALES_TREND_UNIFIED_SQL');
  const trendEnd = salesInsights.indexOf('export const TOP_MOVING_PRODUCTS_UNIFIED_SQL');
  const trendBlock = salesInsights.slice(trendStart, trendEnd > trendStart ? trendEnd : undefined);
  if (trendBlock.includes('gl_entries')) {
    mark('SALES_TREND_UNIFIED_SQL must not use gl_entries for profit');
  } else {
    ok('Sales trend profit is cost-based (no gl_entries)');
  }
}

if (!salesFilter.includes('normalizeSalesChannel') || !salesFilter.includes('storefront') || !salesFilter.includes('restaurant')) {
  mark('salesPerformanceFilter must normalize channel including storefront/Online/restaurant');
} else {
  ok('salesPerformanceFilter channel contract present');
}

if (!salesManager.includes('useFilters') || !salesManager.includes('SalesInsightsFilterBar')) {
  mark('SalesManager must use hub date range + SalesInsightsFilterBar');
} else {
  ok('SalesManager uses hub filters + filter bar');
}

if (salesManager.includes('clientMetrics') || salesManager.includes('aggregateMonthlyData(invoices')) {
  mark('SalesManager must not paint invoice-only client KPIs before server');
} else {
  ok('SalesManager does not use invoice-only client KPI fallback');
}

if (salesManager.includes("timeframe === 'monthly'") || salesManager.includes('setTimeframe')) {
  mark('SalesManager must remove monthly/quarterly toggle (use hub date range)');
} else {
  ok('SalesManager monthly/quarterly toggle removed');
}

if (!filterBar.includes('SALES_CHANNEL_OPTIONS') || !reportBuilder.includes('SalesInsightsFilterBar')) {
  mark('Filter bar must be shared by SalesManager and ReportBuilder');
} else {
  ok('Shared SalesInsightsFilterBar wired to Sales + Report Builder');
}

if (!reportBuilder.includes('salesChannel') || !reportBuilder.includes('channel:')) {
  mark('ReportBuilder must pass channel/category into analytics bundle');
} else {
  ok('ReportBuilder passes sales channel filters');
}

if (inventory.includes('Generating ${report}') || inventory.includes('Generating ${report}...')) {
  mark('Inventory domain reports must not fake-generate with toasts');
} else {
  ok('Inventory domain reports are honest checklist (no fake generate)');
}

if (inventory.includes('By revenue contribution')) {
  mark('Inventory category chart must not claim revenue when showing stock value');
} else {
  ok('Inventory category labels honest');
}

if (!inventory.includes('Asset Valuation (at cost)') && !inventory.includes('at cost')) {
  mark('Inventory asset valuation should be at cost');
} else {
  ok('Inventory asset valuation at cost');
}

if (reportBuilder.includes("name: 'Profit & Loss Statement'")) {
  mark('ReportBuilder must not label analytics bundle as formal P&L');
} else {
  ok('ReportBuilder P&L preset renamed honestly');
}

if (reportBuilder.includes('\u2014') || reportBuilder.includes(' — ')) {
  mark('ReportBuilder must not use em dashes in titles/copy');
} else {
  ok('ReportBuilder has no em dashes');
}

if (!reportBuilder.includes('buildWidgetTitle') || !reportBuilder.includes('lg:col-span-4')) {
  mark('ReportBuilder must use professional titles and 12-col grid spans');
} else {
  ok('ReportBuilder grid titles + col spans wired');
}

if (reportBuilder.includes('PDF export coming soon')) {
  mark('ReportBuilder PDF must be enabled');
} else if (!reportBuilder.includes('generateAnalyticsReportPDF')) {
  mark('ReportBuilder must call generateAnalyticsReportPDF');
} else if (!fs.existsSync(path.join(root, 'lib/pdf/analyticsReportPdf.js'))) {
  mark('lib/pdf/analyticsReportPdf.js missing');
} else {
  ok('ReportBuilder PDF export wired');
}

if (reportBuilder.includes('[65, 45, 80, 55, 90, 70, 50, 85]')) {
  mark('ReportBuilder must not use fake bar chart heights');
} else {
  ok('ReportBuilder charts use live data');
}

const advanced = read('components/AdvancedAnalytics.jsx');
if (advanced.includes('Pathology') || advanced.includes('Doctors Performance') || advanced.includes('Appointments')) {
  mark('AdvancedAnalytics must not use clinic leftover labels');
} else {
  ok('AdvancedAnalytics labels cleaned');
}

const analyticsActions = read('lib/actions/premium/ai/analytics.js');
if (!analyticsActions.includes('REPORTS_FEATURE_ANY')) {
  mark('Analytics actions must accept advanced_reports OR ai_analytics');
} else {
  ok('Reports feature gate OR-aligned');
}

if (storefrontNav.includes("label: 'Analytics'") && storefrontNav.includes("key: 'sales'")) {
  mark('Storefront sales tile should not be labeled Analytics');
} else {
  ok('Storefront sales nav labeled Sales');
}

if (failed) {
  console.error('\nverify-dashboard-kpi: FAILED');
  process.exit(1);
}
console.log('\nverify-dashboard-kpi: PASSED');
