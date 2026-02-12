import {
    addStockAction,
    removeStockAction,
    transferStockAction,
    adjustStockAction,
    getStockValuationAction,
    getStockMovementsAction,
    getLowStockAlertsAction
} from '@/lib/actions/stock';

import { BatchService } from './BatchService';
import { IntegrationEngine } from './integrations/integrationEngine';
import { AIOrderForecaster } from './ai/forecasting';
import { WorkflowEngine } from './workflows/workflowEngine';

/**
 * Inventory Service
 * Central Orchestration Layer for Stock and Intelligence
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
        const result = await getStockValuationAction(businessId, warehouseId);
        if (!result.success) throw new Error(result.error);
        return result;
    },

    async getLowStockAlerts(businessId) {
        const result = await getLowStockAlertsAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.alerts;
    },

    async getStockMovements(productId, limit = 50) {
        const result = await getStockMovementsAction(productId, limit);
        if (!result.success) throw new Error(result.error);
        return result.movements;
    },

    /**
     * AI & Orchestration Extensions (2026 Strategy)
     */
    async getAiRestockSuggestions(businessId) {
        // This would call the forecasting logic. 
        // Note: The UI currently calls the server action directly, 
        // but this provides a service-level entry point.
        return await AIOrderForecaster.forecastDemand(businessId);
    },

    async syncOmnichannel(productId, quantity) {
        return await IntegrationEngine.syncAll(productId, quantity);
    },

    async evaluateWorkflows(businessId, context) {
        return await WorkflowEngine.evaluateTriggers(businessId, context);
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
