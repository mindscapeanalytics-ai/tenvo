import {
    getVendorsAction,
    createVendorAction,
    updateVendorAction,
    deleteVendorAction
} from '../actions/vendor';

/**
 * Vendor API Utility
 */
export const vendorAPI = {
    async getAll(businessId) {
        const result = await getVendorsAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.vendors;
    },

    async create(vendorData) {
        const result = await createVendorAction(vendorData);
        if (!result.success) throw new Error(result.error);
        return result.vendor;
    },

    async update(id, businessId, updates) {
        const result = await updateVendorAction(id, businessId, updates);
        if (!result.success) throw new Error(result.error);
        return result.vendor;
    },

    async delete(id, businessId) {
        const result = await deleteVendorAction(id, businessId);
        if (!result.success) throw new Error(result.error);
        return true;
    }
};
