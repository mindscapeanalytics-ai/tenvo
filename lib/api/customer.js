import {
    getCustomersAction,
    createCustomerAction,
    updateCustomerAction,
    deleteCustomerAction
} from '../actions/customer';

/**
 * Customer API Utility
 */
export const customerAPI = {
    async getAll(businessId) {
        const result = await getCustomersAction(businessId);
        if (!result.success) throw new Error(result.error);
        return { success: true, customers: result.customers };
    },

    async create(customerData) {
        const result = await createCustomerAction(customerData);
        if (!result.success) throw new Error(result.error);
        return result.customer;
    },

    async update(id, updates) {
        // We need businessId for the action for safety. 
        // If not provided in updates, caller needs to be updated or we fetch it.
        // Assuming updates contains business_id or caller provides it.
        const result = await updateCustomerAction(id, updates.business_id, updates);
        if (!result.success) throw new Error(result.error);
        return result.customer;
    },

    async delete(id, businessId) {
        const result = await deleteCustomerAction(id, businessId);
        if (!result.success) throw new Error(result.error);
        return true;
    }
};

