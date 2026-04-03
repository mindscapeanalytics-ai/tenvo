'use server';

import pool from '@/lib/db';
import { actionSuccess, actionFailure, getErrorMessage } from '@/lib/actions/_shared/result';
import { withGuard } from '@/lib/rbac/serverGuard';
import { PurchaseService } from '@/lib/services/PurchaseService';
import { auditWrite } from '@/lib/actions/_shared/audit';

async function checkAuth(businessId, permission, client = null) {
    return withGuard(businessId, { permission, feature: 'purchases', client });
}

/**
 * Server Action: Get all purchases for a business (Read-only)
 */
export async function getPurchasesAction(businessId) {
    try {
        await checkAuth(businessId, 'purchases.view');
        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT p.*, v.name as vendor_name, v.email as vendor_email
                FROM purchases p
                LEFT JOIN vendors v ON p.vendor_id = v.id
                WHERE p.business_id = $1 AND (p.is_deleted = false OR p.is_deleted IS NULL)
                ORDER BY p.date DESC, p.created_at DESC
            `, [businessId]);
            return await actionSuccess({ purchases: result.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get purchases error:', error);
        return await actionFailure('GET_PURCHASES_FAILED', await getErrorMessage(error));
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
            const headerResult = await client.query(`
                SELECT p.*, v.name as vendor_name, v.email as vendor_email, v.phone as vendor_phone
                FROM purchases p
                LEFT JOIN vendors v ON p.vendor_id = v.id
                WHERE p.id = $1 AND p.business_id = $2
            `, [purchaseId, businessId]);

            if (headerResult.rows.length === 0) return actionFailure('PURCHASE_NOT_FOUND', 'Purchase not found');

            const purchase = headerResult.rows[0];
            const itemsResult = await client.query(`
                SELECT pi.*, pr.name as product_name, pr.sku as product_sku
                FROM purchase_items pi
                LEFT JOIN products pr ON pi.product_id = pr.id
                WHERE pi.purchase_id = $1
                ORDER BY pi.created_at
            `, [purchaseId]);

            purchase.items = itemsResult.rows;
            return await actionSuccess({ purchase });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get purchase by ID error:', error);
        return await actionFailure('GET_PURCHASE_BY_ID_FAILED', await getErrorMessage(error));
    }
}

/**
 * Server Action: Create purchase
 */
export async function createPurchaseAction(purchaseData) {
    try {
        const session = await checkAuth(purchaseData.business_id, 'purchases.create');
        const purchase = await PurchaseService.createPurchase(purchaseData, session.user.id);

        auditWrite({
            business_id: purchaseData.business_id,
            user_id: session.user.id,
            action: 'create_purchase',
            entity_type: 'purchase',
            entity_id: purchase.id,
            meta: { purchase_number: purchase.purchase_number, total_amount: purchase.total_amount }
        });

        return await actionSuccess({ purchase });
    } catch (error) {
        console.error('Create purchase error:', error);
        return await actionFailure('CREATE_PURCHASE_FAILED', await getErrorMessage(error));
    }
}

/**
 * Server Action: Update purchase status
 */
export async function updatePurchaseStatusAction(businessId, purchaseId, status) {
    try {
        const session = await checkAuth(businessId, 'purchases.approve');
        const result = await PurchaseService.updateStatus({ businessId, purchaseId, status }, session.user.id);

        auditWrite({
            business_id: businessId,
            user_id: session.user.id,
            action: 'update_purchase_status',
            entity_type: 'purchase',
            entity_id: purchaseId,
            meta: { status }
        });

        return result;
    } catch (error) {
        console.error('Update purchase status error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Create multiple purchase orders in bulk
 */
export async function createBulkPurchaseOrdersAction(businessId, orders) {
    try {
        const session = await checkAuth(businessId, 'purchases.create');
        const result = await PurchaseService.createBulkOrders(businessId, orders, session.user.id);
        return result;
    } catch (error) {
        console.error('Create bulk purchase orders error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Create an individual auto-reorder purchase order
 */
export async function createAutoReorderPOAction(params) {
    try {
        const session = await checkAuth(params.businessId, 'purchases.create');
        const purchase = await PurchaseService.createAutoReorderPO(params, session.user.id);
        return { success: true, purchaseId: purchase.id, purchaseNumber: purchase.purchase_number };
    } catch (error) {
        console.error('Create auto-reorder PO error:', error);
        return { success: false, error: error.message };
    }
}
