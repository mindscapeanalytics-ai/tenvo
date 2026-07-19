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
const salesManager = read('components/SalesManager.jsx');
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
