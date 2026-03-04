'use server';

import pool from '@/lib/db';
import { createGLEntryAction } from '@/lib/actions/basic/accounting';
import { addStockAction } from '@/lib/actions/standard/inventory/stock';
import { ACCOUNT_CODES } from '@/lib/config/accounting';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { generateScopedDocumentNumber } from '@/lib/db/documentNumber';
import { withGuard } from '@/lib/rbac/serverGuard';

async function checkAuth(businessId, client = null, permission = 'pos.process_refund', feature = 'pos') {
    const { session } = await withGuard(businessId, { permission, feature, client });
    return session;
}

/**
 * Process a POS refund (full or partial) with stock reversal + GL entries
 */
export async function refundPosTransactionAction(data) {
    const client = await pool.connect();
    try {
        const session = await checkAuth(data.businessId, client, 'pos.process_refund', 'pos');
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
             FROM pos_refunds WHERE transaction_id = $1 AND business_id = $2 AND status = 'completed'`,
            [data.transactionId, data.businessId]
        );
        const alreadyRefunded = parseFloat(existingRefunds.rows[0].total_refunded);
        const txTotal = parseFloat(originalTx.total_amount);

        // Generate refund number
        const refundNumber = await generateScopedDocumentNumber(client, {
            businessId: data.businessId,
            table: 'pos_refunds',
            column: 'refund_number',
            prefix: 'RFD-',
            padLength: 6,
        });

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
                    business_id, refund_id, product_id, product_name, quantity,
                    unit_price, refund_amount, restock
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                data.businessId, refund.id, item.productId || null, item.productName,
                item.quantity, item.unitPrice, lineRefund,
                item.restock !== false
            ]);

            // Restock product via standardized pipeline (warehouse + movement history)
            if (item.productId && item.restock !== false) {
                await addStockAction({
                    businessId: data.businessId,
                    productId: item.productId,
                    warehouseId: item.warehouseId || null,
                    quantity: item.quantity,
                    costPrice: item.unitPrice || 0,
                    notes: `POS Refund: ${refundNumber}`,
                    referenceType: 'pos_refund',
                    referenceId: refund.id,
                }, client);
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

        // Audit trail (fire-and-forget)
        auditWrite({
            businessId: data.businessId,
            action: 'create',
            entityType: 'pos_refund',
            entityId: refund.id,
            description: `POS refund ${refundNumber} — ${totalRefund} (${refundType})`,
            metadata: { refundNumber, totalRefund, refundType, originalTx: originalTx.transaction_number, reason: data.reason },
        });

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
        await checkAuth(businessId, client, 'pos.access', 'pos');

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
