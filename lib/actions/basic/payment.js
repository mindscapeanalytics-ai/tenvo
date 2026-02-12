'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { createGLEntryAction } from '@/lib/actions/basic/accounting';
import { ACCOUNT_CODES } from '@/lib/config/accounting';

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
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, businessId);

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

            return { success: true, payments: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get payments error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Create a payment (customer receipt or vendor payment)
 */
export async function createPaymentAction(paymentData) {
    const client = await pool.connect();

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, paymentData.business_id);

        await client.query('BEGIN');

        // Create payment record
        const paymentResult = await client.query(`
            INSERT INTO payments (
                business_id, payment_type, reference_type, reference_id,
                customer_id, vendor_id, amount, payment_mode, payment_date,
                bank_name, cheque_number, transaction_id, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            paymentData.business_id,
            paymentData.payment_type, // 'receipt' or 'payment'
            paymentData.reference_type || null, // 'invoice', 'purchase', etc.
            paymentData.reference_id || null,
            paymentData.customer_id || null,
            paymentData.vendor_id || null,
            paymentData.amount,
            paymentData.payment_mode || 'cash', // 'cash', 'bank', 'cheque', 'online'
            paymentData.payment_date || new Date().toISOString(),
            paymentData.bank_name || null,
            paymentData.cheque_number || null,
            paymentData.transaction_id || null,
            paymentData.notes || null
        ]);

        const payment = paymentResult.rows[0];

        // Update customer outstanding balance if customer payment (receipt)
        if (paymentData.payment_type === 'receipt' && paymentData.customer_id) {
            await client.query(`
                UPDATE customers 
                SET outstanding_balance = outstanding_balance - $1,
                    updated_at = NOW()
                WHERE id = $2
            `, [paymentData.amount, paymentData.customer_id]);
        }

        // Update vendor outstanding balance if vendor payment
        if (paymentData.payment_type === 'payment' && paymentData.vendor_id) {
            await client.query(`
                UPDATE vendors 
                SET outstanding_balance = outstanding_balance - $1,
                    updated_at = NOW()
                WHERE id = $2
            `, [paymentData.amount, paymentData.vendor_id]);
        }

        // Update invoice status if payment is against an invoice
        if (paymentData.reference_type === 'invoice' && paymentData.reference_id) {
            // Get invoice total
            const invoiceResult = await client.query(
                'SELECT total_amount FROM invoices WHERE id = $1',
                [paymentData.reference_id]
            );

            if (invoiceResult.rows.length > 0) {
                const invoiceTotal = parseFloat(String(invoiceResult.rows[0].total_amount));

                // Get total payments for this invoice
                const paymentsResult = await client.query(`
                    SELECT COALESCE(SUM(amount), 0) as total_paid
                    FROM payments
                    WHERE reference_type = 'invoice' AND reference_id = $1
                `, [paymentData.reference_id]);

                const totalPaid = parseFloat(String(paymentsResult.rows[0].total_paid));

                // Update invoice status
                let newStatus = 'pending';
                if (totalPaid >= invoiceTotal) {
                    newStatus = 'paid';
                } else if (totalPaid > 0) {
                    newStatus = 'partial';
                }

                await client.query(
                    'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2',
                    [newStatus, paymentData.reference_id]
                );
            }
        }

        // Update purchase status if payment is against a purchase order
        if (paymentData.reference_type === 'purchase' && paymentData.reference_id) {
            // Get purchase total
            const purchaseResult = await client.query(
                'SELECT total_amount FROM purchases WHERE id = $1',
                [paymentData.reference_id]
            );

            if (purchaseResult.rows.length > 0) {
                const purchaseTotal = parseFloat(String(purchaseResult.rows[0].total_amount));

                // Get total payments for this purchase
                const paymentsResult = await client.query(`
                    SELECT COALESCE(SUM(amount), 0) as total_paid
                    FROM payments
                    WHERE reference_type = 'purchase' AND reference_id = $1
                `, [paymentData.reference_id]);

                const totalPaid = parseFloat(String(paymentsResult.rows[0].total_paid));

                // Update purchase status (Note: We keep the history of received, but add payment status context)
                let newStatus = 'received'; // Default back to received if fully paid? 
                // Actually, let's use 'paid' if fully paid to align with invoices.
                if (totalPaid >= purchaseTotal) {
                    newStatus = 'paid';
                } else if (totalPaid > 0) {
                    newStatus = 'partial'; // Partial payment
                }

                await client.query(
                    'UPDATE purchases SET status = $1, updated_at = NOW() WHERE id = $2',
                    [newStatus, paymentData.reference_id]
                );
            }
        }

        // Create GL Entry using centralized action
        let debitAccountCode, creditAccountCode;
        const fundAccountCode = (paymentData.payment_mode === 'cash') ? ACCOUNT_CODES.CASH_ON_HAND : ACCOUNT_CODES.BANK_ACCOUNTS;

        if (paymentData.payment_type === 'receipt') {
            // Receipt: Debit Fund (Cash/Bank), Credit Accounts Receivable
            debitAccountCode = fundAccountCode;
            creditAccountCode = ACCOUNT_CODES.ACCOUNTS_RECEIVABLE;
        } else {
            // Payment: Debit Accounts Payable, Credit Fund (Cash/Bank)
            debitAccountCode = ACCOUNT_CODES.ACCOUNTS_PAYABLE;
            creditAccountCode = fundAccountCode;
        }

        const entryDesc = paymentData.payment_type === 'receipt'
            ? `Receipt - ${paymentData.payment_mode.toUpperCase()} (Ref: ${payment.transaction_id || payment.cheque_number || 'Cash'})`
            : `Payment - ${paymentData.payment_mode.toUpperCase()} (Ref: ${payment.transaction_id || payment.cheque_number || 'Cash'})`;

        await createGLEntryAction({
            businessId: payment.business_id,
            date: payment.payment_date,
            description: entryDesc,
            referenceType: 'payment',
            referenceId: payment.id,
            entries: [
                { accountCode: debitAccountCode, debit: parseFloat(payment.amount), credit: 0 },
                { accountCode: creditAccountCode, debit: 0, credit: parseFloat(payment.amount) }
            ]
        }, client); // Pass shared transaction client

        await client.query('COMMIT');

        return { success: true, payment };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create payment error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Get customer ledger (all transactions)
 */
export async function getCustomerLedgerAction(customerId, businessId) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, businessId);

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
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, businessId);

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
 */
export async function deletePaymentAction(paymentId) {
    const client = await pool.connect();

    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await client.query('BEGIN');

        // Get payment details
        const paymentResult = await client.query(
            'SELECT * FROM payments WHERE id = $1',
            [paymentId]
        );

        if (paymentResult.rows.length === 0) {
            return { success: false, error: 'Payment not found' };
        }

        const payment = paymentResult.rows[0];
        await verifyBusinessAccess(session.user.id, payment.business_id);

        // Reverse customer/vendor balance updates
        if (payment.payment_type === 'receipt' && payment.customer_id) {
            await client.query(`
                UPDATE customers 
                SET outstanding_balance = outstanding_balance + $1,
                    updated_at = NOW()
                WHERE id = $2
            `, [payment.amount, payment.customer_id]);
        }

        if (payment.payment_type === 'payment' && payment.vendor_id) {
            await client.query(`
                UPDATE vendors 
                SET outstanding_balance = outstanding_balance + $1,
                    updated_at = NOW()
                WHERE id = $2
            `, [payment.amount, payment.vendor_id]);
        }

        // Delete GL entries
        await client.query(
            'DELETE FROM gl_entries WHERE reference_type = $1 AND reference_id = $2',
            ['payment', paymentId]
        );

        // Delete payment
        await client.query('DELETE FROM payments WHERE id = $1', [paymentId]);

        await client.query('COMMIT');

        return { success: true };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete payment error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}
