import pool from '@/lib/db';
import { AccountingService } from './AccountingService';

/**
 * Payment Service (Enterprise SOA)
 * Orchestrates Receipts, Payments, and Balance Synchronization.
 */
export const PaymentService = {

    async getClient(txClient) {
        return txClient || await pool.connect();
    },

    /**
     * Create Payment/Receipt
     */
    async createPayment(data, userId, txClient = null) {
        const client = await this.getClient(txClient);
        const shouldManageTransaction = !txClient;
        try {
            if (shouldManageTransaction) await client.query('BEGIN');
            const { business_id: businessId, allocations = [], ...pData } = data;

            // 1. Create Payment Record
            const res = await client.query(`
                INSERT INTO payments (
                    business_id, payment_type, reference_type, reference_id,
                    customer_id, vendor_id, amount, payment_mode, payment_date,
                    bank_name, cheque_number, transaction_id, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *
            `, [
                businessId, pData.payment_type, pData.reference_type, pData.reference_id,
                pData.customer_id, pData.vendor_id, pData.amount, pData.payment_mode || 'cash',
                pData.payment_date || new Date(), pData.bank_name, pData.cheque_number,
                pData.transaction_id, pData.notes
            ]);
            const payment = res.rows[0];

            // 2. Allocations
            if (allocations.length > 0) {
                for (const alloc of allocations) {
                    await client.query(`
                        INSERT INTO payment_allocations (business_id, payment_id, invoice_id, purchase_id, amount)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [businessId, payment.id, alloc.invoice_id, alloc.purchase_id, alloc.amount]);
                }
            } else if (pData.reference_id) {
                const invId = pData.reference_type === 'invoice' ? pData.reference_id : null;
                const purId = pData.reference_type === 'purchase' ? pData.reference_id : null;
                await client.query(`
                    INSERT INTO payment_allocations (business_id, payment_id, invoice_id, purchase_id, amount)
                    VALUES ($1, $2, $3, $4, $5)
                `, [businessId, payment.id, invId, purId, payment.amount]);
            }

            // 3. Update Balance
            if (pData.payment_type === 'receipt' && pData.customer_id) {
                await client.query(`
                    UPDATE customers SET outstanding_balance = outstanding_balance - $1, updated_at = NOW()
                    WHERE id = $2 AND business_id = $3
                `, [pData.amount, pData.customer_id, businessId]);
            } else if (pData.payment_type === 'payment' && pData.vendor_id) {
                await client.query(`
                    UPDATE vendors SET outstanding_balance = outstanding_balance - $1, updated_at = NOW()
                    WHERE id = $2 AND business_id = $3
                `, [pData.amount, pData.vendor_id, businessId]);
            }

            // 4. Update Status (Invoice/Purchase)
            if (pData.reference_id) {
                const VALID_TABLES = { invoice: 'invoices', purchase: 'purchases' };
                const table = VALID_TABLES[pData.reference_type];
                if (!table) throw new Error(`Invalid reference_type: ${pData.reference_type}`);

                const totalRes = await client.query(`SELECT total_amount, grand_total FROM ${table} WHERE id = $1 AND business_id = $2`, [pData.reference_id, businessId]);
                if (totalRes.rows.length === 0) throw new Error(`Referenced ${pData.reference_type} not found`);
                const total = totalRes.rows[0]?.grand_total || totalRes.rows[0]?.total_amount || 0;

                const paidRes = await client.query(`
                    SELECT COALESCE(SUM(amount), 0) as paid FROM payments 
                    WHERE reference_id = $1 AND business_id = $2 AND is_deleted IS NOT TRUE
                `, [pData.reference_id, businessId]);
                const paid = parseFloat(paidRes.rows[0].paid);

                let status = 'partial';
                if (paid >= total) status = 'paid';
                else if (paid <= 0) status = 'pending';

                await client.query(`UPDATE ${table} SET status = $1, updated_at = NOW() WHERE id = $2 AND business_id = $3`, [status, pData.reference_id, businessId]);
            }

            // 5. Accounting
            await AccountingService.recordBusinessTransaction('payment', {
                businessId, referenceId: payment.id, amount: payment.amount,
                paymentMode: payment.payment_mode, paymentType: payment.payment_type,
                description: `${payment.payment_type.toUpperCase()} - ${payment.payment_mode.toUpperCase()}`, userId
            }, client);

            if (shouldManageTransaction) await client.query('COMMIT');
            return payment;
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Delete Payment
     */
    async deletePayment(businessId, paymentId, userId, txClient = null) {
        const client = await this.getClient(txClient);
        const shouldManageTransaction = !txClient;
        try {
            if (shouldManageTransaction) await client.query('BEGIN');

            const pRes = await client.query('SELECT * FROM payments WHERE id = $1 AND business_id = $2 FOR UPDATE', [paymentId, businessId]);
            if (pRes.rows.length === 0) throw new Error('Payment not found');
            const payment = pRes.rows[0];

            // 1. Reverse Balance
            if (payment.payment_type === 'receipt' && payment.customer_id) {
                await client.query(`UPDATE customers SET outstanding_balance = outstanding_balance + $1 WHERE id = $2 AND business_id = $3`, [payment.amount, payment.customer_id, businessId]);
            } else if (payment.payment_type === 'payment' && payment.vendor_id) {
                await client.query(`UPDATE vendors SET outstanding_balance = outstanding_balance + $1 WHERE id = $2 AND business_id = $3`, [payment.amount, payment.vendor_id, businessId]);
            }

            // 2. Reverse GL
            await client.query(`DELETE FROM gl_entries WHERE business_id = $1 AND reference_type = 'payment' AND reference_id = $2`, [businessId, paymentId]);

            // 3. Cleanup
            await client.query(`DELETE FROM payment_allocations WHERE payment_id = $1 AND business_id = $2`, [paymentId, businessId]);
            await client.query(`DELETE FROM payments WHERE id = $1 AND business_id = $2`, [paymentId, businessId]);

            if (shouldManageTransaction) await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (!txClient) client.release();
        }
    }
};
