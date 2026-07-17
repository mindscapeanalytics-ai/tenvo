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
includes('components/finance/FinanceHub.jsx', "'day-book'", 'FinanceHub day-book tab');
includes('components/finance/FinanceHub.jsx', 'getGlCoverage', 'overview coverage load');
includes('components/finance/FinanceHub.jsx', 'Open full Payments', 'vouchers CTA to payments');
includes('components/TaxComplianceManager.jsx', 'periodPos', 'GST includes POS tax when provided');

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nverify:finance-gl passed');
