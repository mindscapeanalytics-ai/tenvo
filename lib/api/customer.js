import {
    getCustomersAction,
    createCustomerAction,
    updateCustomerAction,
    deleteCustomerAction
} from '@/lib/actions/basic/customer';
import { createApiError } from '@/lib/api/_shared/error';

/**
 * Customer API Utility
 */
export const customerAPI = {
    /**
     * @param {string} businessId
     * @param {{ limit?: number | null; offset?: number; lean?: boolean }} [options]
     */
    async getAll(businessId, options = {}) {
        const result = await getCustomersAction(businessId, options);
        if (!result.success) throw createApiError(result);
        return result.customers;
    },

    async create(customerData) {
        const result = await createCustomerAction(customerData);
        if (!result.success) throw createApiError(result);
        return result.customer;
    },

    async update(id, updates) {
        const businessId = updates?.business_id;
        if (!businessId) {
            throw new Error('Customer update requires business_id');
        }
        const result = await updateCustomerAction(id, businessId, updates);
        if (!result.success) throw createApiError(result);
        return result.customer;
    },

    async delete(id, businessId) {
        const result = await deleteCustomerAction(id, businessId);
        if (!result.success) throw createApiError(result);
        return true;
    }
};

