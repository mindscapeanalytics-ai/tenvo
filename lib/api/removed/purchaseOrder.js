import {
    getPurchasesAction,
    createPurchaseAction,
    updatePurchaseStatusAction
} from '../actions/purchase';

/**
 * Purchase Order API Utility
 */
export const purchaseOrderAPI = {
    async getAll(businessId) {
        const result = await getPurchasesAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.purchases;
    },

    async create(poData, items) {
        const result = await createPurchaseAction({ ...poData, items });
        if (!result.success) throw new Error(result.error);
        return result.purchase;
    },

    async updateStatus(id, status, businessId) {
        const result = await updatePurchaseStatusAction(businessId, id, status);
        if (!result.success) throw new Error(result.error);
        return result.purchase;
    }
};

