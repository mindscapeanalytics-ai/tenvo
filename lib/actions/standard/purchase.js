'use server';

import pool from '@/lib/db';
import { InventoryService } from '@/lib/services/InventoryService';
import { BatchService } from '@/lib/services/BatchService';
import { AccountingService } from '@/lib/services/AccountingService';
import { ACCOUNT_CODES } from '@/lib/config/accounting';
import { insertPurchaseItemCompat } from '@/lib/actions/_shared/purchaseItems';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { assertEntityBelongsToBusiness } from '@/lib/actions/_shared/tenant';
import { withGuard } from '@/lib/rbac/serverGuard';
import { auditWrite } from '@/lib/actions/_shared/audit';
import { purchaseSchema } from '@/lib/validation/schemas';
import { mapPurchaseItemsForDb, normalizePurchasePayload } from '@/lib/utils/purchasePayload';
import {
    normalizePurchaseStatus,
    canTransitionPurchaseStatus,
    PURCHASE_STATUSES,
} from '@/lib/constants/purchaseStatus';

async function checkAuth(businessId, permission, client = null) {
    return withGuard(businessId, { permission, feature: 'purchases', client });
}

/**
 * Receive stock on the same pg client as the purchase transaction.
 * Use reference_type `grn` so InventoryService does not double-post purchase GL
 * (purchase action owns Inventory ↔ AP journals).
 */
async function receivePurchaseLineStock({
    client,
    userId,
    businessId,
    warehouseId,
    purchaseId,
    purchaseNumber,
    item,
    batchNumber = null,
    expiryDate = null,
    manufacturingDate = null,
}) {
    const result = await InventoryService.addStock(
        {
            business_id: businessId,
            product_id: item.product_id,
            warehouse_id: warehouseId,
            quantity: Number(item.quantity),
            cost_price: Number(item.unit_cost || 0),
            batch_number: batchNumber || item.batch_number || null,
            expiry_date: expiryDate || item.expiry_date || null,
            manufacturing_date: manufacturingDate || item.manufacturing_date || null,
            reference_type: 'grn',
            reference_id: purchaseId,
            notes: `Purchase #${purchaseNumber}`,
        },
        userId,
        client
    );
    return result;
}

async function postPurchasePayableJournal({
    client,
    userId,
    businessId,
    date,
    purchaseNumber,
    purchaseId,
    totalAmount,
}) {
    await AccountingService.createJournalEntry(
        {
            businessId,
            userId,
            date,
            description: `Purchase #${purchaseNumber}`,
            referenceType: 'purchase',
            referenceId: purchaseId,
            entries: [
                { accountCode: ACCOUNT_CODES.INVENTORY_ASSET, debit: Number(totalAmount) || 0, credit: 0 },
                { accountCode: ACCOUNT_CODES.ACCOUNTS_PAYABLE, debit: 0, credit: Number(totalAmount) || 0 },
            ],
        },
        client
    );
}

/**
 * Server Action: Get all purchases for a business
 */
export async function getPurchasesAction(businessId) {
    try {
        await checkAuth(businessId, 'purchases.view');

        const client = await pool.connect();
        try {
            let result;
            try {
                result = await client.query(`
                    SELECT 
                        p.*,
                        v.name as vendor_name,
                        v.email as vendor_email
                    FROM purchases p
                    LEFT JOIN vendors v ON p.vendor_id = v.id
                    WHERE p.business_id = $1
                      AND (p.is_deleted = false OR p.is_deleted IS NULL)
                    ORDER BY p.date DESC, p.created_at DESC
                `, [businessId]);
            } catch (queryError) {
                if (queryError?.code !== '42703') {
                    throw queryError;
                }
                result = await client.query(`
                    SELECT 
                        p.*,
                        v.name as vendor_name,
                        v.email as vendor_email
                    FROM purchases p
                    LEFT JOIN vendors v ON p.vendor_id = v.id
                    WHERE p.business_id = $1
                    ORDER BY p.date DESC, p.created_at DESC
                `, [businessId]);
            }

            return actionSuccess({ purchases: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get purchases error:', error);
        return actionFailure('GET_PURCHASES_FAILED', await getErrorMessage(error));
    }
}

/**
 * Server Action: Get purchase by ID with items
 */
export async function getPurchaseByIdAction(businessId, purchaseId) {
    try {
        await checkAuth(businessId, 'purchases.view');

        const client = await pool.connect();
        try {
            // Get purchase header
            const headerResult = await client.query(`
                SELECT 
                    p.*,
                    v.name as vendor_name,
                    v.email as vendor_email,
                    v.phone as vendor_phone,
                    v.address as vendor_address,
                    v.city as vendor_city
                FROM purchases p
                LEFT JOIN vendors v ON p.vendor_id = v.id
                WHERE p.id = $1 AND p.business_id = $2
            `, [purchaseId, businessId]);

            if (headerResult.rows.length === 0) {
                return actionFailure('PURCHASE_NOT_FOUND', 'Purchase not found');
            }

            const purchase = headerResult.rows[0];

            // Get purchase items
            const itemsResult = await client.query(`
                SELECT 
                    pi.*,
                    pr.name as product_name,
                    pr.sku as product_sku
                FROM purchase_items pi
                JOIN purchases p ON p.id = pi.purchase_id
                LEFT JOIN products pr ON pi.product_id = pr.id
                WHERE pi.purchase_id = $1 AND p.business_id = $2
                ORDER BY pi.created_at
            `, [purchaseId, businessId]);

            purchase.items = itemsResult.rows;

            return actionSuccess({ purchase });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get purchase by ID error:', error);
        return actionFailure('GET_PURCHASE_BY_ID_FAILED', await getErrorMessage(error));
    }
}

/**
 * Server Action: Create purchase with full transaction support
 * Handles: purchase creation, items, batch creation, inventory update, GL entries
 */
export async function createPurchaseAction(purchaseData) {
    const client = await pool.connect();

    try {
        const { session } = await checkAuth(purchaseData.business_id, 'purchases.create', client);
        const userId = session?.user?.id || null;

        const normalizedPayload = normalizePurchasePayload({
            ...purchaseData,
            status: normalizePurchaseStatus(purchaseData.status) || PURCHASE_STATUSES.DRAFT,
            items: mapPurchaseItemsForDb(purchaseData.items || []),
        });

        const validation = purchaseSchema.safeParse(normalizedPayload);
        if (!validation.success) {
            const firstError = validation.error.errors[0]?.message || 'Invalid purchase data';
            return actionFailure('VALIDATION_ERROR', firstError);
        }

        const validated = validation.data;
        const items = validated.items;
        const header = { ...validated };
        delete header.items;

        if (header.status === PURCHASE_STATUSES.RECEIVED && !header.warehouse_id) {
            return actionFailure('WAREHOUSE_REQUIRED', 'Warehouse is required when receiving stock');
        }

        await client.query('BEGIN');

        await assertEntityBelongsToBusiness(client, 'vendor', header.vendor_id, header.business_id);
        await assertEntityBelongsToBusiness(client, 'warehouse', header.warehouse_id, header.business_id);

        const duplicatePurchase = await client.query(
            `SELECT id FROM purchases WHERE business_id = $1 AND purchase_number = $2 LIMIT 1`,
            [header.business_id, header.purchase_number]
        );
        if (duplicatePurchase.rows.length > 0) {
            await client.query('ROLLBACK');
            return actionFailure('DUPLICATE_PURCHASE_NUMBER', 'Purchase number already exists for this business');
        }

        // 1. Create Purchase Header
        const headerResult = await client.query(`
            INSERT INTO purchases (
                business_id, vendor_id, warehouse_id, purchase_number,
                date, subtotal, tax_total, total_amount, notes, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            header.business_id,
            header.vendor_id,
            header.warehouse_id || null,
            header.purchase_number,
            header.date || new Date().toISOString(),
            header.subtotal || 0,
            header.tax_total || 0,
            header.total_amount || 0,
            header.notes || null,
            header.status || PURCHASE_STATUSES.DRAFT
        ]);

        const purchase = headerResult.rows[0];

        if (!items || items.length === 0) {
            await client.query('COMMIT');
            return actionSuccess({ purchase });
        }

        const isReceived = header.status === PURCHASE_STATUSES.RECEIVED;

        // 2. Process Each Item
        const processedItems = [];
        for (const item of items) {
            await assertEntityBelongsToBusiness(client, 'product', item.product_id, header.business_id);
            let batchId = item.batch_id || null;

            // Draft with batch metadata: reserve a batch row (qty 0) so receive can find it later.
            // Received: InventoryService.addStock upserts batch + stock in one step.
            if (!isReceived && !batchId && item.batch_number) {
                const batch = await BatchService.createBatch(
                    {
                        business_id: header.business_id,
                        product_id: item.product_id,
                        warehouse_id: header.warehouse_id,
                        batch_number: item.batch_number,
                        manufacturing_date: item.manufacturing_date || null,
                        expiry_date: item.expiry_date || null,
                        quantity: 0,
                        cost_price: item.unit_cost,
                        notes: `Purchase #${header.purchase_number}`,
                    },
                    client
                );
                batchId = batch?.id || null;
            }

            let receivedBatchId = batchId;
            if (isReceived) {
                const stockResult = await receivePurchaseLineStock({
                    client,
                    userId,
                    businessId: header.business_id,
                    warehouseId: header.warehouse_id,
                    purchaseId: purchase.id,
                    purchaseNumber: header.purchase_number,
                    item,
                });
                receivedBatchId = stockResult?.batchId || batchId || null;
            }

            const itemResult = await insertPurchaseItemCompat(client, {
                businessId: header.business_id,
                purchaseId: purchase.id,
                productId: item.product_id,
                description: item.description,
                quantity: item.quantity,
                unitCost: item.unit_cost,
                taxRate: item.tax_rate,
                totalAmount: item.total_amount,
                batchId: receivedBatchId,
                withReturning: true,
            });

            processedItems.push(itemResult.rows[0]);
        }

        // 3. Create GL Entry & 4. Update Vendor Balance (ONLY IF RECEIVED)
        if (isReceived) {
            await postPurchasePayableJournal({
                client,
                userId,
                businessId: header.business_id,
                date: header.date,
                purchaseNumber: header.purchase_number,
                purchaseId: purchase.id,
                totalAmount: header.total_amount,
            });

            await client.query(`
                UPDATE vendors 
                SET outstanding_balance = COALESCE(outstanding_balance, 0) + $1,
                updated_at = NOW()
                WHERE id = $2 AND business_id = $3
            `, [header.total_amount, header.vendor_id, header.business_id]);
        }

        await client.query('COMMIT');

        return actionSuccess({
            purchase: {
                ...purchase,
                items: processedItems
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create purchase error:', error);
        if (error?.code === '23505') {
            return actionFailure('DUPLICATE_PURCHASE_NUMBER', 'Purchase number already exists for this business');
        }
        return actionFailure('CREATE_PURCHASE_FAILED', await getErrorMessage(error));
    } finally {
        client.release();
    }
}

/**
 * Server Action: Update purchase status and trigger stock movement if received
 */
export async function updatePurchaseStatusAction(businessId, purchaseId, status) {
    const client = await pool.connect();
    try {
        const { session } = await checkAuth(businessId, 'purchases.approve', client);
        const userId = session?.user?.id || null;

        const newStatus = normalizePurchaseStatus(status);
        if (!newStatus) {
            return actionFailure('INVALID_STATUS', 'Invalid purchase status');
        }

        await client.query('BEGIN');

        // 1. Get current purchase status and data
        const currentRes = await client.query(
            'SELECT status, vendor_id, total_amount, warehouse_id, purchase_number FROM purchases WHERE id = $1 AND business_id = $2 FOR UPDATE',
            [purchaseId, businessId]
        );

        if (currentRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return actionFailure('PURCHASE_NOT_FOUND', 'Purchase not found');
        }

        const purchase = currentRes.rows[0];
        const currentStatus = normalizePurchaseStatus(purchase.status);

        if (!canTransitionPurchaseStatus(currentStatus, newStatus)) {
            await client.query('ROLLBACK');
            return actionFailure(
                'INVALID_STATUS_TRANSITION',
                `Cannot change status from ${currentStatus || purchase.status} to ${newStatus}`
            );
        }

        if (newStatus === PURCHASE_STATUSES.RECEIVED && !purchase.warehouse_id) {
            await client.query('ROLLBACK');
            return actionFailure('WAREHOUSE_REQUIRED', 'Warehouse is required before marking as received');
        }

        // 2. If transitioning to 'received' and wasn't already received, process stock
        if (newStatus === PURCHASE_STATUSES.RECEIVED && currentStatus !== PURCHASE_STATUSES.RECEIVED) {
            const itemsRes = await client.query(
                `SELECT pi.*, pb.batch_number, pb.expiry_date AS batch_expiry_date, pb.manufacturing_date AS batch_mfg_date
                 FROM purchase_items pi
                 JOIN purchases p ON p.id = pi.purchase_id
                 LEFT JOIN product_batches pb ON pb.id = pi.batch_id AND pb.business_id = pi.business_id
                 WHERE pi.purchase_id = $1 AND p.business_id = $2`,
                [purchaseId, businessId]
            );

            for (const item of itemsRes.rows) {
                if (!item.product_id || Number(item.quantity) <= 0) continue;
                await receivePurchaseLineStock({
                    client,
                    userId,
                    businessId,
                    warehouseId: purchase.warehouse_id,
                    purchaseId,
                    purchaseNumber: purchase.purchase_number,
                    item,
                    batchNumber: item.batch_number || null,
                    expiryDate: item.batch_expiry_date || null,
                    manufacturingDate: item.batch_mfg_date || null,
                });
            }

            // 3. Create GL Entry
            await postPurchasePayableJournal({
                client,
                userId,
                businessId,
                date: new Date().toISOString(),
                purchaseNumber: purchase.purchase_number,
                purchaseId,
                totalAmount: purchase.total_amount,
            });

            // 4. Update Vendor Balance
            await client.query(`
                UPDATE vendors 
                SET outstanding_balance = COALESCE(outstanding_balance, 0) + $1,
                updated_at = NOW()
                WHERE id = $2 AND business_id = $3
            `, [purchase.total_amount, purchase.vendor_id, businessId]);
        }

        // 5. Update Status
        const result = await client.query(`
            UPDATE purchases 
            SET status = $1, updated_at = NOW()
            WHERE id = $2 AND business_id = $3
            RETURNING *
        `, [newStatus, purchaseId, businessId]);

        await client.query('COMMIT');

        // Audit log
        auditWrite({
            businessId: businessId,
            action: 'update',
            entityType: 'purchase',
            entityId: purchaseId,
            description: `Updated purchase status to ${newStatus}`,
            metadata: { previousStatus: purchase.status, newStatus, total: purchase.total_amount }
        });

        return actionSuccess({ purchase: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update purchase status error:', error);
        return actionFailure('UPDATE_PURCHASE_STATUS_FAILED', await getErrorMessage(error));
    } finally {
        client.release();
    }
}

/**
 * Server Action: Create multiple purchase orders in bulk (Smart Restock Integration)
 */
export async function createBulkPurchaseOrdersAction(businessId, orders) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, 'purchases.create', client);

        await client.query('BEGIN');

        for (const orderData of orders) {
            const purchase_number = orderData.purchase_number || `PO-AI-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            await assertEntityBelongsToBusiness(client, 'vendor', orderData.vendor_id, businessId);
            await assertEntityBelongsToBusiness(client, 'warehouse', orderData.warehouse_id, businessId);
            await assertEntityBelongsToBusiness(client, 'product', orderData.product_id, businessId);

            // Create PO Header
            const headerResult = await client.query(`
                INSERT INTO purchases (
                    business_id, vendor_id, warehouse_id, purchase_number,
                    date, subtotal, tax_total, total_amount, notes, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            `, [
                businessId,
                orderData.vendor_id || null,
                orderData.warehouse_id || null,
                purchase_number,
                new Date().toISOString(),
                orderData.subtotal || 0,
                0,
                orderData.total_amount || 0,
                orderData.notes || 'Generated by Smart Restock Engine',
                'draft'
            ]);

            const purchaseId = headerResult.rows[0].id;

            // Create PO Item
            await insertPurchaseItemCompat(client, {
                businessId,
                purchaseId,
                productId: orderData.product_id,
                description: orderData.description || 'Restock item',
                quantity: orderData.quantity,
                unitCost: orderData.unit_cost || 0,
                totalAmount: orderData.total_amount || 0,
            });

            // Keep header totals aligned with lines (covers partial payloads / rounding).
            const sumRes = await client.query(
                `SELECT COALESCE(SUM(total_amount), 0)::numeric AS s FROM purchase_items WHERE purchase_id = $1`,
                [purchaseId]
            );
            const lineSum = Number(sumRes.rows[0]?.s ?? 0);
            await client.query(
                `UPDATE purchases SET subtotal = $1, total_amount = $1, updated_at = NOW()
                 WHERE id = $2 AND business_id = $3`,
                [lineSum, purchaseId, businessId]
            );
        }

        await client.query('COMMIT');
        return actionSuccess({ message: `Successfully created ${orders.length} draft purchase orders` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create bulk purchase orders error:', error);
        return actionFailure('BULK_PURCHASE_FAILED', await getErrorMessage(error));
    } finally {
        client.release();
    }
}

/**
 * Server Action: Create an individual auto-reorder purchase order
 */
export async function createAutoReorderPOAction(params) {
    const { businessId, productId, quantity, vendorId } = params;
    const client = await pool.connect();

    try {
        await checkAuth(businessId, 'purchases.create', client);

        await client.query('BEGIN');

        // 1. Get Product and Vendor details
        const pRes = await client.query(
            'SELECT name, sku, cost_price FROM products WHERE id = $1 AND business_id = $2 AND is_deleted = false',
            [productId, businessId]
        );
        if (pRes.rows.length === 0) throw new Error('Product not found');
        const product = pRes.rows[0];

        await assertEntityBelongsToBusiness(client, 'vendor', vendorId, businessId);

        const purchase_number = `PO-AUTO-${Date.now()}`;
        const total_amount = (product.cost_price || 0) * quantity;

        // 2. Create PO Header
        const headerResult = await client.query(`
            INSERT INTO purchases (
                business_id, vendor_id, purchase_number,
                date, subtotal, total_amount, notes, status
            ) VALUES ($1, $2, $3, NOW(), $4, $4, $5, 'draft')
            RETURNING id
        `, [
            businessId,
            vendorId || null,
            purchase_number,
            total_amount,
            `Auto-generated PO for low stock item: ${product.name}`
        ]);

        const purchaseId = headerResult.rows[0].id;

        // 3. Create PO Item
        await insertPurchaseItemCompat(client, {
            businessId,
            purchaseId,
            productId,
            description: `Restock for ${product.name} (SKU: ${product.sku})`,
            quantity,
            unitCost: product.cost_price || 0,
            totalAmount: total_amount,
        });

        await client.query('COMMIT');

        return actionSuccess({ purchaseId, purchase_number: purchase_number, purchaseNumber: purchase_number });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create auto-reorder PO error:', error);
        return actionFailure('AUTO_REORDER_PO_FAILED', await getErrorMessage(error));
    } finally {
        client.release();
    }
}
