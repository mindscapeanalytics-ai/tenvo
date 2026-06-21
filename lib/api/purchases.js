// Migrated to server actions - see lib/actions/standard/purchase.js
import { getPurchasesAction, getPurchaseByIdAction, createPurchaseAction, updatePurchaseStatusAction, createAutoReorderPOAction } from '@/lib/actions/standard/purchase';

export const purchaseAPI = {
    async getAll(businessId) {
        const result = await getPurchasesAction(businessId);
        if (!result.success) throw new Error(result.error);
        return { success: true, purchaseOrders: result.purchases };
    },

    async getById(businessId, id) {
        const result = await getPurchaseByIdAction(businessId, id);
        if (!result.success) throw new Error(result.error);
        return result.purchase;
    },

    async create(payload, items = []) {
        // Handle both (payload) and (data, items) signatures
        const finalPayload = Array.isArray(items) && items.length > 0
            ? { ...payload, items }
            : payload;

        const result = await createPurchaseAction(finalPayload);
        if (!result.success) throw new Error(result.error);
        return result.purchase;
    },

    async updateStatus(businessId, id, status) {
        const result = await updatePurchaseStatusAction(businessId, id, status);
        if (!result.success) throw new Error(result.error);
        return result.purchase;
    },

    async createAutoReorderPO(businessId, productId, quantity, vendorId) {
        const result = await createAutoReorderPOAction({ businessId, productId, quantity, vendorId });
        if (!result.success) throw new Error(result.error);
        return result;
    },
};

export const purchaseOrderAPI = purchaseAPI;
export const billAPI = purchaseAPI;
