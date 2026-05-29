'use server';

import pool from '@/lib/db';
import { InvoiceService } from '@/lib/services/InvoiceService';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { withGuard } from '@/lib/rbac/serverGuard';
import { revalidatePath } from 'next/cache';

/**
 * Bulk Delete Invoices
 * Deletes multiple invoices in a batch operation
 * 
 * @param {string} businessId - Business ID
 * @param {string[]} invoiceIds - Array of invoice IDs to delete
 * @param {string} userId - User performing the deletion
 * @returns {Promise<Object>} Result with success count and any failures
 */
export async function bulkDeleteInvoicesAction(businessId, invoiceIds, userId) {
    return withGuard(
        { businessId, userId, requiredRole: 'admin' },
        async () => {
            if (!businessId || !invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
                return actionFailure('Business ID and at least one invoice ID are required');
            }

            const results = {
                success: [],
                failed: [],
                restoredStock: 0,
                reversedBalance: 0
            };

            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                for (const invoiceId of invoiceIds) {
                    try {
                        // Use InvoiceService.voidInvoice to properly reverse all transactions
                        const result = await InvoiceService.voidInvoice(
                            businessId,
                            invoiceId,
                            userId,
                            client
                        );

                        if (result.success) {
                            results.success.push(invoiceId);
                            results.restoredStock += result.itemsRestored || 0;
                        } else {
                            results.failed.push({ id: invoiceId, error: 'Void operation failed' });
                        }
                    } catch (error) {
                        console.error(`Failed to delete invoice ${invoiceId}:`, error);
                        results.failed.push({ id: invoiceId, error: getErrorMessage(error) });
                    }
                }

                await client.query('COMMIT');

                // Revalidate paths
                revalidatePath(`/business/[category]/invoices`, 'page');
                revalidatePath(`/business/[category]`, 'page');

                return actionSuccess({
                    deleted: results.success.length,
                    failed: results.failed.length,
                    failures: results.failed,
                    restoredStock: results.restoredStock,
                    message: `Successfully deleted ${results.success.length} invoice(s)`
                });
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Bulk delete transaction failed:', error);
                return actionFailure(getErrorMessage(error));
            } finally {
                client.release();
            }
        }
    );
}

/**
 * Bulk Update Invoice Status
 * Updates status for multiple invoices
 * 
 * @param {string} businessId - Business ID
 * @param {string[]} invoiceIds - Array of invoice IDs
 * @param {string} status - New status to set
 * @param {string} userId - User performing the update
 * @returns {Promise<Object>} Result
 */
export async function bulkUpdateInvoiceStatusAction(businessId, invoiceIds, status, userId) {
    return withGuard(
        { businessId, userId, requiredRole: 'member' },
        async () => {
            if (!businessId || !invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
                return actionFailure('Business ID and at least one invoice ID are required');
            }

            if (!status || !['draft', 'sent', 'paid', 'voided'].includes(status)) {
                return actionFailure('Valid status is required (draft, sent, paid, voided)');
            }

            const client = await pool.connect();

            try {
                // Update all invoices in a single query
                const result = await client.query(`
                    UPDATE invoices 
                    SET status = $1, 
                        updated_at = NOW(),
                        payment_status = CASE 
                            WHEN $1 = 'paid' THEN 'paid'
                            ELSE payment_status 
                        END
                    WHERE business_id = $2 
                    AND id = ANY($3)
                    AND is_deleted = false
                    RETURNING id, invoice_number
                `, [status, businessId, invoiceIds]);

                revalidatePath(`/business/[category]/invoices`, 'page');

                return actionSuccess({
                    updated: result.rowCount,
                    invoices: result.rows,
                    message: `Updated ${result.rowCount} invoice(s) to ${status}`
                });
            } catch (error) {
                console.error('Bulk status update failed:', error);
                return actionFailure(getErrorMessage(error));
            } finally {
                client.release();
            }
        }
    );
}

/**
 * Export Invoices
 * Generates export data for invoices with all related information
 * 
 * @param {string} businessId - Business ID
 * @param {Object} filters - Optional filters (status, date range, etc.)
 * @param {string} format - Export format (csv, json)
 * @returns {Promise<Object>} Export data
 */
export async function exportInvoicesAction(businessId, filters = {}, format = 'csv') {
    return withGuard(
        { businessId, requiredRole: 'member' },
        async () => {
            if (!businessId) {
                return actionFailure('Business ID is required');
            }

            const client = await pool.connect();

            try {
                // Build query with filters
                let query = `
                    SELECT 
                        i.id,
                        i.invoice_number,
                        i.date,
                        i.due_date,
                        i.status,
                        i.payment_status,
                        i.grand_total,
                        i.subtotal,
                        i.tax_total,
                        i.discount_total,
                        i.notes,
                        i.terms,
                        i.payment_method,
                        c.name as customer_name,
                        c.email as customer_email,
                        c.phone as customer_phone,
                        COALESCE(calculate_invoice_balance(i.id), i.grand_total) as balance,
                        (SELECT COALESCE(SUM(amount), 0) FROM invoice_payments 
                         WHERE invoice_id = i.id AND (is_deleted = false OR is_deleted IS NULL)) as total_paid,
                        (SELECT json_agg(
                            json_build_object(
                                'name', ii.name,
                                'quantity', ii.quantity,
                                'unit_price', ii.unit_price,
                                'tax_amount', ii.tax_amount,
                                'discount_amount', ii.discount_amount,
                                'total_amount', ii.total_amount
                            )
                        ) FROM invoice_items ii WHERE ii.invoice_id = i.id) as items
                    FROM invoices i
                    LEFT JOIN customers c ON i.customer_id = c.id
                    WHERE i.business_id = $1 
                    AND (i.is_deleted = false OR i.is_deleted IS NULL)
                `;
                
                const params = [businessId];
                let paramIndex = 2;

                if (filters.status) {
                    query += ` AND i.status = $${paramIndex++}`;
                    params.push(filters.status);
                }

                if (filters.startDate) {
                    query += ` AND i.date >= $${paramIndex++}`;
                    params.push(filters.startDate);
                }

                if (filters.endDate) {
                    query += ` AND i.date <= $${paramIndex++}`;
                    params.push(filters.endDate);
                }

                if (filters.customerId) {
                    query += ` AND i.customer_id = $${paramIndex++}`;
                    params.push(filters.customerId);
                }

                query += ` ORDER BY i.date DESC, i.created_at DESC`;

                const result = await client.query(query, params);

                // Format data based on export format
                let exportData;
                if (format === 'csv') {
                    exportData = formatInvoicesAsCSV(result.rows);
                } else {
                    exportData = result.rows;
                }

                return actionSuccess({
                    data: exportData,
                    count: result.rowCount,
                    format: format
                });
            } catch (error) {
                console.error('Export failed:', error);
                return actionFailure(getErrorMessage(error));
            } finally {
                client.release();
            }
        }
    );
}

/**
 * Format invoices as CSV
 */
function formatInvoicesAsCSV(invoices) {
    const headers = [
        'Invoice Number',
        'Date',
        'Due Date',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Status',
        'Payment Status',
        'Subtotal',
        'Tax Total',
        'Discount Total',
        'Grand Total',
        'Total Paid',
        'Balance',
        'Payment Method',
        'Notes',
        'Items'
    ].join(',');

    const rows = invoices.map(inv => {
        const items = inv.items || [];
        const itemsSummary = items.map(i => 
            `${i.name} (x${i.quantity} @ ${i.unit_price})`
        ).join('; ');

        return [
            inv.invoice_number,
            inv.date,
            inv.due_date || '',
            inv.customer_name || '',
            inv.customer_email || '',
            inv.customer_phone || '',
            inv.status,
            inv.payment_status || '',
            inv.subtotal || 0,
            inv.tax_total || 0,
            inv.discount_total || 0,
            inv.grand_total,
            inv.total_paid || 0,
            inv.balance || inv.grand_total,
            inv.payment_method || '',
            `"${(inv.notes || '').replace(/"/g, '""')}"`, // Escape quotes
            `"${itemsSummary.replace(/"/g, '""')}"`
        ].join(',');
    });

    return [headers, ...rows].join('\n');
}
