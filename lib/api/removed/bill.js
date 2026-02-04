import {
    getPurchasesAction,
    createPurchaseAction,
    updatePurchaseStatusAction
} from '../actions/purchase';

/**
 * Bill API Utility (Purchases)
 */
export const billAPI = {
    async getAll(businessId) {
        const result = await getPurchasesAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.purchases;
    },

    async create(billData, items = []) {
        const result = await createPurchaseAction({ ...billData, items });
        if (!result.success) throw new Error(result.error);
        return result.purchase;
    },

    async updateStatus(id, status, businessId) {
        const result = await updatePurchaseStatusAction(businessId, id, status);
        if (!result.success) throw new Error(result.error);
        return result.purchase;
    }
};
