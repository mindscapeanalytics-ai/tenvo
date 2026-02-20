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

/**
 * Process a POS refund (full or partial) with stock reversal + GL entries
 */
export async function refundPosTransactionAction(data) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(data.businessId, client);
        await client.query('BEGIN');

        // Validate original transaction
        const txRes = await client.query(
            `SELECT * FROM pos_transactions WHERE id = $1 AND business_id = $2`,
            [data.transactionId, data.businessId]
        );
        if (txRes.rows.length === 0) throw new Error('Transaction not found');
        const originalTx = txRes.rows[0];

        // Check for existing refund total
        const existingRefunds = await client.query(
            `SELECT COALESCE(SUM(total_amount), 0)::numeric as total_refunded
             FROM pos_refunds WHERE transaction_id = $1 AND status = 'completed'`,
            [data.transactionId]
        );
        const alreadyRefunded = parseFloat(existingRefunds.rows[0].total_refunded);
        const txTotal = parseFloat(originalTx.total_amount);

        // Generate refund number
        const numRes = await client.query(
            `SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(refund_number, '[^0-9]', '', 'g'), '') AS INTEGER)), 0) + 1 AS n
             FROM pos_refunds WHERE business_id = $1`, [data.businessId]
        );
        const refundNumber = `RFD-${String(numRes.rows[0].n).padStart(6, '0')}`;

        // Calculate refund totals from items
        const items = data.items || [];
        let subtotal = 0, taxAmount = 0;

        for (const item of items) {
            const lineRefund = parseFloat(item.refundAmount || (item.quantity * item.unitPrice));
            subtotal += lineRefund;
            taxAmount += parseFloat(item.taxAmount || 0);
        }
        const totalRefund = Math.round((subtotal + taxAmount) * 100) / 100;

        // Prevent over-refunding
        if (alreadyRefunded + totalRefund > txTotal + 0.01) {
            throw new Error(
                `Refund (${totalRefund}) exceeds remaining amount. ` +
                `Transaction total: ${txTotal}, Already refunded: ${alreadyRefunded}, ` +
                `Remaining: ${(txTotal - alreadyRefunded).toFixed(2)}`
            );
        }

        const refundType = totalRefund >= txTotal - alreadyRefunded - 0.01 ? 'full' : 'partial';

        // Create refund record
        const refundRes = await client.query(`
            INSERT INTO pos_refunds (
                business_id, transaction_id, refund_number, refund_type,
                reason, subtotal, tax_amount, total_amount,
                refund_method, status, processed_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', $10) RETURNING *
        `, [
            data.businessId, data.transactionId, refundNumber, refundType,
            data.reason || null, subtotal, taxAmount, totalRefund,
            data.refundMethod || 'cash', session.user.id
        ]);
        const refund = refundRes.rows[0];

        // Create refund items + restock
        for (const item of items) {
            const lineRefund = parseFloat(item.refundAmount || (item.quantity * item.unitPrice));

            await client.query(`
                INSERT INTO pos_refund_items (
                    refund_id, product_id, product_name, quantity,
                    unit_price, refund_amount, restock
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                refund.id, item.productId || null, item.productName,
                item.quantity, item.unitPrice, lineRefund,
                item.restock !== false
            ]);

            // Restock product if requested
            if (item.productId && item.restock !== false) {
                await client.query(
                    `UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2`,
                    [item.quantity, item.productId]
                );
            }
        }

        // GL reversal: debit Sales Revenue, credit Cash/Bank
        const glEntries = [
            { accountCode: ACCOUNT_CODES.SALES_REVENUE, debit: subtotal, credit: 0 },
        ];
        if (taxAmount > 0) {
            glEntries.push({ accountCode: ACCOUNT_CODES.SALES_TAX_PAYABLE, debit: taxAmount, credit: 0 });
        }

        const fundAccount = (data.refundMethod === 'cash')
            ? ACCOUNT_CODES.CASH_ON_HAND
            : ACCOUNT_CODES.BANK_ACCOUNTS;
        glEntries.push({ accountCode: fundAccount, debit: 0, credit: totalRefund });

        await createGLEntryAction({
            businessId: data.businessId,
            date: new Date(),
            description: `POS Refund: ${refundNumber} (from ${originalTx.transaction_number})`,
            referenceType: 'pos_refund',
            referenceId: refund.id,
            createdBy: session.user.id,
            entries: glEntries,
        }, client);

        await client.query('COMMIT');
        return { success: true, refund };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('POS refund error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Get refunds for a transaction or business
 */
export async function getPosRefundsAction(businessId, filters = {}) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, client);

        let query = `
            SELECT r.*, t.transaction_number
            FROM pos_refunds r
            JOIN pos_transactions t ON r.transaction_id = t.id
            WHERE r.business_id = $1
        `;
        const params = [businessId];
        let idx = 2;

        if (filters.transactionId) {
            query += ` AND r.transaction_id = $${idx}`;
            params.push(filters.transactionId);
            idx++;
        }

        query += ` ORDER BY r.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        params.push(filters.limit || 50, filters.offset || 0);

        const result = await client.query(query, params);
        return { success: true, refunds: result.rows };
    } catch (error) {
        console.error('Get POS refunds error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}
