import {
    getBOMsAction,
    createBOMAction,
    getProductionOrdersAction,
    createProductionOrderAction,
    updateProductionOrderStatusAction
} from '../actions/manufacturing';

/**
 * Manufacturing Management Service
 */
export const ManufacturingService = {

    /**
     * Get all BOMs for a business
     */
    async getBOMs(businessId) {
        const result = await getBOMsAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.boms;
    },

    /**
     * Create a Bill of Materials
     */
    async createBOM(bomData) {
        const result = await createBOMAction(bomData);
        if (!result.success) throw new Error(result.error);
        return result.bom;
    },

    /**
     * Get all production orders
     */
    async getProductionOrders(businessId) {
        const result = await getProductionOrdersAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.productionOrders;
    },

    /**
     * Create a production order
     */
    async createProductionOrder(orderData) {
        const result = await createProductionOrderAction(orderData);
        if (!result.success) throw new Error(result.error);
        return result.productionOrder;
    },

    /**
     * Update production order status
     */
    async updateProductionOrderStatus(businessId, orderId, status) {
        const result = await updateProductionOrderStatusAction(businessId, orderId, status);
        if (!result.success) throw new Error(result.error);
        return result.productionOrder;
    }
};
