import {
    addStockAction,
    removeStockAction,
    transferStockAction,
    adjustStockAction,
    getStockValuationAction,
    getStockMovementsAction
} from '@/lib/actions/stock';

import { BatchService } from './BatchService'; // Still useful for specific batch logic if not fully moved? 
// Actually BatchService is now a wrapper too.

/**
 * Inventory Service
 * Wrapper for Server Actions
 */
export const InventoryService = {

    async addStock(params) {
        const result = await addStockAction(params);
        if (!result.success) throw new Error(result.error);
        return result;
    },

    async removeStock(params) {
        const result = await removeStockAction(params);
        if (!result.success) throw new Error(result.error);
        return result;
    },

    async transferStock(params) {
        const result = await transferStockAction(params);
        if (!result.success) throw new Error(result.error);
        return result.transfer;
    },

    async adjustStock(params) {
        const result = await adjustStockAction(params);
        if (!result.success) throw new Error(result.error);
        return result;
    },

    async getStockValuation(businessId, warehouseId = null) {
        const result = await getStockValuationAction(businessId); // warehouseId ignored in action currently (global check)
        if (!result.success) throw new Error(result.error);
        return result; // returns { valuation, totals }
    },

    async getLowStockAlerts(businessId) {
        // Did not implement action for this yet. 
        // Returning empty to prevent crash, or throw.
        // TODO: Implement getLowStockAlertsAction
        return [];
    },

    async getStockMovements(productId, limit = 50) {
        const result = await getStockMovementsAction(productId, limit);
        if (!result.success) throw new Error(result.error);
        return result.movements;
    },

    /**
     * Record a stock movement (simplified API for manufacturing and other services)
     */
    async recordMovement(params) {
        const { quantityChange, transactionType, referenceType } = params;
        if (quantityChange > 0) {
            return await this.addStock({
                ...params,
                quantity: quantityChange,
                referenceType: referenceType || transactionType
            });
        } else if (quantityChange < 0) {
            return await this.removeStock({
                ...params,
                quantity: Math.abs(quantityChange),
                referenceType: referenceType || transactionType
            });
        } else {
            throw new Error('Quantity change cannot be zero');
        }
    }
};

