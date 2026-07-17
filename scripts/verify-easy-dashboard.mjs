/**
 * Static wiring checks for Easy mode dashboard (tabbed one-pager + domain intelligence).
 * Run: node scripts/verify-easy-dashboard.mjs
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

const domainDashboard = read('app/business/[category]/components/tabs/DomainDashboard.tsx');
const easyDashboard = read('components/dashboard/easy/EasyBusinessDashboard.tsx');
const easyIntel = read('lib/dashboard/easyDomainIntelligence.js');
const opsIntel = read('lib/dashboard/domainOperationsIntelligence.js');
const opsSnapshot = read('lib/actions/dashboard/domainOperationsSnapshot.js');
const opsPanel = read('components/dashboard/easy/DomainOperationsPanel.tsx');
const easyHelpers = read('lib/dashboard/easyDashboardHelpers.js');
const industryInsights = read('app/business/[category]/components/islands/IndustryInsights.client.tsx');

if (!domainDashboard.includes('isEasyMode')) {
  mark('DomainDashboard must branch on isEasyMode');
}
if (!domainDashboard.includes('EasyBusinessDashboard')) {
  mark('DomainDashboard must render EasyBusinessDashboard in easy mode');
}
if (!domainDashboard.includes('resolveProductStock')) {
  mark('DomainDashboard must use resolveProductStock for inventory KPIs');
}

if (!easyDashboard.includes('TabsList')) {
  mark('EasyBusinessDashboard must use shadcn Tabs for one-page layout');
}
if (!easyDashboard.includes('resolveEasyTabForAction')) {
  mark('EasyBusinessDashboard must route insights via resolveEasyTabForAction');
}
if (!easyDashboard.includes('buildDomainStockSignals')) {
  mark('EasyBusinessDashboard must show domain stock signals on Stock tab');
}
if (!easyDashboard.includes('buildProductSparkHeights')) {
  mark('EasyBusinessDashboard must use real product sparklines from invoices');
}
if (easyDashboard.includes('sparkHeights={[40, 55, 35, 70]}')) {
  mark('EasyBusinessDashboard must not use hardcoded product sparklines');
}

if (!easyIntel.includes('VERTICAL_PLAYBOOKS')) {
  mark('easyDomainIntelligence must define vertical playbooks');
}
if (!easyDashboard.includes('DomainOperationsPanel')) {
  mark('EasyBusinessDashboard must render DomainOperationsPanel on Operations tab');
}
if (!easyDashboard.includes('value="operations"')) {
  mark('EasyBusinessDashboard must define Operations tab');
}

if (!opsIntel.includes('resolveOperationsProfile')) {
  mark('domainOperationsIntelligence must expose resolveOperationsProfile');
}
if (!opsIntel.includes('parts_desk')) {
  mark('domainOperationsIntelligence must define parts_desk mode');
}
if (!opsSnapshot.includes('getDomainOperationsSnapshotAction')) {
  mark('domainOperationsSnapshot action must exist');
}
if (!opsSnapshot.includes('storefront_contact_messages')) {
  mark('domainOperationsSnapshot must aggregate storefront contact queue');
}
if (!opsPanel.includes('buildOperationsKpiTiles')) {
  mark('DomainOperationsPanel must use buildOperationsKpiTiles');
}

if (!easyIntel.includes('operations')) {
  mark('easyDomainIntelligence must support operations tab badges/guidance');
}

if (!easyHelpers.includes('resolveProductStock')) {
  mark('easyDashboardHelpers must resolve display stock');
}
if (!easyHelpers.includes('countLowStockProducts')) {
  mark('easyDashboardHelpers must expose shared low-stock count');
}
if (!easyHelpers.includes('resolveSafetyStock')) {
  mark('easyDashboardHelpers must expose shared safety-stock threshold');
}
if (!easyHelpers.includes('buildProductSparkHeights')) {
  mark('easyDashboardHelpers must build product sparklines from invoice lines');
}

const dashboardTabs = read('app/business/[category]/components/DashboardTabs.jsx');
if (!dashboardTabs.includes('domainKnowledge={domainKnowledge}')) {
  mark('DashboardTabs must pass domainKnowledge into DomainDashboard');
}

if (!easyDashboard.includes('tilePeriodLoading')) {
  mark('EasyBusinessDashboard must skeleton Period movement until sales/finance settle');
}
if (!easyDashboard.includes('tileAttentionLoading')) {
  mark('EasyBusinessDashboard must skeleton Attention until sales/inventory settle');
}
if (easyDashboard.includes('const tileSalesLoading = isSalesLoading || isAnalyticsLoading')) {
  mark('EasyBusinessDashboard must not gate sales tiles on analytics loading');
}

if (!domainDashboard.includes('countLowStockProducts')) {
  mark('DomainDashboard must use shared countLowStockProducts');
}
if (domainDashboard.includes('Math.max(lowStockFallback, dashboardMetrics')) {
  mark('DomainDashboard must not Math.max client low-stock with calendar-month server alerts');
}

if (!industryInsights.includes("variant?: 'default' | 'compact'")) {
  mark('IndustryInsights must support compact variant for Easy mode');
}

const dataContext = read('lib/context/DataContext.js');
if (!dataContext.includes('markShellReady()')) {
  mark('DataContext must paint shell immediately (markShellReady)');
}
if (!dataContext.includes('fetchInventory()')) {
  mark('DataContext bootstrap must fetch inventory in parallel');
}
if (!dataContext.includes('fetchGenerationRef')) {
  mark('DataContext must use generation tokens against stale business races');
}
if (!dataContext.includes('isStale()')) {
  mark('DataContext fetchers must guard setState with isStale()');
}
if (!/Promise\.allSettled\(\[\s*fetchAnalytics\(\),\s*fetchFinance\(\),\s*fetchSales\(\),\s*fetchInventory\(\)/.test(dataContext)) {
  mark('DataContext must stream analytics/finance/sales/inventory in parallel on bootstrap');
}

const dashboardClient = read('app/business/[category]/DashboardClient.jsx');
if (
  !dataContext.includes('fetchInventory()') ||
  (!dashboardClient.includes('fetchInventory()') &&
    !dashboardClient.includes('DataContext bootstrap already loads'))
) {
  mark('Hub must bootstrap inventory via DataContext (dashboard tab must not duplicate fetch)');
}

const productService = read('lib/services/ProductService.js');
if (
  !productService.includes('resolveInventoryEffectiveStock') &&
  !productService.includes("toLowerCase() === 'sellable'") &&
  !productService.includes("=== 'sellable'")
) {
  mark('ProductService.resolveDisplayStock must count sellable locations only');
}
if (!productService.includes('display_stock: displayStock')) {
  mark('ProductService.sanitizeProduct must set display_stock for Easy/hub KPIs');
}
if (!productService.includes('includeSerials')) {
  mark('ProductService.getProducts must support includeSerials for progressive inventory loads');
}

const effectiveStock = read('lib/utils/inventoryEffectiveStock.js');
if (!effectiveStock.includes("toLowerCase() === 'sellable'")) {
  mark('inventoryEffectiveStock must filter sellable location state');
}

if (!easyHelpers.includes('min_stock_level') || !/reorder_point[\s\S]*min_stock_level[\s\S]*min_stock/.test(easyHelpers)) {
  mark('resolveSafetyStock must match analytics SQL threshold order');
}

if (!dataContext.includes('includeSerials: false')) {
  mark('DataContext must fast-path inventory without serials for dashboard KPIs');
}
if (!dataContext.includes('includeSerials === true') && !dataContext.includes('includeSerials: true')) {
  mark('DataContext force refresh must load serials for Busy grid accuracy');
}

const analytics = read('lib/actions/premium/ai/analytics.js');
if (!analytics.includes('sellable_qty') || !analytics.includes('LEFT JOIN')) {
  mark('analytics low-stock must LEFT JOIN sellable location aggregates');
}
if (!analytics.includes('COALESCE(p.is_deleted, false) = false')) {
  mark('analytics low-stock must exclude deleted products');
}

if (!dashboardTabs.includes('_serialsDeferred') || !dashboardTabs.includes('firstNonEmpty')) {
  mark('DashboardTabs Busy save must honor deferred serials (not prefer empty [])');
}

if (!easyDashboard.includes("onQuickAction?.('low-stock')")) {
  mark('Easy Attention must drill to low-stock like mobile hub');
}
if (!easyDashboard.includes('tilePnlLoading') || !easyDashboard.includes('tileReturnsLoading')) {
  mark('Easy must split P&L vs sales vs returns loading gates');
}

if (!easyIntel.includes("'restaurant-cafe'") && !easyIntel.includes('"restaurant-cafe"')) {
  mark('easyDomainIntelligence must key restaurant-cafe playbook after alias resolve');
}

if (!easyHelpers.includes('resolveInvoiceOpenBalance')) {
  mark('easyDashboardHelpers must expose resolveInvoiceOpenBalance for AR tiles');
}
if (!/90d/.test(easyHelpers) || !easyHelpers.includes('last_month')) {
  mark('EASY_PRESET_OPTIONS must include 90d and last_month for Zoho-style period chrome');
}

const filterCtx = read('lib/context/FilterContext.js');
if (!filterCtx.includes('datePresetKey') || !filterCtx.includes('applyDatePreset')) {
  mark('FilterContext must persist datePresetKey and applyDatePreset');
}
if (!filterCtx.includes('getDefaultDateRange')) {
  mark('FilterContext default range must use getDefaultDateRange (30d preset)');
}

const dashKpis = read('lib/actions/basic/dashboard.js');
if (!dashKpis.includes('options.dateFrom || options.dateTo')) {
  mark('getDashboardKPIs must honor explicit dateFrom/dateTo over period defaults');
}

const domainDash = read('app/business/[category]/components/tabs/DomainDashboard.tsx');
if (!domainDash.includes('datePresetKey') || domainDash.includes("activePreset === '90d'")) {
  // Remap of 90d/last_month/ytd → 30d must be gone
}
if (domainDash.includes("activePreset === '90d' || activePreset === 'last_month'")) {
  mark('DomainDashboard must not remap 90d/last_month/ytd mobile presets to 30d');
}
if (!domainDash.includes("'90d': 'Last 90 Days'")) {
  mark('DomainDashboard periodLabel must say Last 90 Days (not Last Quarter)');
}

const productAction = read('lib/actions/standard/inventory/product.js');
if (!productAction.includes('upsertIntegratedProductAction') || !productAction.includes('prepareCompositeUpsertFromRow')) {
  mark('bulkImportProductsAction must route through composite upsert (ledger opening stock)');
}

const busyGrid = read('components/BusyGrid.jsx');
if (!busyGrid.includes('contiguous empty') && !busyGrid.includes('selectedCell.row + 50')) {
  mark('BusyGrid fill-down must fill contiguous empty rows (Excel-style)');
}

const pkg = read('package.json');
if (!pkg.includes('verify:easy-dashboard')) {
  mark('package.json must define verify:easy-dashboard script');
}

if (failed) {
  console.error('\nEasy dashboard verification failed.');
  process.exit(1);
}

console.log('Easy dashboard verification passed.');
