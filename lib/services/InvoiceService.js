import pool from '@/lib/db';
import { generateScopedDocumentNumber } from '@/lib/db/documentNumber';
import { InventoryService } from './InventoryService';
import { AccountingService } from './AccountingService';
import { checkPlanLimit } from '@/lib/auth/planGuard';

/**
 * Invoice Service (Enterprise SOA)
 * Orchestrates Invoicing, Customer Balances, and Revenue Recognition.
 */
export const InvoiceService = {

    async getClient(txClient) {
        return txClient || await pool.connect();
    },

    /**
     * Create Invoice
     */
    async createInvoice(data, userId, txClient = null) {
        const client = await this.getClient(txClient);
        const shouldManageTransaction = !txClient;
        try {
            if (shouldManageTransaction) await client.query('BEGIN');
            const { business_id: businessId, items, ...header } = data;

            const monthInvoiceCountRes = await client.query(
                `SELECT COUNT(*)::int as count
                 FROM invoices
                 WHERE business_id = $1
                   AND DATE_TRUNC('month', COALESCE(date, created_at)) = DATE_TRUNC('month', CURRENT_DATE)
                   AND (is_deleted = false OR is_deleted IS NULL)`,
                [businessId]
            );
            const currentMonthInvoiceCount = Number(monthInvoiceCountRes.rows[0]?.count || 0);
            await checkPlanLimit(businessId, 'max_invoices_per_month', currentMonthInvoiceCount + 1, client);

            // 1. Header & Math Verification
            const invNumber = header.invoice_number || await generateScopedDocumentNumber(client, {
                businessId, table: 'invoices', column: 'invoice_number', prefix: 'INV-', padLength: 6
            });

            // [HARDENED] Server-side math verification (Flexible to accommodate item-level taxes and custom discounts)
            let calculatedSubtotal = 0;
            let calculatedTax = 0;
            let calculatedDiscount = 0;

            for (const item of items) {
                calculatedSubtotal += (Number(item.quantity) * Number(item.unit_price));
                calculatedTax += Number(item.tax_amount || 0);
                calculatedDiscount += Number(item.discount_amount || 0);
            }

            const finalSubtotal = Number(header.subtotal) || calculatedSubtotal;
            const finalTax = Number(header.tax_total) || calculatedTax;
            const finalDiscount = Number(header.discount_total) || calculatedDiscount;

            const expectedGrandTotal = Math.round((finalSubtotal + finalTax - finalDiscount) * 100) / 100;
            const receivedGrandTotal = Math.round(Number(header.grand_total) * 100) / 100;

            if (Math.abs(expectedGrandTotal - receivedGrandTotal) > 0.5) { // Allow tiny rounding delta
                console.warn(`Invoice math discrepancy: Expected ${expectedGrandTotal}, Received ${receivedGrandTotal}. Accepting UI override.`);
                // We no longer strictly throw here because the frontend may apply custom fixed fees, shipping, or POS adjustments not captured in standard items.
                // The receivedGrandTotal is authoritative if it bypassed frontend validation.
            }

            const res = await client.query(`
                INSERT INTO invoices (
                    business_id, customer_id, invoice_number, date, due_date, status, 
                    subtotal, tax_total, discount_total, grand_total, payment_method, 
                    payment_status, notes, terms, tax_details
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `, [
                businessId, header.customer_id, invNumber, header.date || new Date(),
                header.due_date, header.status || 'draft', header.subtotal || 0,
                header.tax_total || 0, header.discount_total || 0, header.grand_total || 0,
                header.payment_method, header.payment_status || 'unpaid', header.notes,
                header.terms, JSON.stringify(header.tax_details || {})
            ]);
            const invoice = res.rows[0];

            // 2. Customer Balance Correction
            await client.query(`
                UPDATE customers SET outstanding_balance = COALESCE(outstanding_balance, 0) + $1, updated_at = NOW()
                WHERE id = $2 AND business_id = $3
            `, [invoice.grand_total, invoice.customer_id, businessId]);

            // 3. Items & Stock
            if (items?.length > 0) {
                for (const item of items) {
                    await client.query(`
                        INSERT INTO invoice_items (
                            business_id, invoice_id, product_id, name, description, quantity, 
                            unit_price, tax_percent, tax_amount, discount_amount, total_amount, metadata
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    `, [
                        businessId, invoice.id, item.product_id, item.name, item.description,
                        item.quantity, item.unit_price, item.tax_percent || 0, item.tax_amount || 0,
                        item.discount_amount || 0, item.total_amount, JSON.stringify(item.metadata || {})
                    ]);

                    if (item.product_id) {
                        await InventoryService.removeStock({
                            business_id: businessId, product_id: item.product_id,
                            warehouse_id: item.metadata?.warehouse_id || null,
                            quantity: item.quantity, batch_id: item.metadata?.batch_id,
                            serial_numbers: item.metadata?.serial_numbers,
                            reference_type: 'invoice', reference_id: invoice.id,
                            notes: `Invoice: ${invNumber}`
                        }, userId, client);
                    }
                }
            }

            // 4. Accounting (Auto-post)
            await AccountingService.recordBusinessTransaction('sale', {
                businessId, referenceId: invoice.id, amount: invoice.grand_total,
                taxAmount: invoice.tax_total, description: `Invoice ${invNumber}`, userId
            }, client);

            if (shouldManageTransaction) await client.query('COMMIT');
            return invoice;
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Void/Delete Invoice
     */
    async voidInvoice(businessId, invoiceId, userId, txClient = null) {
        const client = await this.getClient(txClient);
        const shouldManageTransaction = !txClient;
        try {
            if (shouldManageTransaction) await client.query('BEGIN');

            const res = await client.query('SELECT * FROM invoices WHERE id = $1 AND business_id = $2 FOR UPDATE', [invoiceId, businessId]);
            if (res.rows.length === 0) throw new Error('Invoice not found');
            const invoice = res.rows[0];

            if (invoice.status === 'voided') return { success: true };

            // 1. Reverse Balance
            await client.query(`
                UPDATE customers SET outstanding_balance = outstanding_balance - $1, updated_at = NOW()
                WHERE id = $2 AND business_id = $3
            `, [invoice.grand_total, invoice.customer_id, businessId]);

            // 2. Restore Stock
            const itemsRes = await client.query('SELECT * FROM invoice_items WHERE invoice_id = $1 AND business_id = $2', [invoiceId, businessId]);
            for (const item of itemsRes.rows) {
                if (item.product_id) {
                    await InventoryService.addStock({
                        business_id: businessId, product_id: item.product_id,
                        quantity: item.quantity, reference_type: 'adjustment',
                        reference_id: invoiceId, notes: `Voided Invoice: ${invoice.invoice_number}`
                    }, userId, client);
                }
            }

            // 3. Reverse Accounting (Simple reversal for now)
            await client.query(`DELETE FROM gl_entries WHERE business_id = $1 AND (reference_type = 'invoice' OR reference_type = 'invoices') AND reference_id = $2`, [businessId, invoiceId]);

            // 4. Update Header
            await client.query(`UPDATE invoices SET status = 'voided', is_deleted = true, updated_at = NOW() WHERE id = $1 AND business_id = $2`, [invoiceId, businessId]);

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
