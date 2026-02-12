import { createBatchAction, getBatchesAction, updateBatchAction, deleteBatchAction, getExpiringBatchesAction } from '@/lib/actions/standard/inventory/batch';

/**
 * Batch API Utility
 */
export const batchAPI = {
    /**
     * Create a new batch
     * @param {Object} batchData - Batch details
     */
    async create(batchData) {
        const result = await createBatchAction(batchData);
        if (!result.success) throw new Error(result.error);
        return result.batch;
    },

    /**
     * Get all batches for a product
     * @param {string} productId - Product UUID
     * @param {string} businessId - Business UUID
     */
    async getByProduct(productId, businessId) {
        const result = await getBatchesAction(productId, businessId);
        if (!result.success) throw new Error(result.error);
        return result.batches;
    },

    /**
     * Update batch
     * @param {string} batchId - Batch UUID
     * @param {string} businessId - Business UUID
     * @param {Object} updates - Fields to update
     */
    async update(batchId, businessId, updates) {
        const result = await updateBatchAction(batchId, businessId, updates);
        if (!result.success) throw new Error(result.error);
        return result.batch;
    },

    /**
     * Delete batch
     * @param {string} batchId - Batch UUID
     * @param {string} businessId - Business UUID
     */
    async delete(batchId, businessId) {
        const result = await deleteBatchAction(batchId, businessId);
        if (!result.success) throw new Error(result.error);
        return true;
    },

    /**
     * Get expiring batches
     * @param {string} businessId - Business UUID
     * @param {number} daysThreshold - Days until expiry (default 30)
     */
    async getExpiring(businessId, daysThreshold = 30) {
        const result = await getExpiringBatchesAction(businessId, daysThreshold);
        if (!result.success) throw new Error(result.error);
        return result.batches;
    }
};
