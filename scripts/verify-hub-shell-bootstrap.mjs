/**
 * Static wiring checks for hub enterprise shell bootstrap.
 * Run: node scripts/verify-hub-shell-bootstrap.mjs
 * Or: bun run verify:hub-shell-bootstrap
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

const bootstrapPath = 'lib/actions/dashboard/hubShellBootstrap.js';
if (!exists(bootstrapPath)) {
  mark(`${bootstrapPath} must exist`);
} else {
  const bootstrap = read(bootstrapPath);
  if (!bootstrap.includes('export async function getHubShellBootstrapAction')) {
    mark('hubShellBootstrap must export getHubShellBootstrapAction');
  }
  if (!bootstrap.includes('withGuard')) {
    mark('hubShellBootstrap must call withGuard');
  }
  if (!bootstrap.includes('HUB_SHELL_PRODUCT_PAGE_LIMIT')) {
    mark('hubShellBootstrap must use HUB_SHELL_PRODUCT_PAGE_LIMIT');
  }
  if (!bootstrap.includes("from '@/lib/dashboard/hubShellBootstrapConstants'") &&
      !bootstrap.includes('from "@/lib/dashboard/hubShellBootstrapConstants"')) {
    mark('hubShellBootstrap must import limits from hubShellBootstrapConstants (not export sync consts from use server)');
  }
  if (/export const HUB_SHELL_/.test(bootstrap)) {
    mark('hubShellBootstrap must not export sync constants from a use server module');
  }
  if (!bootstrap.includes('limit: HUB_SHELL_PRODUCT_PAGE_LIMIT') && !bootstrap.includes('offset: 0')) {
    mark('hubShellBootstrap must request paginated products (limit + offset 0)');
  }
  if (!bootstrap.includes('runWithTrustedAuthBypass')) {
    mark('hubShellBootstrap nested helpers must use runWithTrustedAuthBypass (not client skipAuth)');
  }
  if (bootstrap.includes('skipAuth: true')) {
    mark('hubShellBootstrap must not pass skipAuth: true (use runWithTrustedAuthBypass)');
  }
  if (!bootstrap.includes('getUnifiedActivityFeedAction')) {
    mark('hubShellBootstrap must include activity feed');
  }
  if (!bootstrap.includes('getInvoicesAction')) {
    mark('hubShellBootstrap must include invoices');
  }
  if (!bootstrap.includes('getCustomersAction')) {
    mark('hubShellBootstrap must include lean customers for CRM first paint');
  }
  if (!bootstrap.includes('HUB_SHELL_CUSTOMER_LIMIT')) {
    mark('hubShellBootstrap must use HUB_SHELL_CUSTOMER_LIMIT');
  }
}

const customerAction = read('lib/actions/basic/customer.js');
if (!customerAction.includes('isTrustedAuthBypassActive')) {
  mark('getCustomersAction must honor trusted auth bypass ALS');
}
if (!customerAction.includes('CUSTOMER_LIST_SELECT') && !customerAction.includes('lean')) {
  mark('getCustomersAction must support lean list select');
}

const trustedBypass = 'lib/actions/_shared/trustedAuthBypass.js';
if (!exists(trustedBypass)) {
  mark(`${trustedBypass} must exist`);
} else {
  const bypass = read(trustedBypass);
  if (!bypass.includes('isTrustedAuthBypassActive') || !bypass.includes('runWithTrustedAuthBypass')) {
    mark('trustedAuthBypass must export isTrustedAuthBypassActive + runWithTrustedAuthBypass');
  }
  if (!bypass.includes('withBusinessContext')) {
    mark('trustedAuthBypass must nest withBusinessContext for Prisma auto-scope');
  }
}

const invoice = read('lib/actions/basic/invoice.js');
if (!invoice.includes('isTrustedAuthBypassActive')) {
  mark('getInvoicesAction must honor trusted auth bypass ALS (not client skipAuth)');
}
if (/if \(options\.skipAuth\)/.test(invoice) || /skipAuth\s*=\s*false/.test(invoice)) {
  mark('invoice.js must not accept client-supplied skipAuth');
}

const product = read('lib/actions/standard/inventory/product.js');
if (!product.includes('isTrustedAuthBypassActive')) {
  mark('getProductsAction must honor trusted auth bypass ALS');
}
if (/options\.skipAuth/.test(product) && !product.includes('_ignoredSkipAuth')) {
  mark('product.js must ignore client skipAuth (use ALS only)');
}

const warehouse = read('lib/actions/standard/inventory/warehouse.js');
if (!warehouse.includes('isTrustedAuthBypassActive')) {
  mark('getWarehouseLocationsAction must honor trusted auth bypass ALS');
}

const audit = read('lib/actions/basic/audit.js');
if (!audit.includes('isTrustedAuthBypassActive')) {
  mark('getUnifiedActivityFeedAction must honor trusted auth bypass ALS');
}

const report = read('lib/actions/standard/report.js');
if (!report.includes('getMonthlyFinancialsAction') || !report.includes('isTrustedAuthBypassActive')) {
  mark('getMonthlyFinancialsAction must honor trusted auth bypass ALS');
}

const analytics = read('lib/actions/premium/ai/analytics.js');
if (!analytics.includes('isTrustedAuthBypassActive')) {
  mark('getExpenseBreakdownAction must honor trusted auth bypass ALS');
}

if (exists('lib/context/HubQueryProvider.jsx')) {
  const provider = read('lib/context/HubQueryProvider.jsx');
  if (!provider.includes('QueryClientProvider')) {
    mark('HubQueryProvider must wrap QueryClientProvider');
  }
}

if (exists('lib/dashboard/hubShellCache.js')) {
  const cache = read('lib/dashboard/hubShellCache.js');
  if (!cache.includes('readHubShellCache') || !cache.includes('writeHubShellCache')) {
    mark('hubShellCache must export read/write helpers');
  }
}

if (exists('lib/dashboard/hubShellQuery.js')) {
  const shellQuery = read('lib/dashboard/hubShellQuery.js');
  if (!shellQuery.includes('export async function fetchHubShellQuery')) {
    mark('hubShellQuery must export fetchHubShellQuery');
  }
  if (!shellQuery.includes('readHubShellPlaceholder')) {
    mark('hubShellQuery must export readHubShellPlaceholder for RQ placeholderData');
  }
  if (!shellQuery.includes('seedHubShellQueryCache')) {
    mark('hubShellQuery must export seedHubShellQueryCache for RSC hydrate');
  }
} else {
  mark('lib/dashboard/hubShellQuery.js must exist (Phase 3 hub shell SOT)');
}

if (exists('lib/hooks/useHubShellQuery.js')) {
  const hook = read('lib/hooks/useHubShellQuery.js');
  if (!hook.includes('useHubShellQuery')) {
    mark('useHubShellQuery hook must exist');
  }
  if (!hook.includes('placeholderData')) {
    mark('useHubShellQuery must use placeholderData for warm paint');
  }
} else {
  mark('lib/hooks/useHubShellQuery.js must exist');
}

if (exists('lib/dashboard/hubQueryKeys.js')) {
  const keys = read('lib/dashboard/hubQueryKeys.js');
  if (!keys.includes('hubShellQueryKey')) {
    mark('hubQueryKeys must export hubShellQueryKey');
  }
}

if (exists('lib/context/DataContext.js')) {
  const dataCtx = read('lib/context/DataContext.js');
  if (!dataCtx.includes('useHubShellQuery')) {
    mark('DataContext must use useHubShellQuery as hub shell SOT');
  }
  if (dataCtx.includes('getHubShellBootstrapAction')) {
    mark('DataContext must not call getHubShellBootstrapAction directly (use hubShellQuery)');
  }
  if (dataCtx.includes('fetchInventory({ fullCatalog: true })')) {
    mark('DataContext must not background-load fullCatalog after bootstrap');
  }
  if (
    dataCtx.includes("HUB_SHELL_PRODUCT_PAGE_LIMIT } from '@/lib/actions/dashboard/hubShellBootstrap'") ||
    dataCtx.includes('HUB_SHELL_PRODUCT_PAGE_LIMIT } from "@/lib/actions/dashboard/hubShellBootstrap"') ||
    /HUB_SHELL_PRODUCT_PAGE_LIMIT[\s\S]*from ['"]@\/lib\/actions\/dashboard\/hubShellBootstrap['"]/.test(dataCtx)
  ) {
    mark('DataContext must import HUB_SHELL_PRODUCT_PAGE_LIMIT from hubShellBootstrapConstants, not the use server module');
  }
  if (!dataCtx.includes('hubShellBootstrapConstants')) {
    mark('DataContext must import HUB_SHELL_PRODUCT_PAGE_LIMIT from hubShellBootstrapConstants');
  }
}

const constantsPath = 'lib/dashboard/hubShellBootstrapConstants.js';
if (!exists(constantsPath)) {
  mark(`${constantsPath} must exist`);
} else {
  const constants = read(constantsPath);
  if (!constants.includes('export const HUB_SHELL_PRODUCT_PAGE_LIMIT')) {
    mark('hubShellBootstrapConstants must export HUB_SHELL_PRODUCT_PAGE_LIMIT');
  }
  if (!constants.includes('export const HUB_SHELL_CUSTOMER_LIMIT')) {
    mark('hubShellBootstrapConstants must export HUB_SHELL_CUSTOMER_LIMIT');
  }
}

// Phase 2: lean KPIs, slim product list, sales headers-only, finance session cache
{
  const bootstrap = exists(bootstrapPath) ? read(bootstrapPath) : '';
  if (bootstrap && !bootstrap.includes("detailLevel: 'list'")) {
    mark('hubShellBootstrap products must request detailLevel list');
  }

  const dashboardKpis = read('lib/actions/basic/dashboard.js');
  if (/SELECT \* FROM invoices/.test(dashboardKpis)) {
    mark('getDashboardKPIs must not SELECT * FROM invoices (use column-minimal CTEs)');
  }

  const productService = read('lib/services/ProductService.js');
  if (!productService.includes('detailLevel') || !productService.includes('_detailLevel')) {
    mark('ProductService.getProducts must support detailLevel / _detailLevel');
  }

  const dataCtx = read('lib/context/DataContext.js');
  if (!dataCtx.includes('includeItems: false')) {
    mark('DataContext fetchSales must keep includeItems false for list modes');
  }
  if (!dataCtx.includes('inventoryPendingForceRef')) {
    mark('DataContext must coalesce inventory force refreshes (inventoryPendingForceRef)');
  }
  if (!dataCtx.includes('hydrateHubShellFromServer')) {
    mark('DataContext must expose hydrateHubShellFromServer for RSC cold paint');
  }
  if (!dataCtx.includes('useLayoutEffect')) {
    mark('DataContext must paint hub shell cache in useLayoutEffect (before browser paint)');
  }
  if (!dataCtx.includes('shellPaintedKeyRef')) {
    mark('DataContext must track shellPaintedKeyRef so SSR paint is not cleared');
  }

  if (!exists('lib/dashboard/loadInitialHubShell.js')) {
    mark('loadInitialHubShell must exist for dashboard RSC cold paint');
  } else {
    const loader = read('lib/dashboard/loadInitialHubShell.js');
    if (!loader.includes('getHubShellBootstrapAction')) {
      mark('loadInitialHubShell must call getHubShellBootstrapAction');
    }
    if (!loader.includes('serializeDecimalsDeep')) {
      mark('loadInitialHubShell must serializeDecimalsDeep for client props');
    }
    if (!loader.includes('customers: shell.customers')) {
      mark('loadInitialHubShell must pass customers into RSC payload');
    }
  }

  const dashClient = read('app/business/[category]/DashboardClient.jsx');
  if (dashClient.includes("fetchSales({ mode: 'full' })") &&
      /activeTab === 'invoices'[\s\S]{0,400}mode: 'full'/.test(dashClient)) {
    mark('DashboardClient invoices tab must not force fetchSales full (paint from shell)');
  }
  if (!dashClient.includes('fetchCustomers')) {
    mark('DashboardClient must use fetchCustomers for CRM tab');
  }

  if (!exists('components/dashboard/HubShellHydrator.jsx')) {
    mark('HubShellHydrator must exist');
  }

  const dashPage = read('app/business/[category]/page.js');
  if (!dashPage.includes('loadInitialHubShell') || !dashPage.includes('HubShellHydrator')) {
    mark('business dashboard page must RSC-load hub shell and hydrate via HubShellHydrator');
  }

  const financeHub = read('components/finance/FinanceHub.jsx');
  if (!financeHub.includes('financeHubSessionCache')) {
    mark('FinanceHub must use session cache to avoid remount refetch storms');
  }
}

if (!failed) {
  console.log('PASS: hub shell bootstrap wiring checks');
  process.exit(0);
}

process.exit(1);
