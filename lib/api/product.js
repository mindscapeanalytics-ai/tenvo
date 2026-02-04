import {
    getProductsAction,
    createProductAction,
    updateProductAction,
    deleteProductAction
} from '../actions/product';

/**
 * Product API Utility
 * Client-side wrapper for server actions
 */
export const productAPI = {
    async getAll(businessId) {
        const result = await getProductsAction(businessId);
        if (!result.success) throw new Error(result.error);
        return { success: true, products: result.products };
    },

    async create(productData) {
        const result = await createProductAction(productData);
        if (!result.success) throw new Error(result.error);
        return result.product;
    },

    async update(id, updates) {
        const result = await updateProductAction(id, updates.business_id, updates);
        if (!result.success) throw new Error(result.error);
        return result.product;
    },

    async delete(id, businessId) {
        const result = await deleteProductAction(id, businessId);
        if (!result.success) throw new Error(result.error);
        return true;
    }
};
