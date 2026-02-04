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
 * Server Action: Create GL Entry
 */
export async function createGLEntryAction(params, txClient = null) {
    const {
        businessId,
        referenceId,
        referenceType,
        description,
        date = new Date().toISOString(),
        entries = []
    } = params;

    await checkAuth(businessId);

    const client = txClient || await pool.connect();
    const shouldManageTransaction = !txClient;

    try {
        if (shouldManageTransaction) await client.query('BEGIN');

        // 1. Validate Balance
        const totalDebit = entries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0);
        const totalCredit = entries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`GL Entry Unbalanced: Debit (${totalDebit}) !== Credit (${totalCredit})`);
        }

        // 2. Process Entries
        const processedEntries = [];
        for (const entry of entries) {
            let accountId = entry.accountId;

            if (!accountId && entry.accountCode) {
                // Find account by code
                const res = await client.query(`
                    SELECT id FROM gl_accounts 
                    WHERE business_id = $1 AND code = $2
                `, [businessId, entry.accountCode]);

                if (res.rows.length > 0) {
                    accountId = res.rows[0].id;
                } else {
                    throw new Error(`Account code not found: ${entry.accountCode}`);
                }
            }

            if (!accountId) throw new Error('Invalid account ID in GL Entry');

            processedEntries.push([
                businessId,
                date,
                referenceId,
                referenceType,
                description,
                accountId,
                entry.debit || 0,
                entry.credit || 0
            ]);
        }

        // 3. Insert Entries via UNNEST for bulk insert efficiency in pg
        // Constructing bulk insert query manually or loop? Loop is easier to read for now unless huge volume.
        for (const entryValues of processedEntries) {
            await client.query(`
                INSERT INTO gl_entries (
                    business_id, transaction_date, reference_id, reference_type, 
                    description, account_id, debit, credit
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, entryValues);
        }

        if (shouldManageTransaction) await client.query('COMMIT');
        return { success: true };

    } catch (error) {
        if (shouldManageTransaction) await client.query('ROLLBACK');
        console.error('Accounting Entry Error:', error);
        return { success: false, error: error.message };
    } finally {
        if (shouldManageTransaction) client.release();
    }
}

/**
 * Server Action: Get Account Balance
 */
export async function getAccountBalanceAction(businessId, accountCode) {
    await checkAuth(businessId);
    const client = await pool.connect();
    try {
        // Get Account
        const accRes = await client.query(`
            SELECT id, type FROM gl_accounts 
            WHERE business_id = $1 AND code = $2
        `, [businessId, accountCode]);

        if (accRes.rows.length === 0) return 0;
        const account = accRes.rows[0];

        // Sum Entries
        const sumRes = await client.query(`
            SELECT SUM(debit) as total_debit, SUM(credit) as total_credit 
            FROM gl_entries 
            WHERE account_id = $1
        `, [account.id]);

        const totalDebit = Number(sumRes.rows[0].total_debit) || 0;
        const totalCredit = Number(sumRes.rows[0].total_credit) || 0;

        if (['asset', 'expense'].includes(account.type.toLowerCase())) {
            return totalDebit - totalCredit;
        } else {
            return totalCredit - totalDebit;
        }

    } catch (error) {
        console.error('Get Account Balance Error:', error);
        throw error;
    } finally {
        client.release();
    }
}

import { DEFAULT_COA } from '@/lib/config/accounting';

/**
 * Server Action: Initialize COA
 */
export async function initializeCOAAction(businessId, defaultCOA = DEFAULT_COA) {
    await checkAuth(businessId);
    const client = await pool.connect();
    try {
        for (const acc of defaultCOA) {
            const check = await client.query(`
                SELECT id FROM gl_accounts WHERE business_id = $1 AND code = $2
            `, [businessId, acc.code]);

            if (check.rows.length === 0) {
                await client.query(`
                    INSERT INTO gl_accounts (business_id, code, name, type, is_system)
                    VALUES ($1, $2, $3, $4, true)
                `, [businessId, acc.code, acc.name, acc.type]);
            }
        }
        return { success: true };
    } catch (error) {
        console.error('Init COA Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Get Chart of Accounts
 */
export async function getGLAccountsAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT * FROM gl_accounts
                WHERE business_id = $1
                ORDER BY code ASC
            `, [businessId]);
            return { success: true, accounts: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get GL Accounts Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get GL Entries (Ledger Report)
 */
export async function getGLEntriesAction(businessId, params = {}) {
    try {
        await checkAuth(businessId);
        const { startDate, endDate, accountId } = params;
        const client = await pool.connect();
        try {
            let query = `
                SELECT 
                    e.*,
                    a.code as account_code,
                    a.name as account_name,
                    a.type as account_type
                FROM gl_entries e
                LEFT JOIN gl_accounts a ON e.account_id = a.id
                WHERE e.business_id = $1
            `;
            const queryParams = [businessId];
            let paramCounter = 2;

            if (startDate) {
                query += ` AND e.transaction_date >= $${paramCounter}`;
                queryParams.push(startDate);
                paramCounter++;
            }

            if (endDate) {
                query += ` AND e.transaction_date <= $${paramCounter}`;
                queryParams.push(endDate);
                paramCounter++;
            }

            if (accountId && accountId !== 'all') {
                query += ` AND e.account_id = $${paramCounter}`;
                queryParams.push(accountId);
                paramCounter++;
            }

            query += ` ORDER BY e.transaction_date ASC, e.created_at ASC`;

            const result = await client.query(query, queryParams);

            // Shape data to include nested account object if needed or map flat
            const entries = result.rows.map(row => ({
                ...row,
                account: {
                    code: row.account_code,
                    name: row.account_name,
                    type: row.account_type
                }
            }));

            return { success: true, entries };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get GL Entries Error:', error);
        return { success: false, error: error.message };
    }
}
