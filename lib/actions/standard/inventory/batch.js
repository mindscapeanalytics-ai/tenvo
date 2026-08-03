'use server';

import { withGuard } from '@/lib/rbac/serverGuard';
import { BatchService } from '@/lib/services/BatchService';

async function checkAuth(businessId, permission = 'inventory.view', feature = null) {
    const { session } = await withGuard(businessId, {
        permission,
        ...(feature ? { feature } : {}),
    });
    return session;
}

/**
 * Server Action: Create Batch
 */
export async function createBatchAction(batchData) {
    try {
        await checkAuth(batchData.business_id, 'inventory.create', 'batch_tracking');
        const batch = await BatchService.createBatch(batchData);
        return { success: true, batch };
    } catch (error) {
        console.error('Create Batch Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Batches for a Product
 */
export async function getBatchesAction(productId, businessId) {
    try {
        await checkAuth(businessId, 'inventory.view', 'batch_tracking');
        const batches = await BatchService.getProductBatches(productId, businessId);
        return { success: true, batches };
    } catch (error) {
        console.error('Get Batches Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update Batch
 */
export async function updateBatchAction(batchId, businessId, updates) {
    try {
        await checkAuth(businessId, 'inventory.edit', 'batch_tracking');
        const batch = await BatchService.updateBatch(batchId, businessId, updates);
        return { success: true, batch };
    } catch (error) {
        console.error('Update Batch Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Delete Batch
 */
export async function deleteBatchAction(batchId, businessId) {
    try {
        await checkAuth(businessId, 'inventory.delete', 'batch_tracking');
        await BatchService.deleteBatch(batchId, businessId);
        return { success: true };
    } catch (error) {
        console.error('Delete Batch Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Expiring Batches
 */
export async function getExpiringBatchesAction(businessId, daysThreshold = 30) {
    try {
        await checkAuth(businessId, 'inventory.view', 'batch_tracking');
        const batches = await BatchService.getExpiringBatches(businessId, daysThreshold);
        return { success: true, batches };
    } catch (error) {
        console.error('Get Expiring Batches Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Available Batches (Qty > 0 & Not Expired)
 */
export async function getAvailableBatchesAction(productId, businessId) {
    try {
        await checkAuth(businessId, 'inventory.view', 'batch_tracking');
        const batches = await BatchService.getAvailableBatches(productId, businessId);
        return { success: true, batches };
    } catch (error) {
        console.error('Get Available Batches Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update Batch Quantity (Atomic)
 */
export async function updateBatchQuantityAction(batchId, businessId, quantityChange, isReservation = false) {
    try {
        await checkAuth(businessId, 'inventory.adjust_stock', 'batch_tracking');
        const batch = await BatchService.updateBatchQuantity(batchId, businessId, quantityChange, isReservation);
        return { success: true, batch };
    } catch (error) {
        console.error('Update Batch Quantity Error:', error);
        return { success: false, error: error.message };
    }
}
