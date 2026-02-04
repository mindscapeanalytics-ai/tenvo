// Migrated to server actions - see lib/actions/vendor.js
import {
    getVendorsAction,
    getVendorByIdAction,
    createVendorAction,
    updateVendorAction,
    deleteVendorAction
} from '@/lib/actions/vendor';

export const vendorAPI = {
    async getAll(businessId) {
        const result = await getVendorsAction(businessId);
        if (!result.success) throw new Error(result.error);
        return { success: true, vendors: result.vendors };
    },

    async getById(businessId, id) {
        const result = await getVendorByIdAction(businessId, id);
        if (!result.success) throw new Error(result.error);
        return result.vendor;
    },

    async create(vendor) {
        const result = await createVendorAction(vendor);
        if (!result.success) throw new Error(result.error);
        return result.vendor;
    },

    async update(arg1, arg2, arg3) {
        let businessId, id, updates;
        if (arguments.length === 2) {
            id = arg1;
            updates = arg2;
            businessId = updates.business_id; // Try to get it from data
        } else {
            businessId = arg1;
            id = arg2;
            updates = arg3;
        }
        const result = await updateVendorAction(businessId, id, updates);
        if (!result.success) throw new Error(result.error);
        return result.vendor;
    },

    async delete(arg1, arg2) {
        let businessId, id;
        if (arguments.length === 1) {
            id = arg1;
            // For delete, we might need businessId. If missing, the action will fail.
            // But we'll try to support the simple id call if the action allows it (or needs fixing).
        } else {
            businessId = arg1;
            id = arg2;
        }
        const result = await deleteVendorAction(businessId, id);
        if (!result.success) throw new Error(result.error);
        return true;
    }
};
