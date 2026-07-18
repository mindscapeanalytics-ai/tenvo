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
    mark('hubShellBootstrap must define HUB_SHELL_PRODUCT_PAGE_LIMIT');
  }
  if (!bootstrap.includes('limit: HUB_SHELL_PRODUCT_PAGE_LIMIT') && !bootstrap.includes('offset: 0')) {
    mark('hubShellBootstrap must request paginated products (limit + offset 0)');
  }
  if (!bootstrap.includes('skipAuth: true')) {
    mark('hubShellBootstrap nested helpers must use skipAuth: true');
  }
  if (!bootstrap.includes('getUnifiedActivityFeedAction')) {
    mark('hubShellBootstrap must include activity feed');
  }
  if (!bootstrap.includes('getInvoicesAction')) {
    mark('hubShellBootstrap must include invoices');
  }
}

const invoice = read('lib/actions/basic/invoice.js');
if (!invoice.includes('skipAuth')) {
  mark('getInvoicesAction must support skipAuth');
}

const product = read('lib/actions/standard/inventory/product.js');
if (!product.includes('skipAuth')) {
  mark('getProductsAction must support skipAuth');
}

const warehouse = read('lib/actions/standard/inventory/warehouse.js');
if (!warehouse.includes('skipAuth')) {
  mark('getWarehouseLocationsAction must support skipAuth');
}

const audit = read('lib/actions/basic/audit.js');
if (!audit.includes('skipAuth')) {
  mark('getUnifiedActivityFeedAction must support skipAuth');
}

const report = read('lib/actions/standard/report.js');
if (!report.includes('getMonthlyFinancialsAction') || !report.includes('options.skipAuth')) {
  mark('getMonthlyFinancialsAction must support skipAuth');
}

const analytics = read('lib/actions/premium/ai/analytics.js');
if (!analytics.includes('skipAuth')) {
  mark('getExpenseBreakdownAction must support skipAuth');
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

if (exists('lib/context/DataContext.js')) {
  const dataCtx = read('lib/context/DataContext.js');
  if (dataCtx.includes('getHubShellBootstrapAction')) {
    if (dataCtx.includes('fetchInventory({ fullCatalog: true })')) {
      mark('DataContext must not background-load fullCatalog after bootstrap');
    }
  }
}

if (!failed) {
  console.log('PASS: hub shell bootstrap wiring checks');
  process.exit(0);
}

process.exit(1);
