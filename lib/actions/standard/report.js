'use server';

import pool from '@/lib/db';
import { withGuard } from '@/lib/rbac/serverGuard';
import { ACCOUNT_CODES, COGS_CODES } from '@/lib/config/accounting';
import { PENDING_INVOICE_STATUS_SQL_IN } from '@/lib/utils/analytics';
import { autoReconcilePendingOrders } from '@/lib/services/paymentReconciliation';
import { isTrustedAuthBypassActive } from '@/lib/actions/_shared/trustedAuthBypass';

// Helper to check auth and business access
async function checkAuth(businessId, client = null, permission = 'finance.view_reports', feature = 'basic_reports') {
    if (isTrustedAuthBypassActive()) return null;
    const { session } = await withGuard(businessId, { permission, feature, client });
    return session;
}

/**
 * Server Action: Get Trial Balance
 * Aggregates all GL entries by account to show total debit, credit and net balance.
 */
export async function getTrialBalanceAction(businessId, asOfDate = new Date().toISOString()) {
    let client;
    try {
        client = await pool.connect();
        await checkAuth(businessId, client, 'finance.view_reports', 'basic_reports');
        try {
            // Aggregate entries by account
            const result = await client.query(`
                SELECT 
                    a.id, a.code, a.name, a.type,
                    COALESCE(SUM(e.debit), 0) as total_debit,
                    COALESCE(SUM(e.credit), 0) as total_credit
                FROM gl_accounts a
                LEFT JOIN gl_entries e ON a.id = e.account_id AND e.business_id = $1 AND e.transaction_date <= $2
                WHERE a.business_id = $1
                GROUP BY a.id, a.code, a.name, a.type
                ORDER BY a.code ASC
            `, [businessId, asOfDate]);

            const accounts = result.rows.map(row => {
                const debit = parseFloat(row.total_debit);
                const credit = parseFloat(row.total_credit);

                // Calculate Net Balance based on Account Type
                // Asset/Expense: Debit normal (Debit - Credit)
                // Liability/Equity/Income: Credit normal (Credit - Debit)
                let netBalance = 0;
                const type = row.type.toLowerCase();

                if (['asset', 'expense'].includes(type)) {
                    netBalance = debit - credit;
                } else {
                    netBalance = credit - debit;
                }

                return {
                    ...row,
                    total_debit: debit,
                    total_credit: credit,
                    net_balance: netBalance
                };
            });

            // Verify Total Balancing
            const totalDebit = accounts.reduce((sum, a) => sum + a.total_debit, 0);
            const totalCredit = accounts.reduce((sum, a) => sum + a.total_credit, 0);

            return {
                success: true,
                trialBalance: accounts,
                totals: { debit: totalDebit, credit: totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 }
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Trial Balance Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Profit & Loss Statement (Income Statement)
 * Revenue - Expenses = Net Income
 */
export async function getProfitLossAction(businessId, startDate, endDate) {
    let client;
    try {
        client = await pool.connect();
        await checkAuth(businessId, client, 'finance.view_reports', 'basic_reports');
        try {
            // Fetch relevant accounts and their movements within the period
            const result = await client.query(`
                SELECT 
                    a.id, a.code, a.name, a.type,
                    COALESCE(SUM(e.credit - e.debit), 0) as balance 
                FROM gl_accounts a
                LEFT JOIN gl_entries e ON a.id = e.account_id AND e.business_id = $1
                    AND e.transaction_date >= $2 
                    AND e.transaction_date <= $3
                WHERE a.business_id = $1 
                  AND LOWER(a.type) IN ('income', 'revenue', 'expense')
                GROUP BY a.id, a.code, a.name, a.type
                ORDER BY a.code ASC
            `, [businessId, startDate, endDate]);

            const accounts = result.rows.map(row => ({
                ...row,
                balance: parseFloat(row.balance)
            }));

            // In our system:
            // Income: Credit Normal (Credit - Debit > 0)
            // Expense: Debit Normal (Debit - Credit > 0). 
            // The query calculates (Credit - Debit).
            // So Income will be positive. Expense will be negative.

            // Let's separate them
            const incomeAccounts = accounts.filter(a => ['income', 'revenue'].includes(a.type.toLowerCase())).map(a => ({
                ...a,
                amount: a.balance // Positive for revenue
            }));

            // Expenses: Separate COGS family (5000-5002) from operating expenses
            const allExpenses = accounts.filter(a => a.type.toLowerCase() === 'expense');
            const cogsCodeSet = new Set(COGS_CODES);

            const cogsFinal = allExpenses.filter(a => cogsCodeSet.has(a.code)).map(a => ({
                ...a,
                amount: -a.balance
            }));

            const otherExpenseAccounts = allExpenses.filter(a => !cogsCodeSet.has(a.code)).map(a => ({
                ...a,
                amount: -a.balance
            }));

            const totalIncome = incomeAccounts.reduce((sum, a) => sum + a.amount, 0);
            const totalCOGS = cogsFinal.reduce((sum, a) => sum + a.amount, 0);
            const grossProfit = totalIncome - totalCOGS;
            const totalOtherExpense = otherExpenseAccounts.reduce((sum, a) => sum + a.amount, 0);
            const netIncome = grossProfit - totalOtherExpense;

            return {
                success: true,
                meta: {
                    periodFrom: startDate,
                    periodTo: endDate,
                    generatedAt: new Date().toISOString(),
                },
                statement: {
                    income: incomeAccounts,
                    cogs: cogsFinal,
                    otherExpenses: otherExpenseAccounts,
                    totalIncome,
                    totalCOGS,
                    grossProfit,
                    totalExpense: totalCOGS + totalOtherExpense,
                    netIncome
                }
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get P&L Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Balance Sheet
 * Assets = Liabilities + Equity
 */
export async function getBalanceSheetAction(businessId, asOfDate) {
    let client;
    try {
        client = await pool.connect();
        await checkAuth(businessId, client, 'finance.view_reports', 'basic_reports');
        try {
            // 1. Calculate Net Income (Retained Earnings) up to AsOfDate (All time)
            // Revenue (Cr) - Expenses (Dr)
            const retainedEarningsRes = await client.query(`
                SELECT 
                    COALESCE(SUM(CASE WHEN LOWER(a.type) IN ('income', 'revenue') THEN (e.credit - e.debit) ELSE 0 END), 0) as total_income,
                    COALESCE(SUM(CASE WHEN LOWER(a.type) = 'expense' THEN (e.debit - e.credit) ELSE 0 END), 0) as total_expense
                FROM gl_accounts a
                LEFT JOIN gl_entries e ON a.id = e.account_id AND e.business_id = $1 AND e.transaction_date <= $2
                WHERE a.business_id = $1 AND LOWER(a.type) IN ('income', 'revenue', 'expense')
            `, [businessId, asOfDate]);

            const totalRevenue = parseFloat(retainedEarningsRes.rows[0].total_income);
            const totalExpenses = parseFloat(retainedEarningsRes.rows[0].total_expense);
            const retainedEarnings = totalRevenue - totalExpenses; // Net Income to date

            // 2. Fetch Asset, Liability, Equity Balances
            const result = await client.query(`
                SELECT 
                    a.id, a.code, a.name, a.type,
                    COALESCE(SUM(e.debit), 0) as total_debit,
                    COALESCE(SUM(e.credit), 0) as total_credit
                FROM gl_accounts a
                LEFT JOIN gl_entries e ON a.id = e.account_id AND e.business_id = $1 AND e.transaction_date <= $2
                WHERE a.business_id = $1 
                  AND LOWER(a.type) IN ('asset', 'liability', 'equity')
                GROUP BY a.id, a.code, a.name, a.type
                ORDER BY a.code ASC
            `, [businessId, asOfDate]);

            const accounts = result.rows.map(row => {
                const debit = parseFloat(row.total_debit);
                const credit = parseFloat(row.total_credit);
                let balance = 0;

                // Asset: Debit - Credit
                // Liability/Equity: Credit - Debit
                if (row.type.toLowerCase() === 'asset') {
                    balance = debit - credit;
                } else {
                    balance = credit - debit;
                }

                return { ...row, balance };
            });

            const assets = accounts.filter(a => a.type.toLowerCase() === 'asset');
            const liabilities = accounts.filter(a => a.type.toLowerCase() === 'liability');
            const equity = accounts.filter(a => a.type.toLowerCase() === 'equity');

            const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
            const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
            let totalEquity = equity.reduce((sum, a) => sum + a.balance, 0);

            // Add Retained Earnings to Equity
            totalEquity += retainedEarnings;

            return {
                success: true,
                statement: {
                    assets,
                    liabilities,
                    equity,
                    retainedEarnings, // Send separately for display
                    totalAssets,
                    totalLiabilities,
                    totalEquity,
                    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
                    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
                }
            };

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Balance Sheet Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Accounting Summary for Dashboard
 * Provides high-level GL-driven metrics (AR, AP, Inventory, GP)
 */
export async function getAccountingSummaryAction(businessId, startDate, endDate, options = {}) {
    let client;
    try {
        void options;
        client = await pool.connect();
        // Nested callers use runWithTrustedAuthBypass after withGuard — ALS skips duplicate auth SQL.
        await checkAuth(businessId, client, 'finance.view_reports', 'basic_reports');
        try {
            // 1. Get Balances for key account categories/codes
            const result = await client.query(`
                SELECT 
                    a.code, a.type,
                    COALESCE(SUM(e.debit), 0) as total_debit,
                    COALESCE(SUM(e.credit), 0) as total_credit
                FROM gl_accounts a
                LEFT JOIN gl_entries e ON a.id = e.account_id AND e.business_id = $1
                WHERE a.business_id = $1
                  AND ($2::timestamp IS NULL OR e.transaction_date >= $2)
                  AND ($3::timestamp IS NULL OR e.transaction_date <= $3)
                GROUP BY a.code, a.type
            `, [businessId, startDate, endDate]);

            // 1.5 Get Status Counts
            const statusCounts = await client.query(`
                SELECT 
                    (SELECT COUNT(*) FROM invoices WHERE business_id = $1 AND status IN ${PENDING_INVOICE_STATUS_SQL_IN} AND (is_deleted = false OR is_deleted IS NULL)) as pending_invoices,
                    (SELECT COUNT(*) FROM purchases WHERE business_id = $1 AND status IN ('draft', 'ordered', 'pending', 'approved', 'sent') AND (is_deleted = false OR is_deleted IS NULL)) as pending_purchases
            `, [businessId]);

            const rows = result.rows;
            const counts = statusCounts.rows[0];

            // Helper to get balance for a specific code or type
            const getNetForCode = (code) => {
                const match = rows.find(r => r.code === code);
                if (!match) return 0;
                const debits = parseFloat(match.total_debit);
                const credits = parseFloat(match.total_credit);
                const type = match.type.toLowerCase();

                // Asset/Expense: Dr - Cr
                if (['asset', 'expense'].includes(type)) return debits - credits;
                // Liability/Equity/Income: Cr - Dr
                return credits - debits;
            };

            const getNetForType = (type) => {
                const matches = rows.filter(r => r.type.toLowerCase() === type.toLowerCase());
                return matches.reduce((sum, match) => {
                    const debits = parseFloat(match.total_debit);
                    const credits = parseFloat(match.total_credit);
                    if (['asset', 'expense'].includes(type.toLowerCase())) return sum + (debits - credits);
                    return sum + (credits - debits);
                }, 0);
            };

            // Calculate Metrics - Using standardized codes from config
            const accountsReceivable = getNetForCode(ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);
            const accountsPayable = getNetForCode(ACCOUNT_CODES.ACCOUNTS_PAYABLE);
            const inventoryValue = getNetForCode(ACCOUNT_CODES.INVENTORY_ASSET);

            const totalRevenue = getNetForType('income') + getNetForType('revenue');
            const totalCOGS = getNetForCode(ACCOUNT_CODES.COGS);
            const grossProfit = totalRevenue - totalCOGS;

            return {
                success: true,
                summary: {
                    accountsReceivable: parseFloat(accountsReceivable || 0),
                    accountsPayable: parseFloat(accountsPayable || 0),
                    inventoryValue: parseFloat(inventoryValue || 0),
                    totalRevenue: parseFloat(totalRevenue || 0),
                    totalCOGS: parseFloat(totalCOGS || 0),
                    grossProfit: parseFloat(grossProfit || 0),
                    margin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
                    pendingInvoiceCount: parseInt(counts.pending_invoices || 0),
                    pendingPurchaseCount: parseInt(counts.pending_purchases || 0)
                }
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Accounting Summary Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Monthly Financials for Analytics
 * Aggregates Revenue vs COGS by month from the General Ledger
 */
/**
 * @param {string} businessId
 * @param {number} [months=6]
 * @param {object} [options] - Reserved (client skipAuth ignored; use runWithTrustedAuthBypass)
 */
export async function getMonthlyFinancialsAction(businessId, months = 6, options = {}) {
    try {
        void options;
        const client = await pool.connect();
        try {
            await checkAuth(businessId, client, 'finance.view_reports', 'basic_reports');
            // Calculate start date (1st of [months] ago)
            const today = new Date();
            const startMonth = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);

            const result = await client.query(`
                SELECT 
                    TO_CHAR(e.transaction_date, 'Mon') as month_label,
                    EXTRACT(YEAR FROM e.transaction_date) as year,
                    EXTRACT(MONTH FROM e.transaction_date) as month_num,
                    a.type,
                    COALESCE(SUM(e.debit), 0) as total_debit,
                    COALESCE(SUM(e.credit), 0) as total_credit
                FROM gl_entries e
                JOIN gl_accounts a ON e.account_id = a.id
                WHERE a.business_id = $1
                  AND e.transaction_date >= $2
                  AND LOWER(a.type) IN ('income', 'revenue', 'expense')
                GROUP BY 
                    TO_CHAR(e.transaction_date, 'Mon'), 
                    EXTRACT(YEAR FROM e.transaction_date), 
                    EXTRACT(MONTH FROM e.transaction_date), 
                    a.type
                ORDER BY year ASC, month_num ASC
            `, [businessId, startMonth.toISOString()]);

            // Process into chart-friendly format
            const monthMap = {};

            // Initialize all months in range to 0 to prevent gaps
            for (let i = 0; i < months; i++) {
                const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
                const label = d.toLocaleString('default', { month: 'short' });
                const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
                monthMap[key] = { date: label, revenue: 0, expenses: 0, cogs: 0, profit: 0, year: d.getFullYear(), month: d.getMonth() + 1 };
            }

            result.rows.forEach(row => {
                const key = `${row.year}-${row.month_num}`;

                // If query returns data outside our generated range (edge case), ignore
                if (!monthMap[key]) return;

                const debits = parseFloat(row.total_debit);
                const credits = parseFloat(row.total_credit);

                // Income is Credit Normal (Cr - Dr)
                if (['income', 'revenue'].includes(row.type.toLowerCase())) {
                    monthMap[key].revenue += (credits - debits);
                }
                // Expense is Debit Normal (Dr - Cr)
                else if (row.type.toLowerCase() === 'expense') {
                    // We could separate COGS here if we had account codes in the Group By, 
                    // but for now let's treat all 5xxx as expense/COGS. 
                    // Wait, better to separate COGS for intelligence.
                    // Let's rely on type 'expense'. 
                    monthMap[key].expenses += (debits - credits);
                }
            });

            // Convert map to array
            const chartData = Object.values(monthMap).map(m => ({
                ...m,
                profit: m.revenue - m.expenses
            })).sort((a, b) => (a.year - b.year) || (a.month - b.month));

            return { success: true, analytics: chartData };

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Monthly Financials Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Stock Aging Report
 * Analyzes batches to see how long stock has been in inventory.
 * Useful for FEFO (perishables) and optimizing cash flow.
 */
export async function getStockAgingReportAction(businessId) {
    try {
        const client = await pool.connect();
        try {
            await checkAuth(businessId, client, 'finance.view_reports', 'basic_reports');
            const result = await client.query(`
                SELECT 
                    p.name, p.sku, b.batch_number, b.quantity, b.cost_price, b.created_at,
                    EXTRACT(DAY FROM (NOW() - b.created_at)) as age_days
                FROM product_batches b
                JOIN products p ON b.product_id = p.id
                WHERE b.business_id = $1 AND b.quantity > 0 AND b.is_active = true
                ORDER BY age_days DESC
            `, [businessId]);

            const buckets = {
                '0-30': 0,
                '31-60': 0,
                '61-90': 0,
                '90+': 0
            };

            const data = result.rows.map(row => {
                const age = parseInt(row.age_days);
                const value = Number(row.quantity) * Number(row.cost_price);

                if (age <= 30) buckets['0-30'] += value;
                else if (age <= 60) buckets['31-60'] += value;
                else if (age <= 90) buckets['61-90'] += value;
                else buckets['90+'] += value;

                return { ...row, value };
            });

            return { success: true, aging: data, buckets };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Aging Report Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Historical Inventory Valuation
 * Reconstructs valuation at a specific point in time using the ledger.
 */
export async function getValuationHistoryAction(businessId, date) {
    try {
        const client = await pool.connect();
        try {
            await checkAuth(businessId, client, 'finance.view_reports', 'basic_reports');
            const result = await client.query(`
                SELECT 
                    p.name,
                    SUM(l.quantity_change) as stock_at_time,
                    SUM(l.quantity_change * l.unit_cost) as value_at_time
                FROM inventory_ledger l
                JOIN products p ON l.product_id = p.id
                WHERE l.business_id = $1 AND l.created_at <= $2
                GROUP BY p.id, p.name
                HAVING SUM(l.quantity_change) != 0
            `, [businessId, date]);

            const valuation = result.rows.map(row => ({
                name: row.name,
                stock: Number(row.stock_at_time),
                value: Number(row.value_at_time)
            }));

            const totalValue = valuation.reduce((sum, v) => sum + v.value, 0);

            return { success: true, valuation, totalValue, date };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Valuation History Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * GL coverage: paid storefront / restaurant orders missing journal pointers.
 */
export async function getGlCoverageSnapshotAction(businessId) {
    let client;
    try {
        client = await pool.connect();
        await checkAuth(businessId, client, 'finance.view_reports', 'basic_reports');
        try {
            const sf = await client.query(
                `SELECT
                   COUNT(*) FILTER (
                     WHERE payment_status = 'paid'
                       AND (metadata->'reconciliation'->>'journal_entry_id') IS NULL
                   )::int AS pending_count,
                   COALESCE(SUM(total_amount) FILTER (
                     WHERE payment_status = 'paid'
                       AND (metadata->'reconciliation'->>'journal_entry_id') IS NULL
                   ), 0)::float AS pending_amount
                 FROM storefront_orders
                 WHERE business_id = $1`,
                [businessId]
            );

            const rest = await client.query(
                `SELECT COUNT(*)::int AS unpaid_gl_count,
                        COALESCE(SUM(total_amount), 0)::float AS unpaid_gl_amount
                 FROM restaurant_orders ro
                 WHERE ro.business_id = $1
                   AND ro.payment_status = 'paid'
                   AND NOT EXISTS (
                     SELECT 1 FROM journal_entries je
                     WHERE je.business_id = ro.business_id
                       AND je.description LIKE '%[ref:restaurant_order:' || ro.id::text || ']%'
                   )`,
                [businessId]
            );

            return {
                success: true,
                coverage: {
                    storefrontPending: sf.rows[0]?.pending_count || 0,
                    storefrontPendingAmount: Number(sf.rows[0]?.pending_amount || 0),
                    restaurantMissingGl: rest.rows[0]?.unpaid_gl_count || 0,
                    restaurantMissingAmount: Number(rest.rows[0]?.unpaid_gl_amount || 0),
                },
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('GL coverage snapshot error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Batch-reconcile paid storefront orders missing GL (hub Overview action).
 */
export async function reconcilePendingStorefrontGlAction(businessId) {
    try {
        await checkAuth(businessId, null, 'finance.view_reports', 'basic_reports');
        const result = await autoReconcilePendingOrders(businessId);
        return { success: true, ...result };
    } catch (error) {
        console.error('Reconcile pending storefront GL error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Indirect cash flow from GL: net income + working capital deltas + cash account change.
 */
export async function getCashFlowAction(businessId, startDate, endDate) {
    let client;
    try {
        client = await pool.connect();
        await checkAuth(businessId, client, 'finance.view_reports', 'basic_reports');
        try {
            const plQ = await client.query(
                `SELECT
                   COALESCE(SUM(CASE WHEN LOWER(a.type) IN ('income', 'revenue') THEN (e.credit - e.debit) ELSE 0 END), 0) as income,
                   COALESCE(SUM(CASE WHEN LOWER(a.type) = 'expense' THEN (e.debit - e.credit) ELSE 0 END), 0) as expense
                 FROM gl_accounts a
                 LEFT JOIN gl_entries e ON a.id = e.account_id AND e.business_id = $1
                   AND e.transaction_date >= $2::date AND e.transaction_date <= $3::date
                 WHERE a.business_id = $1 AND LOWER(a.type) IN ('income', 'revenue', 'expense')`,
                [businessId, startDate, endDate]
            );
            const netIncome = Number(plQ.rows[0]?.income || 0) - Number(plQ.rows[0]?.expense || 0);

            const startAsOf = startDate;
            const endAsOf = endDate;

            const balanceAt = async (asOf, codes, inclusive = true) => {
                const r = await client.query(
                    `SELECT a.code,
                            CASE WHEN LOWER(a.type) = 'asset'
                              THEN COALESCE(SUM(e.debit - e.credit), 0)
                              ELSE COALESCE(SUM(e.credit - e.debit), 0)
                            END AS balance
                     FROM gl_accounts a
                     LEFT JOIN gl_entries e ON e.account_id = a.id AND e.business_id = $1
                       AND (
                         ($4::boolean = true AND e.transaction_date <= $2::date)
                         OR ($4::boolean = false AND e.transaction_date < $2::date)
                       )
                     WHERE a.business_id = $1 AND a.code = ANY($3::text[])
                     GROUP BY a.code, a.type`,
                    [businessId, asOf, codes, inclusive]
                );
                const map = {};
                for (const row of r.rows) map[row.code] = Number(row.balance);
                return map;
            };

            const wcCodes = [
                ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
                ACCOUNT_CODES.INVENTORY_ASSET,
                ACCOUNT_CODES.ACCOUNTS_PAYABLE,
                ACCOUNT_CODES.SALES_TAX_PAYABLE,
            ];
            const cashCodes = [
                ACCOUNT_CODES.CASH_ON_HAND,
                ACCOUNT_CODES.PETTY_CASH,
                ACCOUNT_CODES.BANK_ACCOUNTS,
            ];

            const [startWc, endWc, startCash, endCash] = await Promise.all([
                balanceAt(startAsOf, wcCodes, false),
                balanceAt(endAsOf, wcCodes, true),
                balanceAt(startAsOf, cashCodes, false),
                balanceAt(endAsOf, cashCodes, true),
            ]);

            const delta = (code) => (endWc[code] || 0) - (startWc[code] || 0);
            // Asset increase = use of cash (-); liability increase = source (+)
            const arChange = -delta(ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);
            const invChange = -delta(ACCOUNT_CODES.INVENTORY_ASSET);
            const apChange = delta(ACCOUNT_CODES.ACCOUNTS_PAYABLE);
            const taxChange = delta(ACCOUNT_CODES.SALES_TAX_PAYABLE);

            const operatingCash = netIncome + arChange + invChange + apChange + taxChange;
            const openingCash = cashCodes.reduce((s, c) => s + (startCash[c] || 0), 0);
            const closingCash = cashCodes.reduce((s, c) => s + (endCash[c] || 0), 0);
            const netChangeInCash = closingCash - openingCash;
            // Plug investing/financing as residual so statement ties to cash movement
            const residual = netChangeInCash - operatingCash;

            return {
                success: true,
                meta: {
                    periodFrom: startDate,
                    periodTo: endDate,
                    generatedAt: new Date().toISOString(),
                },
                statement: {
                    netIncome,
                    adjustments: {
                        accountsReceivable: arChange,
                        inventory: invChange,
                        accountsPayable: apChange,
                        taxPayable: taxChange,
                    },
                    operatingCashFlow: operatingCash,
                    investingFinancingNet: residual,
                    netChangeInCash,
                    openingCash,
                    closingCash,
                },
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Cash Flow Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Day book: posted journals for a single calendar date (or range).
 */
export async function getDayBookAction(businessId, startDate, endDate = null) {
    let client;
    try {
        client = await pool.connect();
        await checkAuth(businessId, client, 'finance.view_reports', 'basic_reports');
        try {
            const toDate = endDate || startDate;
            const result = await client.query(
                `SELECT
                   je.id AS journal_id,
                   je.journal_number,
                   je.transaction_date,
                   je.description,
                   je.reference_type,
                   je.status,
                   a.code AS account_code,
                   a.name AS account_name,
                   e.debit,
                   e.credit
                 FROM journal_entries je
                 JOIN gl_entries e ON e.journal_id = je.id AND e.business_id = je.business_id
                 JOIN gl_accounts a ON a.id = e.account_id
                 WHERE je.business_id = $1
                   AND je.status = 'posted'
                   AND je.transaction_date >= $2::date
                   AND je.transaction_date <= $3::date
                 ORDER BY je.transaction_date ASC, je.journal_number ASC, a.code ASC`,
                [businessId, startDate, toDate]
            );

            const rows = result.rows.map((r) => ({
                journalId: r.journal_id,
                journalNumber: r.journal_number,
                date: r.transaction_date,
                description: r.description,
                referenceType: r.reference_type,
                accountCode: r.account_code,
                accountName: r.account_name,
                debit: Number(r.debit || 0),
                credit: Number(r.credit || 0),
            }));

            const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
            const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

            return {
                success: true,
                meta: {
                    periodFrom: startDate,
                    periodTo: toDate,
                    generatedAt: new Date().toISOString(),
                },
                rows,
                totals: {
                    debit: totalDebit,
                    credit: totalCredit,
                    balanced: Math.abs(totalDebit - totalCredit) < 0.01,
                },
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Day Book Error:', error);
        return { success: false, error: error.message };
    }
}
