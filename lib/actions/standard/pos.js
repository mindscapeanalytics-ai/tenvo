'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { createGLEntryAction } from '@/lib/actions/basic/accounting';
import { ACCOUNT_CODES } from '@/lib/config/accounting';

async function checkAuth(businessId, client = null) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Unauthorized');
    if (businessId) await verifyBusinessAccess(session.user.id, businessId, [], client);
    return session;
}

// ─── Terminal Management ────────────────────────────────────────────────────

/**
 * Register a POS terminal
 */
export async function createPosTerminalAction(data) {
    const client = await pool.connect();
    try {
        await checkAuth(data.businessId, client);

        const result = await client.query(`
            INSERT INTO pos_terminals (business_id, terminal_name, terminal_code, warehouse_id, is_active)
            VALUES ($1, $2, $3, $4, true) RETURNING *
        `, [data.businessId, data.terminalName, data.terminalCode, data.warehouseId || null]);

        return { success: true, terminal: result.rows[0] };
    } catch (error) {
        console.error('Create POS terminal error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get all POS terminals for a business
 */
export async function getPosTerminalsAction(businessId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);
        const result = await client.query(
            `SELECT pt.*, wl.name as warehouse_name 
             FROM pos_terminals pt
             LEFT JOIN warehouse_locations wl ON pt.warehouse_id = wl.id
             WHERE pt.business_id = $1 ORDER BY pt.created_at DESC`,
            [businessId]
        );
        return { success: true, terminals: result.rows };
    } catch (error) {
        console.error('Get POS terminals error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

// ─── Session Management ─────────────────────────────────────────────────────

/**
 * Open a POS session (shift)
 */
export async function openPosSessionAction(data) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(data.businessId, client);

        // Check no open session exists for this terminal
        const existing = await client.query(
            `SELECT id FROM pos_sessions WHERE terminal_id = $1 AND status = 'open'`,
            [data.terminalId]
        );
        if (existing.rows.length > 0) {
            throw new Error('Terminal already has an open session. Close it first.');
        }

        const result = await client.query(`
            INSERT INTO pos_sessions (business_id, terminal_id, opened_by, opening_cash, status)
            VALUES ($1, $2, $3, $4, 'open') RETURNING *
        `, [data.businessId, data.terminalId, session.user.id, data.openingCash || 0]);

        return { success: true, session: result.rows[0] };
    } catch (error) {
        console.error('Open POS session error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Close a POS session with cash reconciliation
 */
export async function closePosSessionAction(data) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(data.businessId, client);
        await client.query('BEGIN');

        // Get session details
        const sesRes = await client.query(
            `SELECT * FROM pos_sessions WHERE id = $1 AND business_id = $2 AND status = 'open'`,
            [data.sessionId, data.businessId]
        );
        if (sesRes.rows.length === 0) throw new Error('Open session not found');

        // Calculate expected cash from transactions
        const txRes = await client.query(`
            SELECT 
                COALESCE(SUM(pp.amount) FILTER (WHERE pp.method = 'cash'), 0)::numeric as total_cash,
                COALESCE(SUM(pp.amount) FILTER (WHERE pp.method = 'card'), 0)::numeric as total_card,
                COALESCE(SUM(pp.amount) FILTER (WHERE pp.method NOT IN ('cash','card')), 0)::numeric as total_other,
                COUNT(DISTINCT pt.id)::int as transaction_count
            FROM pos_transactions pt
            JOIN pos_payments pp ON pp.transaction_id = pt.id
            WHERE pt.session_id = $1
        `, [data.sessionId]);

        const stats = txRes.rows[0];
        const openingCash = parseFloat(sesRes.rows[0].opening_cash || 0);
        const expectedCash = openingCash + parseFloat(stats.total_cash);
        const closingCash = parseFloat(data.closingCash || 0);
        const cashDifference = closingCash - expectedCash;

        // Close the session
        await client.query(`
            UPDATE pos_sessions SET
                status = 'closed',
                closed_by = $1,
                closed_at = NOW(),
                closing_cash = $2,
                expected_cash = $3,
                cash_difference = $4,
                total_sales = $5,
                transaction_count = $6
            WHERE id = $7
        `, [
            session.user.id,
            closingCash,
            expectedCash,
            cashDifference,
            parseFloat(stats.total_cash) + parseFloat(stats.total_card) + parseFloat(stats.total_other),
            stats.transaction_count,
            data.sessionId
        ]);

        await client.query('COMMIT');
        return {
            success: true,
            summary: {
                opening_cash: openingCash,
                total_cash_sales: parseFloat(stats.total_cash),
                total_card_sales: parseFloat(stats.total_card),
                total_other_sales: parseFloat(stats.total_other),
                expected_cash: expectedCash,
                closing_cash: closingCash,
                cash_difference: cashDifference,
                transaction_count: stats.transaction_count,
            }
        };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Close POS session error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

// ─── Transaction Processing ─────────────────────────────────────────────────

/**
 * Create a POS transaction (checkout)
 * Creates the transaction, items, payments, updates stock, and posts GL entries.
 */
export async function createPosTransactionAction(data) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(data.businessId, client);
        await client.query('BEGIN');

        // Validate session is open
        const sesCheck = await client.query(
            'SELECT id FROM pos_sessions WHERE id = $1 AND status = \'open\'',
            [data.sessionId]
        );
        if (sesCheck.rows.length === 0) throw new Error('POS session is not open');

        // Generate transaction number
        const numRes = await client.query(
            `SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(transaction_number, '[^0-9]', '', 'g'), '') AS INTEGER)), 0) + 1 AS n
             FROM pos_transactions WHERE business_id = $1`, [data.businessId]
        );
        const txNumber = `POS-${String(numRes.rows[0].n).padStart(6, '0')}`;

        // Calculate totals
        let subtotal = 0, totalTax = 0, totalDiscount = 0;
        for (const item of data.items) {
            const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
            const lineTax = lineTotal * ((item.taxPercent || 0) / 100);
            const lineDiscount = item.discountAmount || 0;
            subtotal += lineTotal;
            totalTax += lineTax;
            totalDiscount += lineDiscount;
        }
        const grandTotal = Math.round((subtotal + totalTax - totalDiscount) * 100) / 100;

        // Create transaction
        const txResult = await client.query(`
            INSERT INTO pos_transactions (
                business_id, session_id, transaction_number, customer_id,
                subtotal, tax_amount, discount_amount, total_amount, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed')
            RETURNING *
        `, [data.businessId, data.sessionId, txNumber,
        data.customerId || null, subtotal, totalTax, totalDiscount, grandTotal]);

        const transaction = txResult.rows[0];

        // Create transaction items
        for (const item of data.items) {
            const lineTotal = (item.quantity || 1) * (item.unitPrice || 0);
            const lineTax = lineTotal * ((item.taxPercent || 0) / 100);

            await client.query(`
                INSERT INTO pos_transaction_items (
                    transaction_id, product_id, product_name, quantity,
                    unit_price, tax_amount, discount_amount, line_total
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                transaction.id, item.productId, item.productName,
                item.quantity || 1, item.unitPrice, lineTax,
                item.discountAmount || 0, lineTotal + lineTax - (item.discountAmount || 0)
            ]);

            // Deduct stock
            if (item.productId) {
                await client.query(
                    `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2`,
                    [item.quantity || 1, item.productId]
                );
            }
        }

        // Create payments
        for (const payment of data.payments) {
            await client.query(`
                INSERT INTO pos_payments (transaction_id, method, amount, reference)
                VALUES ($1, $2, $3, $4)
            `, [transaction.id, payment.method, payment.amount, payment.reference || null]);
        }

        // GL entries: Debit Cash/Bank, Credit Sales Revenue + Tax
        const glEntries = [];
        const cashAmount = data.payments
            .filter(p => p.method === 'cash')
            .reduce((s, p) => s + parseFloat(p.amount), 0);
        const cardAmount = data.payments
            .filter(p => p.method === 'card')
            .reduce((s, p) => s + parseFloat(p.amount), 0);

        if (cashAmount > 0) {
            glEntries.push({ accountCode: ACCOUNT_CODES.CASH_ON_HAND, debit: cashAmount, credit: 0 });
        }
        if (cardAmount > 0) {
            glEntries.push({ accountCode: ACCOUNT_CODES.BANK_ACCOUNTS, debit: cardAmount, credit: 0 });
        }

        glEntries.push({ accountCode: ACCOUNT_CODES.SALES_REVENUE, debit: 0, credit: subtotal - totalDiscount });
        if (totalTax > 0) {
            glEntries.push({ accountCode: ACCOUNT_CODES.SALES_TAX_PAYABLE, debit: 0, credit: totalTax });
        }

        await createGLEntryAction({
            businessId: data.businessId,
            date: new Date(),
            description: `POS Sale: ${txNumber}`,
            referenceType: 'pos_transaction',
            referenceId: transaction.id,
            createdBy: session.user.id,
            entries: glEntries,
        }, client);

        await client.query('COMMIT');
        return { success: true, transaction };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('POS transaction error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get POS session summary (end-of-day report)
 */
export async function getPosSessionSummaryAction(businessId, sessionId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);

        const result = await client.query(`
            SELECT 
                ps.*,
                pt.terminal_name,
                u_open.name as opened_by_name,
                u_close.name as closed_by_name,
                (SELECT COUNT(*)::int FROM pos_transactions WHERE session_id = ps.id) as tx_count,
                (SELECT COALESCE(SUM(total_amount), 0)::numeric FROM pos_transactions WHERE session_id = ps.id) as total_revenue,
                (SELECT json_agg(json_build_object(
                    'method', pp.method,
                    'total', SUM(pp.amount)::numeric,
                    'count', COUNT(*)::int
                )) FROM pos_payments pp
                JOIN pos_transactions ptx ON pp.transaction_id = ptx.id
                WHERE ptx.session_id = ps.id
                GROUP BY pp.method) as payment_breakdown
            FROM pos_sessions ps
            JOIN pos_terminals pt ON ps.terminal_id = pt.id
            LEFT JOIN "user" u_open ON ps.opened_by = u_open.id
            LEFT JOIN "user" u_close ON ps.closed_by = u_close.id
            WHERE ps.id = $1 AND ps.business_id = $2
        `, [sessionId, businessId]);

        if (result.rows.length === 0) return { success: false, error: 'Session not found' };
        return { success: true, summary: result.rows[0] };
    } catch (error) {
        console.error('Get POS summary error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}
