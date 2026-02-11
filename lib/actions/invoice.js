'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { addStockAction, removeStockAction } from './stock';
import { createGLEntryAction } from './accounting';
import { invoiceSchema, validateWithSchema } from '@/lib/validation/schemas';
import { ACCOUNT_CODES } from '@/lib/config/accounting';

async function checkAuth(businessId, requiredRoles = []) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Unauthorized');

    if (businessId) {
        await verifyBusinessAccess(session.user.id, businessId, requiredRoles);
    }

    return session;
}

export async function createInvoiceAction(params) {
    try {
        const { invoiceData, items } = params;

        // Sanitize numeric fields (Top Level)
        const numericFields = ['subtotal', 'tax_total', 'discount_total', 'grand_total', 'total_tax'];
        const sanitizedData = { ...invoiceData };

        numericFields.forEach(field => {
            if (sanitizedData[field] !== undefined) {
                if (typeof sanitizedData[field] === 'string') {
                    const val = parseFloat(sanitizedData[field]);
                    sanitizedData[field] = isNaN(val) ? 0 : val;
                } else if (sanitizedData[field] === null) {
                    sanitizedData[field] = 0;
                }
            }
        });

        // Sanitize Items
        const sanitizedItems = items.map(item => {
            const newItem = { ...item };
            ['quantity', 'unit_price', 'tax_percent', 'tax_amount', 'discount_amount', 'total_amount'].forEach(f => {
                if (newItem[f] !== undefined) {
                    if (typeof newItem[f] === 'string') {
                        const val = parseFloat(newItem[f]);
                        newItem[f] = isNaN(val) ? 0 : val;
                    } else if (newItem[f] === null) {
                        newItem[f] = 0;
                    }
                }
            });
            return newItem;
        });

        // ✅ 1. Validate with Zod
        const validation = validateWithSchema(invoiceSchema, { ...sanitizedData, items: sanitizedItems });
        if (!validation.success) {
            return { success: false, error: 'Validation failed', errors: validation.errors };
        }

        const validated = validation.data;
        await checkAuth(validated.business_id);

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Create Invoice
            const invQuery = `
                INSERT INTO invoices (
                    business_id, customer_id, invoice_number, date, due_date, status, 
                    subtotal, tax_total, discount_total, grand_total, payment_method, 
                    payment_status, notes, terms, tax_details
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `;
            const invValues = [
                validated.business_id, validated.customer_id, validated.invoice_number,
                validated.date, validated.due_date, validated.status,
                validated.subtotal, validated.total_tax, validated.discount_total,
                validated.grand_total, validated.payment_method, validated.payment_status,
                validated.notes, validated.terms, JSON.stringify(validated.tax_details || {})
            ];

            const invRes = await client.query(invQuery, invValues);
            const invoice = invRes.rows[0];

            // 2. Update Customer Balance
            await client.query(`
                UPDATE customers 
                SET outstanding_balance = COALESCE(outstanding_balance, 0) + $1,
                    updated_at = NOW()
                WHERE id = $2 AND business_id = $3
            `, [validated.grand_total, validated.customer_id, validated.business_id]);

            // 3. Items
            for (const item of validated.items) {
                await client.query(`
                    INSERT INTO invoice_items (
                        business_id, invoice_id, product_id, name, description, quantity, 
                        unit_price, tax_percent, tax_amount, discount_amount, total_amount, metadata
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [
                    invoice.business_id, invoice.id, item.product_id, item.name, item.description,
                    item.quantity, item.unit_price, item.tax_percent, item.tax_amount,
                    item.discount_amount, item.total_amount, JSON.stringify(item.metadata || {})
                ]);
            }

            // 3. Stock deduction (ACID Compliant: Inside Transaction)
            // We strip Promise.allSettled and await sequentially to ensure if ANY fails, we ROLLBACK everything.
            for (const item of items) {
                if (item.product_id) {
                    await removeStockAction({
                        business_id: invoice.business_id,
                        product_id: item.product_id,
                        warehouse_id: item.metadata?.warehouse_id || null,
                        quantity: Number(item.quantity) || 0,
                        reference_type: 'invoices',
                        reference_id: invoice.id,
                        notes: `Invoice ${invoice.invoice_number}`,
                        batch_id: item.metadata?.batch_id || null,
                        serial_numbers: item.metadata?.serial_numbers || []
                    }, client);
                }
            }

            // 4. Create GL Entry
            const netRevenue = Number(validated.grand_total) - Number(validated.tax_total);

            await createGLEntryAction({
                businessId: validated.business_id,
                referenceId: invoice.id,
                referenceType: 'invoices',
                description: `Invoice #${validated.invoice_number}`,
                date: validated.date,
                entries: [
                    { accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, debit: validated.grand_total, credit: 0 },
                    { accountCode: ACCOUNT_CODES.SALES_REVENUE, debit: 0, credit: netRevenue },
                    ...(Number(validated.tax_total) > 0 ? [{ accountCode: ACCOUNT_CODES.SALES_TAX_PAYABLE, debit: 0, credit: validated.tax_total }] : [])
                ]
            }, client);

            await client.query('COMMIT');

            return { success: true, invoice };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Create Invoice Error:", e);
        return { success: false, error: e.message };
    }
}

export async function getInvoicesAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT i.*, 
                       c.name as customer_name, c.email as customer_email,
                       (SELECT json_agg(it.*) FROM invoice_items it WHERE it.invoice_id = i.id) as items
                FROM invoices i
                LEFT JOIN customers c ON i.customer_id = c.id
                WHERE i.business_id = $1
                ORDER BY i.date DESC
            `, [businessId]);
            return { success: true, invoices: res.rows };
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}

export async function deleteInvoiceAction(businessId, invoiceId) {
    try {
        await checkAuth(businessId, ['owner', 'admin']);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Get Invoice Items to restore stock
            const res = await client.query(`
                SELECT i.*, it.product_id, it.quantity 
                FROM invoices i
                JOIN invoice_items it ON i.id = it.invoice_id
                WHERE i.id = $1 AND i.business_id = $2
            `, [invoiceId, businessId]);

            if (res.rows.length === 0) throw new Error('Invoice not found');
            const items = res.rows;
            const invoice = items[0]; // Header info is same

            // 2. Restore Stock (Async-ish but strictly awaited)
            for (const item of items) {
                if (item.product_id) {
                    try {
                        await addStockAction({
                            businessId,
                            productId: item.product_id,
                            warehouseId: null, // Default
                            quantity: Number(item.quantity) || 0,
                            costPrice: 0,
                            notes: `Correction: Invoice ${invoice.invoice_number} deletion (Restore Stock)`,
                            referenceType: 'adjustment',
                            referenceId: invoiceId
                        }, client);
                        // Wait, addStockAction creates a "purchase" or "in" movement.
                        // We want "invoice_delete" reference.
                        // Ideally we'd have `reverseStockAction`.
                        // For now, using addStockAction is the closest primitive.
                    } catch (e) {
                        console.error("Failed to restore stock on invoice delete", e);
                    }
                }
            }

            // 3. Delete GL Entries
            await client.query(
                'DELETE FROM gl_entries WHERE (reference_type = $1 OR reference_type = $2) AND reference_id = $3',
                ['invoice', 'invoices', invoiceId]
            );

            await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
            await client.query('DELETE FROM invoices WHERE id = $1', [invoiceId]);
            await client.query('COMMIT');

            return { success: true };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}
export async function updateInvoiceAction(params) {
    try {
        const { invoiceId, invoiceData, items } = params;
        if (!invoiceData?.business_id) throw new Error('Business ID is missing in invoice data');

        // Sanitize numeric fields (Top Level)
        const numericFields = ['subtotal', 'tax_total', 'discount_total', 'grand_total', 'total_tax'];
        const sanitizedData = { ...invoiceData };

        numericFields.forEach(field => {
            if (sanitizedData[field] !== undefined) {
                if (typeof sanitizedData[field] === 'string') {
                    const val = parseFloat(sanitizedData[field]);
                    sanitizedData[field] = isNaN(val) ? 0 : val;
                } else if (sanitizedData[field] === null) {
                    sanitizedData[field] = 0;
                }
            }
        });

        // Sanitize Items
        const sanitizedItems = items.map(item => {
            const newItem = { ...item };
            ['quantity', 'unit_price', 'tax_percent', 'tax_amount', 'discount_amount', 'total_amount'].forEach(f => {
                if (newItem[f] !== undefined) {
                    if (typeof newItem[f] === 'string') {
                        const val = parseFloat(newItem[f]);
                        newItem[f] = isNaN(val) ? 0 : val;
                    } else if (newItem[f] === null) {
                        newItem[f] = 0;
                    }
                }
            });
            return newItem;
        });

        // ✅ 1. Validate with Zod
        const validation = validateWithSchema(invoiceSchema, { ...sanitizedData, items: sanitizedItems });
        if (!validation.success) {
            return { success: false, error: 'Validation failed', errors: validation.errors };
        }

        const validated = validation.data;
        await checkAuth(validated.business_id);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Get original items to restore stock and original total for balance correction
            const oldItemsRes = await client.query(
                `SELECT it.product_id, it.quantity, i.grand_total as header_total 
                 FROM invoice_items it 
                 JOIN invoices i ON it.invoice_id = i.id
                 WHERE it.invoice_id = $1`,
                [invoiceId]
            );
            const oldItems = oldItemsRes.rows;

            // 2. Revert old stock
            for (const item of oldItems) {
                if (item.product_id) {
                    await addStockAction({
                        business_id: validated.business_id,
                        product_id: item.product_id,
                        quantity: Number(item.quantity) || 0,
                        notes: `Correction: Invoice ${validated.invoice_number} update (Revert)`,
                        reference_type: 'adjustment',
                        reference_id: invoiceId
                    }, client);
                }
            }

            // 3. Update Invoice Header
            const invQuery = `
                UPDATE invoices SET
                    customer_id = $1, date = $2, due_date = $3, status = $4,
                    subtotal = $5, tax_total = $6, discount_total = $7, grand_total = $8,
                    payment_method = $9, payment_status = $10, notes = $11, terms = $12, 
                    tax_details = $13, domain_data = $14, updated_at = NOW()
                WHERE id = $15 AND business_id = $16
                RETURNING *
            `;
            const invValues = [
                validated.customer_id, validated.date, validated.due_date, validated.status,
                validated.subtotal, validated.total_tax, validated.discount_total,
                validated.grand_total, validated.payment_method, validated.payment_status,
                validated.notes, validated.terms,
                JSON.stringify(validated.tax_details || {}),
                JSON.stringify(validated.domain_data || {}),
                invoiceId, validated.business_id
            ];

            const invRes = await client.query(invQuery, invValues);
            const invoice = invRes.rows[0];

            if (!invoice) throw new Error(`Invoice update failed. ID: ${invoiceId}`);

            // 3.5 Update Customer Balance (Difference)
            const balanceDiff = Number(validated.grand_total) - Number(oldItemsRes.rows[0]?.header_total || 0);
            if (balanceDiff !== 0) {
                await client.query(`
                    UPDATE customers 
                    SET outstanding_balance = COALESCE(outstanding_balance, 0) + $1,
                        updated_at = NOW()
                    WHERE id = $2 AND business_id = $3
                `, [balanceDiff, validated.customer_id, validated.business_id]);
            }

            // 4. Replace Items
            await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [invoiceId]);

            for (const item of validated.items) {
                await client.query(`
                    INSERT INTO invoice_items (
                        business_id, invoice_id, product_id, name, description, quantity, 
                        unit_price, tax_percent, tax_amount, discount_amount, total_amount, metadata
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [
                    invoice.business_id, invoice.id, item.product_id, item.name, item.description,
                    item.quantity, item.unit_price, item.tax_percent, item.tax_amount,
                    item.discount_amount, item.total_amount, JSON.stringify(item.metadata || {})
                ]);

                // 5. Deduct new stock
                if (item.product_id) {
                    await removeStockAction({
                        business_id: invoice.business_id,
                        product_id: item.product_id,
                        warehouse_id: item.metadata?.warehouse_id || null,
                        quantity: Number(item.quantity) || 0,
                        reference_type: 'invoices',
                        reference_id: invoice.id,
                        notes: `Invoice ${invoice.invoice_number} (Updated)`,
                        batch_id: item.metadata?.batch_id || null,
                        serial_numbers: item.metadata?.serial_numbers || []
                    }, client);
                }
            }

            // 6. Update GL Entry (DELETE OLD, RE-POST NEW)
            await client.query(
                'DELETE FROM gl_entries WHERE (reference_type = $1 OR reference_type = $2) AND reference_id = $3',
                ['invoice', 'invoices', invoiceId]
            );

            const netRevenue = Number(validated.grand_total) - Number(validated.tax_total);

            await createGLEntryAction({
                businessId: validated.business_id,
                referenceId: invoice.id,
                referenceType: 'invoices',
                description: `Invoice #${validated.invoice_number} (Updated)`,
                date: validated.date,
                entries: [
                    { accountCode: ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, debit: validated.grand_total, credit: 0 },
                    { accountCode: ACCOUNT_CODES.SALES_REVENUE, debit: 0, credit: netRevenue },
                    ...(Number(validated.tax_total) > 0 ? [{ accountCode: ACCOUNT_CODES.SALES_TAX_PAYABLE, debit: 0, credit: validated.tax_total }] : [])
                ]
            }, client);

            await client.query('COMMIT');
            return { success: true, invoice };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (e) {
        return { success: false, error: e.message };
    }
}
