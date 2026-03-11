import pool from '@/lib/db';
import { insertPurchaseItemCompat } from '@/lib/actions/_shared/purchaseItems';
import { assertEntityBelongsToBusiness } from '@/lib/actions/_shared/tenant';
import { createModuleLogger } from './logging/logger';
import { recordAuditLog } from './audit/auditService';

const log = createModuleLogger('supplier-automation');

/**
 * SupplierAutomationService
 * 
 * Automates the procurement process:
 * - Identifying stock needs
 * - Requesting and managing supplier quotes
 * - Converting quotes to Purchase Orders
 */
export const SupplierAutomationService = {
    /**
     * Identify products that need reordering
     */
    async getReorderNeeds(businessId) {
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT id, name, sku, stock, min_stock, reorder_point, reorder_quantity, cost_price
                FROM products
                WHERE business_id = $1
                  AND is_active = true
                  AND stock <= COALESCE(reorder_point, min_stock)
            `, [businessId]);

            return res.rows.map(p => ({
                ...p,
                suggested_quantity: p.reorder_quantity || (p.min_stock * 2) - p.stock
            }));
        } finally {
            client.release();
        }
    },

    /**
     * Record a quote received from a supplier
     */
    async recordSupplierQuote(businessId, data) {
        const client = await pool.connect();
        try {
            const { vendor_id, product_id, quote_number, price, valid_until, notes } = data;

            await assertEntityBelongsToBusiness(client, 'vendor', vendor_id, businessId);
            await assertEntityBelongsToBusiness(client, 'product', product_id, businessId);

            const res = await client.query(`
                INSERT INTO supplier_quotes (
                    id, business_id, vendor_id, product_id, quote_number, price, 
                    valid_until, notes, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW()
                ) RETURNING id
            `, [businessId, vendor_id, product_id, quote_number, price, valid_until, notes]);

            const quoteId = res.rows[0].id;

            await recordAuditLog({
                businessId,
                action: 'record_supplier_quote',
                entityType: 'supplier_quote',
                entityId: quoteId,
                description: `Recorded quote ${quote_number} from vendor ${vendor_id}`,
            });

            return quoteId;
        } finally {
            client.release();
        }
    },

    /**
     * Select the best quote for a product and mark it
     */
    async selectBestQuote(businessId, productId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Unselect previous best
            await client.query(`
                UPDATE supplier_quotes SET is_selected = false 
                WHERE business_id = $1 AND product_id = $2
            `, [businessId, productId]);

            // 2. Find cheapest valid quote
            const res = await client.query(`
                UPDATE supplier_quotes
                SET is_selected = true, updated_at = NOW()
                WHERE id = (
                    SELECT id FROM supplier_quotes
                    WHERE business_id = $1 
                      AND product_id = $2
                      AND (valid_until IS NULL OR valid_until >= NOW())
                    ORDER BY price ASC
                    LIMIT 1
                )
                RETURNING id, vendor_id, price
            `, [businessId, productId]);

            await client.query('COMMIT');
            return res.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    /**
     * Convert a selected quote into a Purchase Order
     */
    async convertQuoteToPurchase(businessId, quoteId, warehouseId, userId = null) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Get quote details
            const quoteRes = await client.query(`
                SELECT q.*, p.name as product_name, p.reorder_quantity
                FROM supplier_quotes q
                JOIN products p ON q.product_id = p.id
                WHERE q.id = $1 AND q.business_id = $2 AND p.business_id = q.business_id
            `, [quoteId, businessId]);

            if (quoteRes.rows.length === 0) throw new Error('Quote not found');
            const quote = quoteRes.rows[0];

            await assertEntityBelongsToBusiness(client, 'vendor', quote.vendor_id, businessId);
            await assertEntityBelongsToBusiness(client, 'product', quote.product_id, businessId);
            await assertEntityBelongsToBusiness(client, 'warehouse', warehouseId, businessId);

            // 2. Create Purchase Order
            const purchaseNumber = `PO-${Date.now().toString().slice(-6)}`;
            const purchaseRes = await client.query(`
                INSERT INTO purchases (
                    id, business_id, purchase_number, vendor_id, date, 
                    total_amount, status, warehouse_id, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, NOW(), $4, 'pending', $5, NOW()
                ) RETURNING id
            `, [businessId, purchaseNumber, quote.vendor_id, quote.price * (quote.reorder_quantity || 1), warehouseId]);

            const purchaseId = purchaseRes.rows[0].id;

            // 3. Add item
            await insertPurchaseItemCompat(client, {
                businessId,
                purchaseId,
                productId: quote.product_id,
                description: `Automated reorder for ${quote.product_name}`,
                quantity: quote.reorder_quantity || 1,
                unitCost: quote.price,
                totalAmount: quote.price * (quote.reorder_quantity || 1),
                includeId: true,
            });

            await client.query('COMMIT');

            await recordAuditLog({
                businessId,
                action: 'convert_quote_to_po',
                entityType: 'purchase',
                entityId: purchaseId,
                description: `Converted quote ${quote.quote_number} to PO ${purchaseNumber}`,
                userId,
            });

            return { purchaseId, purchaseNumber };
        } catch (error) {
            await client.query('ROLLBACK');
            log.error('Failed to convert quote to PO', { error, quoteId });
            throw error;
        } finally {
            client.release();
        }
    }
};
