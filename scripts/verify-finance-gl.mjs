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

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nverify:finance-gl passed');
