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

    async updateStatus(arg1, arg2, arg3) {
        let businessId, id, status;
        // Support (businessId, id, status) and (id, status, businessId)
        if (typeof arg2 === 'string' && (arg2 === 'pending' || arg2 === 'received' || arg2 === 'cancelled')) {
            // matches (id, status, businessId)
            id = arg1;
            status = arg2;
            businessId = arg3;
        } else {
            // matches (businessId, id, status)
            businessId = arg1;
            id = arg2;
            status = arg3;
        }

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
