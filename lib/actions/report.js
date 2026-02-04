'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

// Helper to check auth and business access
async function checkAuth(businessId) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Unauthorized');
    if (businessId) {
        await verifyBusinessAccess(session.user.id, businessId);
    }
    return session;
}

/**
 * Server Action: Get Trial Balance
 * Aggregates all GL entries by account to show total debit, credit and net balance.
 */
export async function getTrialBalanceAction(businessId, asOfDate = new Date().toISOString()) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // Aggregate entries by account
            const result = await client.query(`
                SELECT 
                    a.id, a.code, a.name, a.type,
                    COALESCE(SUM(e.debit), 0) as total_debit,
                    COALESCE(SUM(e.credit), 0) as total_credit
                FROM gl_accounts a
                LEFT JOIN gl_entries e ON a.id = e.account_id AND e.transaction_date <= $2
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
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // Fetch relevant accounts and their movements within the period
            const result = await client.query(`
                SELECT 
                    a.id, a.code, a.name, a.type,
                    COALESCE(SUM(e.credit - e.debit), 0) as balance 
                FROM gl_accounts a
                LEFT JOIN gl_entries e ON a.id = e.account_id 
                    AND e.transaction_date >= $2 
                    AND e.transaction_date <= $3
                WHERE a.business_id = $1 
                  AND a.type IN ('income', 'expense')
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
            const incomeAccounts = accounts.filter(a => a.type === 'income').map(a => ({
                ...a,
                amount: a.balance // Positive for revenue
            }));

            // Expenses: Separate COGS (5000) from normal expenses
            const allExpenses = accounts.filter(a => a.type === 'expense');

            const cogsAccounts = allExpenses.filter(a => a.code === '5000').map(a => ({
                ...a,
                amount: -a.balance
            }));

            const otherExpenseAccounts = allExpenses.filter(a => a.code !== '5000').map(a => ({
                ...a,
                amount: -a.balance
            }));

            const totalIncome = incomeAccounts.reduce((sum, a) => sum + a.amount, 0);
            const totalCOGS = cogsAccounts.reduce((sum, a) => sum + a.amount, 0);
            const grossProfit = totalIncome - totalCOGS;
            const totalOtherExpense = otherExpenseAccounts.reduce((sum, a) => sum + a.amount, 0);
            const netIncome = grossProfit - totalOtherExpense;

            return {
                success: true,
                statement: {
                    income: incomeAccounts,
                    cogs: cogsAccounts,
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
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // 1. Calculate Net Income (Retained Earnings) up to AsOfDate (All time)
            // Revenue (Cr) - Expenses (Dr)
            const retainedEarningsRes = await client.query(`
                SELECT 
                    COALESCE(SUM(CASE WHEN a.type = 'income' THEN (e.credit - e.debit) ELSE 0 END), 0) as total_income,
                    COALESCE(SUM(CASE WHEN a.type = 'expense' THEN (e.debit - e.credit) ELSE 0 END), 0) as total_expense
                FROM gl_accounts a
                LEFT JOIN gl_entries e ON a.id = e.account_id AND e.transaction_date <= $2
                WHERE a.business_id = $1 AND a.type IN ('income', 'expense')
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
                LEFT JOIN gl_entries e ON a.id = e.account_id AND e.transaction_date <= $2
                WHERE a.business_id = $1 
                  AND a.type IN ('asset', 'liability', 'equity')
                GROUP BY a.id, a.code, a.name, a.type
                ORDER BY a.code ASC
            `, [businessId, asOfDate]);

            const accounts = result.rows.map(row => {
                const debit = parseFloat(row.total_debit);
                const credit = parseFloat(row.total_credit);
                let balance = 0;

                // Asset: Debit - Credit
                // Liability/Equity: Credit - Debit
                if (row.type === 'asset') {
                    balance = debit - credit;
                } else {
                    balance = credit - debit;
                }

                return { ...row, balance };
            });

            const assets = accounts.filter(a => a.type === 'asset');
            const liabilities = accounts.filter(a => a.type === 'liability');
            const equity = accounts.filter(a => a.type === 'equity');

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
export async function getAccountingSummaryAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // 1. Get Balances for key account categories/codes
            const result = await client.query(`
                SELECT 
                    a.code, a.type,
                    COALESCE(SUM(e.debit), 0) as total_debit,
                    COALESCE(SUM(e.credit), 0) as total_credit
                FROM gl_accounts a
                LEFT JOIN gl_entries e ON a.id = e.account_id
                WHERE a.business_id = $1
                GROUP BY a.code, a.type
            `, [businessId]);

            const rows = result.rows;

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
                const matches = rows.filter(r => r.type === type);
                return matches.reduce((sum, match) => {
                    const debits = parseFloat(match.total_debit);
                    const credits = parseFloat(match.total_credit);
                    if (['asset', 'expense'].includes(type.toLowerCase())) return sum + (debits - credits);
                    return sum + (credits - debits);
                }, 0);
            };

            // Calculate Metrics
            const accountsReceivable = getNetForCode('1100');
            const accountsPayable = getNetForCode('2001');
            const inventoryValue = getNetForCode('1200');

            const totalRevenue = getNetForType('income');
            const totalCOGS = getNetForCode('5000');
            const grossProfit = totalRevenue - totalCOGS;

            return {
                success: true,
                summary: {
                    accountsReceivable,
                    accountsPayable,
                    inventoryValue,
                    totalRevenue,
                    totalCOGS,
                    grossProfit,
                    margin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
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
