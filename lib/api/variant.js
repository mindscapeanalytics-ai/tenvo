import {
    createVariantAction,
    createVariantMatrixAction,
    getVariantMatrixAction,
    getProductVariantsAction,
    updateVariantStockAction,
    searchVariantsAction,
    updateVariantPricingAction,
    deleteVariantAction
} from '@/lib/actions/standard/inventory/variant';

/**
 * Variant API Wrapper
 * Client-safe layer that delegates to variant server actions.
 * Follows the same pattern as batchAPI, serialAPI, and manufacturingAPI.
 */
export const variantAPI = {
    /**
     * Create a product variant
     * @param {Object} variantData - Variant details
     */
    async create(variantData) {
        const result = await createVariantAction(variantData);
        if (!result.success) throw new Error(result.error);
        return result.variant;
    },

    /**
     * Get all variants for a product
     * @param {string} productId - Product UUID
     */
    async getByProduct(productId) {
        const result = await getProductVariantsAction(productId);
        if (!result.success) throw new Error(result.error);
        return result.variants;
    },

    /**
     * Update variant stock
     * @param {string} variantId - Variant UUID
     * @param {string} businessId - Business UUID
     * @param {number} quantityChange - Stock change amount
     */
    async updateStock(variantId, businessId, quantityChange) {
        const result = await updateVariantStockAction(variantId, businessId, quantityChange);
        if (!result.success) throw new Error(result.error);
        return result.variant;
    },

    /**
     * Update variant pricing (price, cost_price, mrp)
     * @param {string} variantId - Variant UUID
     * @param {string} businessId - Business UUID
     * @param {Object} pricingData - { price, costPrice, mrp }
     */
    async updatePricing(variantId, businessId, pricingData) {
        const result = await updateVariantPricingAction(variantId, businessId, pricingData);
        if (!result.success) throw new Error(result.error);
        return result.variant;
    },

    /**
     * Search variants by attributes
     * @param {string} businessId - Business UUID
     * @param {Object} filters - Search filters
     */
    async search(businessId, filters = {}) {
        const result = await searchVariantsAction(businessId, filters);
        if (!result.success) throw new Error(result.error);
        return result.variants;
    },

    /**
     * Create a variant matrix (Size x Color)
     * @param {Object} data - Matrix creation data
     */
    async createMatrix(data) {
        const result = await createVariantMatrixAction(data);
        if (!result.success) throw new Error(result.error);
        return result;
    },

    /**
     * Get variant matrix data
     * @param {string} productId - Product UUID
     */
    async getMatrix(productId) {
        const result = await getVariantMatrixAction(productId);
        if (!result.success) throw new Error(result.error);
        return result.matrixData;
    },

    /**
     * Delete a variant
     * @param {string} variantId - Variant UUID
     * @param {string} businessId - Business UUID
     */
    async delete(variantId, businessId) {
        const result = await deleteVariantAction(variantId, businessId);
        if (!result.success) throw new Error(result.error);
        return true;
    }
};
