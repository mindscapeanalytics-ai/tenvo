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

if (exists('lib/context/DataContext.js')) {
  const dataCtx = read('lib/context/DataContext.js');
  if (dataCtx.includes('getHubShellBootstrapAction')) {
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
}

const constantsPath = 'lib/dashboard/hubShellBootstrapConstants.js';
if (!exists(constantsPath)) {
  mark(`${constantsPath} must exist`);
} else {
  const constants = read(constantsPath);
  if (!constants.includes('export const HUB_SHELL_PRODUCT_PAGE_LIMIT')) {
    mark('hubShellBootstrapConstants must export HUB_SHELL_PRODUCT_PAGE_LIMIT');
  }
}

if (!failed) {
  console.log('PASS: hub shell bootstrap wiring checks');
  process.exit(0);
}

process.exit(1);
