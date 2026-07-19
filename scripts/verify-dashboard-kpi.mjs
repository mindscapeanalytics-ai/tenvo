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

{
  const catStart = salesInsights.indexOf('export const SALES_KPI_CATEGORY_PERIOD_SQL');
  const catEnd = salesInsights.indexOf('export const RECENT_SALES_ACTIVITY_SQL');
  const catBlock = salesInsights.slice(catStart, catEnd > catStart ? catEnd : undefined);
  if (!catBlock.includes('i.id::text') || !catBlock.includes('o.id::text') || !catBlock.includes('ro.id::text')) {
    mark('SALES_KPI_CATEGORY_PERIOD_SQL must cast ledger ids to text (storefront int vs uuid UNION)');
  } else {
    ok('Category KPI UNION casts mixed id types to text');
  }
  if (!catBlock.includes('restaurant_orders')) {
    mark('SALES_KPI_CATEGORY_PERIOD_SQL must include restaurant_orders');
  } else {
    ok('Category KPI includes restaurant channel');
  }
}

if (!salesInsights.includes("($5::text = 'all' OR $5::text = 'restaurant')")) {
  mark('Top moving / recent / customers SQL must support restaurant channel');
} else {
  ok('Restaurant channel wired into top/recent/customer sales SQL');
}

const sseRoute = read('app/api/notifications/sse/route.js');
const notifHook = read('lib/hooks/useNotifications.js');
if (!sseRoute.includes('X-Accel-Buffering') || !sseRoute.includes('cancel()')) {
  mark('Notifications SSE must set X-Accel-Buffering and stream cancel cleanup');
} else {
  ok('Notifications SSE hardened against proxy idle resets');
}
if (!notifHook.includes('POLL_MS') || !notifHook.includes('MAX_SSE_FAILURES')) {
  mark('useNotifications must poll REST as baseline and stop SSE after hard failures');
} else {
  ok('Notifications client falls back to REST poll when SSE resets');
}

{
  const growthStart = salesInsights.indexOf('export const REVENUE_GROWTH_UNIFIED_SQL');
  const growthEnd = salesInsights.indexOf('export const SALES_COGS_PERIOD_SQL');
  const growthBlock = salesInsights.slice(growthStart, growthEnd > growthStart ? growthEnd : undefined);
  if (!growthBlock.includes('restaurant_orders')) {
    mark('REVENUE_GROWTH_UNIFIED_SQL must include restaurant_orders');
  } else {
    ok('Revenue growth SQL includes restaurant channel');
  }
}

const analyticsAction = read('lib/actions/premium/ai/analytics.js');
if (!analyticsAction.includes('Promise.all([') || !analyticsAction.includes('SALES_RETENTION_PERIOD_SQL')) {
  mark('getAnalyticsBundleAction must Promise.all queries and use period retention SQL');
} else {
  ok('Analytics bundle parallelized with multi-channel retention');
}

const aiInsights = read('components/intelligence/AIInsightsPanel.jsx');
if (!aiInsights.includes('hubAnalyticsQueryKey') || !aiInsights.includes('sameTenantPlaceholderData')) {
  mark('AIInsightsPanel must reuse hubAnalytics React Query cache');
} else {
  ok('AI Insights paints from shared hubAnalytics cache');
}

const settingsMgr = read('components/SettingsManager.jsx');
const dashTabs = read('app/business/[category]/components/DashboardTabs.jsx');
if (!settingsMgr.includes('shouldForceMountSection') || !settingsMgr.includes('startTransition')) {
  mark('SettingsManager must visit-forceMount sections and soft-sync URL');
} else {
  ok('Settings section switching uses keep-alive + soft URL sync');
}
if (!dashTabs.includes("'settings'") || !dashTabs.includes("forceMount={shouldForceMount('settings')}")) {
  mark('DashboardTabs must keep-alive the settings hub tab');
} else {
  ok('Hub Settings tab stay-mounted after first visit');
}

{
  const keepAliveStart = dashTabs.indexOf('const KEEP_ALIVE_TABS');
  const keepAliveEnd = dashTabs.indexOf(']);', keepAliveStart) + 3;
  const keepAliveBlock = dashTabs.slice(keepAliveStart, keepAliveEnd);
  for (const tab of ['store-settings', 'pos', 'orders', 'campaigns', 'memberships', 'payments', 'audit']) {
    if (!keepAliveBlock.includes(`'${tab}'`)) {
      mark(`KEEP_ALIVE_TABS must include ${tab}`);
    }
  }
  if (!dashTabs.includes("forceMount={shouldForceMount('pos')}") || !dashTabs.includes("forceMount={shouldForceMount('orders')}")) {
    mark('POS and Orders TabsContent must use visit forceMount');
  } else {
    ok('High-traffic hub tabs use keep-alive forceMount');
  }
  if (!dashTabs.includes('shouldShowReportsView') || !dashTabs.includes("shouldShowReportsView('ai')")) {
    mark('Reports sub-views must stay mounted after first visit (CSS hide)');
  } else {
    ok('Reports Analytics/Forecast/AI/Builder keep-alive');
  }
}

const hubNav = read('lib/utils/hubTabNavigation.js');
if (!hubNav.includes("'store-settings'") || !hubNav.includes("'pos'")) {
  mark('Idle hub prefetch must warm POS and store-settings chunks');
} else {
  ok('Idle prefetch covers POS + store-settings');
}

const dashKpis = read('lib/actions/basic/dashboard.js');
if (dashKpis.includes('totalRevenue - totalPurchases') && !dashKpis.includes('cogsTotal')) {
  mark('getDashboardKPIs grossProfit must use sold COGS, not purchases');
} else if (!dashKpis.includes('SALES_COGS_PERIOD_SQL') || !dashKpis.includes('cogsTotal')) {
  mark('getDashboardKPIs must compute grossProfit from SALES_COGS_PERIOD_SQL');
} else {
  ok('Overview grossProfit uses revenue − COGS');
}

if (!settingsMgr.includes('history.replaceState')) {
  mark('Settings section URL sync must use history.replaceState (no soft-nav)');
} else {
  ok('Settings section URL uses shallow history.replaceState');
}

if (failed) {
  console.error('\nverify-dashboard-kpi: FAILED');
  process.exit(1);
}
console.log('\nverify-dashboard-kpi: PASSED');
