// Migrated to server actions - see lib/actions/vendor.js
import {
    getVendorsAction,
    getVendorByIdAction,
    createVendorAction,
    updateVendorAction,
    deleteVendorAction
} from '@/lib/actions/basic/vendor';
import { createApiError } from '@/lib/api/_shared/error';

export const vendorAPI = {
    async getAll(businessId) {
        const result = await getVendorsAction(businessId);
        if (!result.success) throw createApiError(result);
        return result.vendors;
    },

    async getById(businessId, id) {
        const result = await getVendorByIdAction(businessId, id);
        if (!result.success) throw createApiError(result);
        return result.vendor;
    },

    async create(vendor) {
        const result = await createVendorAction(vendor);
        if (!result.success) throw createApiError(result);
        return result.vendor;
    },

    async update(arg1, arg2, arg3) {
        let businessId, id, updates;
        if (arguments.length === 2) {
            id = arg1;
            updates = arg2;
            businessId = updates?.business_id;
        } else {
            businessId = arg1;
            id = arg2;
            updates = arg3;
        }
        if (!businessId) {
            throw new Error('Vendor update requires business_id');
        }
        const result = await updateVendorAction(businessId, id, updates);
        if (!result.success) throw createApiError(result);
        return result.vendor;
    },

    async delete(arg1, arg2) {
        let businessId, id;
        if (arguments.length === 1) {
            id = arg1;
        } else {
            businessId = arg1;
            id = arg2;
        }
        if (!businessId) {
            throw new Error('Vendor delete requires business_id');
        }
        const result = await deleteVendorAction(businessId, id);
        if (!result.success) throw createApiError(result);
        return true;
    }
};
