/**
 * Static wiring checks for Finance / Money hub GL + reports.
 * Run: bun run verify:finance-gl
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`OK: ${msg}`);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function includes(rel, needle, msg) {
  assert(read(rel).includes(needle), msg || `${rel} includes ${needle}`);
}

// Phase 1
includes('lib/services/AccountingService.js', "'input_tax'", 'purchase input_tax functional type');
includes('lib/services/AccountingService.js', 'accounts.input_tax', 'purchase DR input tax line');
includes('lib/services/paymentReconciliation.js', 'txClient', 'storefront reconcile accepts txClient');
includes('lib/actions/storefront/payments.js', 'reconcileOrderPayment', 'storefront payments wire reconcile');
includes('lib/actions/storefront/orders.js', 'reconcileOrderPayment', 'COD delivery wires reconcile');
includes('lib/actions/standard/restaurant.js', 'pos_sale', 'restaurant settle posts pos_sale');
includes('lib/rbac/permissions.js', 'featuresAny', 'finance nav featuresAny');
includes('lib/config/tabs.js', "journal: 'journal'", 'journal deep-link maps to journal');

// Phase 2
includes('lib/actions/standard/report.js', 'getCashFlowAction', 'cash flow server action');
includes('lib/actions/standard/report.js', 'getDayBookAction', 'day book server action');
includes('lib/actions/standard/report.js', 'getGlCoverageSnapshotAction', 'GL coverage snapshot');
includes('lib/actions/standard/report.js', 'e.journal_id', 'day book joins journal_id');
includes('lib/pdf/financeStatementPdf.js', 'drawFinancePdfHeader', 'finance PDF chrome');
includes('lib/api/accounting.js', 'getCashFlow', 'accounting API cash flow');
includes('components/finance/DayBookReport.jsx', 'Day Book', 'Day Book UI');
includes('components/FinancialReports.jsx', 'handleDownloadPdf', 'statements PDF download');

// Phase 3
includes('components/finance/FinanceHub.jsx', 'resolveFinanceHubNavigation', 'FinanceHub navigation aliases');
includes('components/finance/FinanceHub.jsx', 'getGlCoverage', 'overview coverage load');
includes('components/finance/FinanceHub.jsx', 'Payments &amp; vouchers', 'overview CTA to payments');
includes('components/finance/FinanceHub.jsx', 'goToPaymentsHub', 'payments hub helper');
includes('components/FinancialReports.jsx', "value=\"tb\"", 'Statements nests Trial Balance');
includes('components/FinancialReports.jsx', "value=\"day-book\"", 'Statements nests Day Book');
includes('lib/config/tabs.js', "accounts: 'accounts'", 'accounts deep-link maps to CoA');
includes('components/TaxComplianceManager.jsx', 'periodPos', 'GST includes POS tax when provided');

// A/R & A/P aging (Statements)
includes('lib/utils/agingBuckets.js', 'bucketAgingRows', 'shared aging bucket helper');
includes('lib/services/InvoicePaymentService.js', 'calculate_invoice_balance(i.id)', 'AR aging uses invoice balance function');
includes('lib/services/InvoicePaymentService.js', 'bucketAgingRows', 'AR aging buckets outstanding balance');
assert(
  !read('lib/services/InvoicePaymentService.js').includes('FROM invoice_aging'),
  'AR aging does not depend on invoice_aging view at runtime'
);
includes('lib/actions/standard/agingReports.js', 'getAccountsPayableAgingAction', 'AP aging server action');
includes('lib/actions/standard/agingReports.js', 'pay.is_deleted', 'AP aging ignores voided vendor payments');
includes('components/reports/AgingReportsPanel.jsx', 'AgingReportsPanel', 'Aging panel UI');
includes('components/FinancialReports.jsx', 'AgingReportsPanel', 'Statements hosts aging panel');
includes('prisma/migrations/20260718_invoice_aging_view/migration.sql', 'CREATE OR REPLACE VIEW invoice_aging', 'Prisma invoice_aging view migration');

// Statements accuracy: exclude draft journals; keep reversed + posted
includes('lib/utils/glReportSql.js', 'GL_EXCLUDE_DRAFT_JOURNAL_SQL', 'shared draft-exclusion SQL fragment');
includes('lib/utils/glReportSql.js', 'GL_EXCLUDE_DRAFT_JOURNAL_SQL_GE', 'ledger alias draft-exclusion fragment');
includes('lib/actions/standard/report.js', 'GL_EXCLUDE_DRAFT_JOURNAL_SQL', 'report actions use draft exclusion');
includes('lib/actions/basic/accounting.js', 'GL_EXCLUDE_DRAFT_JOURNAL_SQL_GE', 'GL ledger/balance exclude drafts');
assert(
  !read('lib/actions/basic/accounting.js').includes('export async function getTrialBalanceAction'),
  'duplicate Trial Balance action removed from basic/accounting (canonical is standard/report)'
);
includes('lib/services/PaymentService.js', 'FROM invoice_payments ip', 'customer AR reconcile uses invoice_payments');
includes('lib/storefront/storefrontDisplayStock.js', 'Variant SKUs sell from variant stock', 'storefront stock stays variant-first for checkout');
includes('lib/actions/standard/report.js', 'grossMargin', 'P&L returns grossMargin for PDF/UI');
includes('lib/actions/standard/report.js', 'a.business_id = je.business_id', 'Day Book scopes accounts by business');
includes('components/finance/DayBookReport.jsx', 'statusLabel', 'Day Book shows journal status');
assert(
  read('lib/actions/standard/report.js').includes("<> 'draft'") ||
    read('lib/utils/glReportSql.js').includes("<> 'draft'"),
  'draft journals excluded from statement balances'
);

// Invoice tax wiring + tax enable toggle
includes('lib/validation/schemas.js', 'tax_total', 'invoiceSchema accepts tax_total alias');
includes('lib/actions/basic/invoice.js', 'validated.tax_total = validated.total_tax', 'createInvoiceAction bridges total_tax → tax_total');
includes('lib/services/InvoiceService.js', 'total_tax, discount_total, grand_total', 'createInvoice persists both tax columns');
includes('lib/services/InvoiceService.js', 'transaction.tax_amount', 'POS convert maps tax_amount');
includes('lib/utils/businessRegionalContext.js', 'taxEnabled', 'regional pack exposes taxEnabled');
includes('components/SettingsManager.jsx', 'taxEnabled: checked', 'Settings Financials tax toggle persists');
includes('lib/hooks/usePosTaxConfig.js', 'taxEnabled', 'POS tax config respects taxEnabled');

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nverify:finance-gl passed');
