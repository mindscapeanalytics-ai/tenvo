'use server';

import pool from '@/lib/db';
import { createGLEntryAction } from '@/lib/actions/basic/accounting';
import { ACCOUNT_CODES } from '@/lib/config/accounting';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { withGuard } from '@/lib/rbac/serverGuard';

import { PaymentService } from '@/lib/services/PaymentService';

async function ensureAccess(businessId, permission, client = null) {
    const { session } = await withGuard(businessId, { permission, client });
    return session;
}

/**
 * Server Action: Get all payments for a business
 * @param {string} businessId - Business UUID
 * @param {object} filters - Optional filters
 * @param {string} [filters.payment_type]
 * @param {string} [filters.customer_id]
 * @param {string} [filters.vendor_id]
 * @param {string} [filters.date_from]
 * @param {string} [filters.date_to]
 */
export async function getPaymentsAction(businessId, filters = {}) {
    try {
        await ensureAccess(businessId, 'payments.view');

        const client = await pool.connect();
        try {
            let query = `
                SELECT 
                    p.*,
                    c.name as customer_name,
                    v.name as vendor_name
                FROM payments p
                LEFT JOIN customers c ON p.customer_id = c.id
                LEFT JOIN vendors v ON p.vendor_id = v.id
                WHERE p.business_id = $1
            `;
            const params = [businessId];
            let paramIndex = 2;

            // Apply filters
            if (filters.payment_type) {
                query += ` AND p.payment_type = $${paramIndex}`;
                params.push(filters.payment_type);
                paramIndex++;
            }

            if (filters.customer_id) {
                query += ` AND p.customer_id = $${paramIndex}`;
                params.push(filters.customer_id);
                paramIndex++;
            }

            if (filters.vendor_id) {
                query += ` AND p.vendor_id = $${paramIndex}`;
                params.push(filters.vendor_id);
                paramIndex++;
            }

            if (filters.date_from) {
                query += ` AND p.payment_date >= $${paramIndex}`;
                params.push(filters.date_from);
                paramIndex++;
            }

            if (filters.date_to) {
                query += ` AND p.payment_date <= $${paramIndex}`;
                params.push(filters.date_to);
                paramIndex++;
            }

            query += ' ORDER BY p.payment_date DESC, p.created_at DESC';

            const result = await client.query(query, params);

            return await actionSuccess({ payments: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get payments error:', error);
        return await actionFailure('GET_PAYMENTS_FAILED', await getErrorMessage(error));
    }
}

/**
 * Server Action: Create a payment (customer receipt or vendor payment)
 */
/**
 * Server Action: Create a payment (customer receipt or vendor payment)
 */
export async function createPaymentAction(paymentData) {
    try {
        const session = await ensureAccess(paymentData.business_id, 'payments.create');
        const payment = await PaymentService.createPayment(paymentData, session.user.id);
        return await actionSuccess({ payment });
    } catch (error) {
        console.error('Create payment action error:', error);
        return await actionFailure('CREATE_PAYMENT_FAILED', await getErrorMessage(error));
    }
}

/**
 * Server Action: Get customer ledger (all transactions)
 */
export async function getCustomerLedgerAction(customerId, businessId) {
    try {
        await ensureAccess(businessId, 'customers.view_ledger');

        const client = await pool.connect();
        try {
            // Get customer details
            const customerResult = await client.query(
                'SELECT * FROM customers WHERE id = $1 AND business_id = $2',
                [customerId, businessId]
            );

            if (customerResult.rows.length === 0) {
                return { success: false, error: 'Customer not found' };
            }

            const customer = customerResult.rows[0];

            // Get all invoices for this customer
            const invoicesResult = await client.query(`
                SELECT 
                    id, invoice_number, date, total_amount, status,
                    'invoice' as transaction_type
                FROM invoices
                WHERE customer_id = $1 AND business_id = $2
                ORDER BY date DESC
            `, [customerId, businessId]);

            // Get all payments for this customer
            const paymentsResult = await client.query(`
                SELECT 
                    id, payment_date as date, amount, payment_mode,
                    'payment' as transaction_type, notes
                FROM payments
                WHERE customer_id = $1 AND business_id = $2 AND payment_type = 'receipt'
                ORDER BY payment_date DESC
            `, [customerId, businessId]);

            // Combine and sort by date ASCENDING for calculation
            const transactions = [
                ...invoicesResult.rows.map(inv => ({
                    ...inv,
                    debit: inv.total_amount,
                    credit: 0
                })),
                ...paymentsResult.rows.map(pay => ({
                    ...pay,
                    debit: 0,
                    credit: pay.amount
                }))
            ].sort((a, b) => new Date(a.date) - new Date(b.date));

            // Calculate running balance
            let balance = 0;
            const ledgerCalculated = transactions.map(txn => {
                balance += (txn.debit - txn.credit);
                return {
                    ...txn,
                    balance
                };
            });

            // Reverse for display (Newest First)
            const ledger = ledgerCalculated.reverse();

            return {
                success: true,
                customer,
                ledger,
                currentBalance: customer.outstanding_balance
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get customer ledger error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get vendor ledger (all transactions)
 */
export async function getVendorLedgerAction(vendorId, businessId) {
    try {
        await ensureAccess(businessId, 'vendors.view');

        const client = await pool.connect();
        try {
            // Get vendor details
            const vendorResult = await client.query(
                'SELECT * FROM vendors WHERE id = $1 AND business_id = $2',
                [vendorId, businessId]
            );

            if (vendorResult.rows.length === 0) {
                return { success: false, error: 'Vendor not found' };
            }

            const vendor = vendorResult.rows[0];

            // Get all purchases for this vendor
            const purchasesResult = await client.query(`
                SELECT 
                    id, purchase_number, date, total_amount, status,
                    'purchase' as transaction_type
                FROM purchases
                WHERE vendor_id = $1 AND business_id = $2
                ORDER BY date DESC
            `, [vendorId, businessId]);

            // Get all payments for this vendor
            const paymentsResult = await client.query(`
                SELECT 
                    id, payment_date as date, amount, payment_mode,
                    'payment' as transaction_type, notes
                FROM payments
                WHERE vendor_id = $1 AND business_id = $2 AND payment_type = 'payment'
                ORDER BY payment_date DESC
            `, [vendorId, businessId]);

            // Combine and sort by date ASCENDING for calculation
            const transactions = [
                ...purchasesResult.rows.map(pur => ({
                    ...pur,
                    debit: pur.total_amount,
                    credit: 0
                })),
                ...paymentsResult.rows.map(pay => ({
                    ...pay,
                    debit: 0,
                    credit: pay.amount
                }))
            ].sort((a, b) => new Date(a.date) - new Date(b.date));

            // Calculate running balance
            let balance = 0;
            const ledgerCalculated = transactions.map(txn => {
                // For vendors: Invoice increases balance (payable), Payment decreases it
                // Logic: Balance = Payable - Paid
                // Debit = Purchase Amount (increase payable)
                // Credit = Payment Amount (decrease payable)
                balance += (txn.debit - txn.credit);
                return {
                    ...txn,
                    balance
                };
            });

            // Reverse for display
            const ledger = ledgerCalculated.reverse();

            return {
                success: true,
                vendor,
                ledger,
                currentBalance: vendor.outstanding_balance
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get vendor ledger error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Delete payment
 * @param {string} businessId - Business UUID (required for tenant isolation)
 * @param {string} paymentId - Payment UUID
 */
/**
 * Server Action: Delete payment and reverse automated accounting
 */
export async function deletePaymentAction(businessId, paymentId) {
    try {
        const session = await ensureAccess(businessId, 'finance.manage_payments');
        await PaymentService.deletePayment(businessId, paymentId, session.user.id);
        return await actionSuccess({ message: 'Payment deleted and balances reversed' });
    } catch (error) {
        console.error('Delete payment action error:', error);
        return await actionFailure('DELETE_PAYMENT_FAILED', await getErrorMessage(error));
    }
}
