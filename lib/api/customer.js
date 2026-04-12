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
    async getAll(businessId) {
        const result = await getCustomersAction(businessId);
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

