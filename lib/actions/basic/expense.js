'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { createGLEntryAction } from '@/lib/actions/basic/accounting';
import { ACCOUNT_CODES, EXPENSE_CATEGORIES } from '@/lib/config/accounting';

/**
 * Authentication helper
 */
async function checkAuth(businessId, client = null) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');
    if (businessId) {
        await verifyBusinessAccess(session.user.id, businessId, [], client);
    }
    return session;
}

/**
 * Generate sequential expense number for a business
 * @param {import('pg').PoolClient} client
 * @param {string} businessId
 * @returns {Promise<string>}
 */
async function generateExpenseNumber(client, businessId) {
    const result = await client.query(
        `SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(expense_number, '[^0-9]', '', 'g'), '') AS INTEGER)), 0) + 1 AS next_num
         FROM expenses WHERE business_id = $1`,
        [businessId]
    );
    return `EXP-${String(result.rows[0].next_num).padStart(6, '0')}`;
}

/**
 * Server Action: Create an expense with automatic GL posting
 * Debit: Expense Account (category-driven)
 * Credit: Cash/Bank/AP (based on payment method)
 * 
 * @param {Object} data - Expense data
 * @param {string} data.businessId - Business UUID
 * @param {string} data.accountId - GL Account UUID for the expense
 * @param {string} [data.category] - Expense category
 * @param {number} data.amount - Expense amount
 * @param {number} [data.taxAmount] - Tax amount (included in total)
 * @param {string} [data.vendorId] - Vendor UUID
 * @param {string} [data.paymentMethod] - 'cash', 'bank', 'credit' (on account)
 * @param {string} data.date - Expense date
 * @param {string} [data.description] - Description
 * @param {string} [data.receiptUrl] - Receipt attachment URL
 * @returns {Promise<{success: boolean, expense?: Object, error?: string}>}
 */
export async function createExpenseAction(data) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(data.businessId, client);
        await client.query('BEGIN');

        const expenseNumber = await generateExpenseNumber(client, data.businessId);

        // ── Create expense record ──
        const result = await client.query(`
            INSERT INTO expenses (
                business_id, expense_number, account_id, category,
                amount, tax_amount, vendor_id, payment_method,
                date, description, receipt_url, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        `, [
            data.businessId,
            expenseNumber,
            data.accountId,
            data.category || null,
            data.amount,
            data.taxAmount || 0,
            data.vendorId || null,
            data.paymentMethod || 'cash',
            data.date,
            data.description || null,
            data.receiptUrl || null,
            'recorded'
        ]);

        const expense = result.rows[0];

        // ── Determine credit account based on payment method ──
        let creditAccountCode;
        switch (data.paymentMethod) {
            case 'bank':
                creditAccountCode = ACCOUNT_CODES.BANK_ACCOUNTS;
                break;
            case 'credit':
                creditAccountCode = ACCOUNT_CODES.ACCOUNTS_PAYABLE;
                break;
            case 'cash':
            default:
                creditAccountCode = ACCOUNT_CODES.CASH_ON_HAND;
                break;
        }

        // ── Get the debit account code from the selected GL account ──
        const accountRes = await client.query(
            'SELECT code FROM gl_accounts WHERE id = $1 AND business_id = $2',
            [data.accountId, data.businessId]
        );
        if (accountRes.rows.length === 0) {
            throw new Error('Selected expense account not found');
        }
        const debitAccountCode = accountRes.rows[0].code;

        // ── Build GL entries ──
        const glEntries = [
            { accountCode: debitAccountCode, debit: parseFloat(expense.amount), credit: 0 }
        ];

        // If tax amount exists, add separate tax entry
        const totalAmount = parseFloat(expense.amount);
        const taxAmount = parseFloat(expense.tax_amount || 0);

        if (taxAmount > 0) {
            // The expense amount is inclusive of tax
            const netAmount = totalAmount - taxAmount;
            glEntries[0].debit = netAmount;
            glEntries.push(
                { accountCode: ACCOUNT_CODES.INPUT_TAX_CREDIT, debit: taxAmount, credit: 0 }
            );
        }

        // Credit side
        glEntries.push(
            { accountCode: creditAccountCode, debit: 0, credit: totalAmount }
        );

        // ── Post GL entries (creates journal automatically) ──
        await createGLEntryAction({
            businessId: data.businessId,
            date: data.date,
            description: `Expense: ${data.description || data.category || expenseNumber}`,
            referenceType: 'expense',
            referenceId: expense.id,
            createdBy: session.user.id,
            entries: glEntries
        }, client);

        // Update vendor outstanding balance if on credit
        if (data.paymentMethod === 'credit' && data.vendorId) {
            await client.query(
                `UPDATE vendors SET outstanding_balance = outstanding_balance + $1, updated_at = NOW() WHERE id = $2`,
                [totalAmount, data.vendorId]
            );
        }

        await client.query('COMMIT');
        return { success: true, expense };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create expense error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Get expenses for a business
 * 
 * @param {string} businessId
 * @param {Object} [filters]
 * @param {string} [filters.category]
 * @param {string} [filters.vendorId]
 * @param {string} [filters.dateFrom]
 * @param {string} [filters.dateTo]
 * @param {string} [filters.status]
 * @param {number} [filters.limit]
 * @param {number} [filters.offset]
 * @returns {Promise<{success: boolean, expenses?: Object[], total?: number, error?: string}>}
 */
export async function getExpensesAction(businessId, filters = {}) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);

        let query = `
            SELECT 
                e.*,
                ga.code as account_code,
                ga.name as account_name,
                v.name as vendor_name
            FROM expenses e
            LEFT JOIN gl_accounts ga ON e.account_id = ga.id
            LEFT JOIN vendors v ON e.vendor_id = v.id
            WHERE e.business_id = $1 AND e.is_deleted = false
        `;
        const params = [businessId];
        let paramIndex = 2;

        if (filters.category) {
            query += ` AND e.category = $${paramIndex}`;
            params.push(filters.category);
            paramIndex++;
        }

        if (filters.vendorId) {
            query += ` AND e.vendor_id = $${paramIndex}`;
            params.push(filters.vendorId);
            paramIndex++;
        }

        if (filters.dateFrom) {
            query += ` AND e.date >= $${paramIndex}`;
            params.push(filters.dateFrom);
            paramIndex++;
        }

        if (filters.dateTo) {
            query += ` AND e.date <= $${paramIndex}`;
            params.push(filters.dateTo);
            paramIndex++;
        }

        if (filters.status) {
            query += ` AND e.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        // Get total count
        const countQuery = query.replace(
            /SELECT\s+[\s\S]*?\s+FROM/i,
            'SELECT COUNT(*) as total FROM'
        );
        const countResult = await client.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total, 10);

        // Add pagination and ordering
        query += ` ORDER BY e.date DESC, e.created_at DESC`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(filters.limit || 50, filters.offset || 0);

        const result = await client.query(query, params);

        return { success: true, expenses: result.rows, total };
    } catch (error) {
        console.error('Get expenses error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Get expense summary by category
 * 
 * @param {string} businessId
 * @param {string} [startDate]
 * @param {string} [endDate]
 * @returns {Promise<{success: boolean, summary?: Object[], total?: number, error?: string}>}
 */
export async function getExpenseSummaryAction(businessId, startDate, endDate) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);

        let query = `
            SELECT 
                e.category,
                COUNT(*)::int as count,
                SUM(e.amount)::numeric as total_amount,
                SUM(e.tax_amount)::numeric as total_tax
            FROM expenses e
            WHERE e.business_id = $1 AND e.is_deleted = false
        `;
        const params = [businessId];
        let paramIndex = 2;

        if (startDate) {
            query += ` AND e.date >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            query += ` AND e.date <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        query += ` GROUP BY e.category ORDER BY total_amount DESC`;

        const result = await client.query(query, params);

        const total = result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);

        return { success: true, summary: result.rows, total: Math.round(total * 100) / 100 };
    } catch (error) {
        console.error('Get expense summary error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Delete (soft) an expense and reverse GL entries
 * 
 * @param {string} businessId
 * @param {string} expenseId
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export async function deleteExpenseAction(businessId, expenseId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);
        await client.query('BEGIN');

        // Get expense to check ownership
        const expRes = await client.query(
            'SELECT * FROM expenses WHERE id = $1 AND business_id = $2 AND is_deleted = false',
            [expenseId, businessId]
        );
        if (expRes.rows.length === 0) {
            throw new Error('Expense not found');
        }

        const expense = expRes.rows[0];

        // Soft-delete the expense
        await client.query(
            'UPDATE expenses SET is_deleted = true, deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
            [expenseId]
        );

        // Delete corresponding GL entries (and journal)
        const journalRes = await client.query(
            `SELECT DISTINCT ge.journal_id FROM gl_entries ge
             WHERE ge.reference_type = 'expense' AND ge.reference_id = $1`,
            [expenseId]
        );

        for (const row of journalRes.rows) {
            if (row.journal_id) {
                await client.query('DELETE FROM gl_entries WHERE journal_id = $1', [row.journal_id]);
                await client.query('DELETE FROM journal_entries WHERE id = $1', [row.journal_id]);
            }
        }

        // Reverse vendor outstanding if was on credit
        if (expense.payment_method === 'credit' && expense.vendor_id) {
            await client.query(
                `UPDATE vendors SET outstanding_balance = outstanding_balance - $1, updated_at = NOW() WHERE id = $2`,
                [expense.amount, expense.vendor_id]
            );
        }

        await client.query('COMMIT');
        return { success: true, message: 'Expense deleted and GL reversed' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete expense error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}
