import {
    getBOMsAction,
    createBOMAction,
    getProductionOrdersAction,
    createProductionOrderAction,
    updateProductionOrderStatusAction,
    deleteBOMAction
} from '@/lib/actions/manufacturing';

export const manufacturingAPI = {
    // --- Bill of Materials (BOM) ---

    async getBOMs(businessId) {
        const result = await getBOMsAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.boms;
    },

    async createBOM(bomData) {
        const result = await createBOMAction(bomData);
        if (!result.success) throw new Error(result.error);
        return result.bom;
    },

    async deleteBOM(bomId) {
        const result = await deleteBOMAction(bomId);
        if (!result.success) throw new Error(result.error);
        return result.success;
    },

    // --- Production Orders ---

    async getProductionOrders(businessId) {
        const result = await getProductionOrdersAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.productionOrders;
    },

    async createProductionOrder(orderData) {
        const result = await createProductionOrderAction(orderData);
        if (!result.success) throw new Error(result.error);
        return result.productionOrder;
    },

    async updateStatus(businessId, orderId, status) {
        const result = await updateProductionOrderStatusAction(businessId, orderId, status);
        if (!result.success) throw new Error(result.error);
        return result.productionOrder;
    }
};
