import {
    getProductsAction,
    createProductAction,
    updateProductAction,
    deleteProductAction
} from '../actions/product';
import { upsertIntegratedProductAction } from '../actions/inventory_composite';

/**
 * Product API Utility
 * Client-side wrapper for server actions
 */
export const productAPI = {
    async getAll(businessId) {
        const result = await getProductsAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.products;
    },

    async create(productData) {
        const result = await createProductAction(productData);
        if (!result.success) throw new Error(result.error);
        return result.product;
    },

    async upsertIntegrated(params) {
        const result = await upsertIntegratedProductAction(params);
        if (!result.success) throw new Error(result.error);
        return result.product;
    },

    async update(id, updates) {
        const result = await updateProductAction(id, updates.business_id, updates);
        if (!result.success) {
            const errorMsg = result.errors
                ? `Validation failed: ${JSON.stringify(result.errors)}`
                : result.error;
            throw new Error(errorMsg);
        }
        return result.product;
    },

    async delete(id, businessId) {
        const result = await deleteProductAction(id, businessId);
        if (!result.success) throw new Error(result.error);
        return true;
    }
};
