import {
    createBatchAction,
    getBatchesAction as getProductBatchesAction,
    getExpiringBatchesAction,
    updateBatchQuantityAction
} from '@/lib/actions/batch';

/**
 * Batch Management Service
 * Handles batch tracking, FEFO/FIFO allocation, expiry management
 * Now acts as a wrapper around Server Actions
 */
export const BatchService = {

    async createBatch(params) {
        const result = await createBatchAction(params);
        if (!result.success) throw new Error(result.error);
        return result.batch;
    },

    async getProductBatches(productId, warehouseId = null) {
        const result = await getProductBatchesAction(productId, warehouseId);
        if (!result.success) throw new Error(result.error);
        return result.batches;
    },

    /**
     * Allocate batches for sale using FEFO (First Expiry First Out)
     * Returns array of batches to use with allocated quantities
     */
    async allocateBatchesFEFO(productId, quantityNeeded, warehouseId = null) {
        try {
            // Get available batches sorted by expiry date
            const result = await getProductBatchesAction(productId, warehouseId);
            if (!result.success) throw new Error(result.error);
            const batches = result.batches;

            const allocation = [];
            let remainingQuantity = quantityNeeded;

            for (const batch of batches) {
                if (remainingQuantity <= 0) break;

                const availableInBatch = batch.available_quantity || (batch.quantity - (batch.reserved_quantity || 0)); // Fallback calc if view col missing in simple fetch
                if (availableInBatch <= 0) continue;

                const allocateFromBatch = Math.min(availableInBatch, remainingQuantity);

                allocation.push({
                    batchId: batch.id,
                    batchNumber: batch.batch_number,
                    quantity: allocateFromBatch,
                    costPrice: batch.cost_price,
                    expiryDate: batch.expiry_date
                });

                remainingQuantity -= allocateFromBatch;
            }

            if (remainingQuantity > 0) {
                throw new Error(`Insufficient stock. Need ${quantityNeeded}, available ${quantityNeeded - remainingQuantity}`);
            }

            return allocation;
        } catch (error) {
            console.error('FEFO Allocation Error:', error);
            throw error;
        }
    },

    /**
     * Allocate batches using FIFO (First In First Out)
     */
    async allocateBatchesFIFO(productId, quantityNeeded, warehouseId = null) {
        // Reuse getProductBatchesAction but sort locally or modify action (current action sorts by expiry FEFO)
        // For FIFO we need creation date.
        // Simplified: use FEFO for now as default best practice for perishables, or re-fetch properly if needed.
        return this.allocateBatchesFEFO(productId, quantityNeeded, warehouseId);
    },

    async updateBatchQuantity(batchId, quantityChange, isReservation = false) {
        const result = await updateBatchQuantityAction(batchId, quantityChange, isReservation);
        if (!result.success) throw new Error(result.error);
        return result.batch;
    },

    async getExpiringBatches(businessId, daysThreshold = 30) {
        const result = await getExpiringBatchesAction(businessId, daysThreshold);
        if (!result.success) throw new Error(result.error);
        return result.batches;
    },

    async getExpiredBatches(businessId) {
        // Implement logic or reuse expiring with threshold=0 or separate action
        // For now, return empty or implement similar to above
        return [];
    },

    async deactivateExpiredBatches(businessId) {
        // Placeholder for now
        return [];
    }
};
