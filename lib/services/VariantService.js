import {
    createVariantAction,
    createVariantMatrixAction,
    getVariantMatrixAction,
    getProductVariantsAction,
    updateVariantStockAction,
    searchVariantsAction
} from '../actions/variant';

/**
 * Variant Management Service
 * Now acts as a wrapper around Server Actions
 */
export const VariantService = {

    /**
     * Create a product variant
     */
    async createVariant(variantData) {
        const result = await createVariantAction(variantData);
        if (!result.success) throw new Error(result.error);
        return result.variant;
    },

    /**
     * Get all variants for a product
     */
    async getProductVariants(productId) {
        const result = await getProductVariantsAction(productId);
        if (!result.success) throw new Error(result.error);
        return result.variants;
    },

    /**
     * Update variant stock
     */
    async updateVariantStock(variantId, quantityChange, businessId) {
        const result = await updateVariantStockAction(variantId, businessId, quantityChange);
        if (!result.success) throw new Error(result.error);
        return result.variant;
    },

    /**
     * Search variants by attributes
     */
    async searchVariants(businessId, filters = {}) {
        const result = await searchVariantsAction(businessId, filters);
        if (!result.success) throw new Error(result.error);
        return result.variants;
    },

    /**
     * Create a variant matrix (Size x Color)
     */
    async createVariantMatrix(data) {
        const result = await createVariantMatrixAction(data);
        if (!result.success) throw new Error(result.error);
        return result;
    },

    /**
     * Get variant matrix data
     */
    async getVariantMatrix(productId) {
        const result = await getVariantMatrixAction(productId);
        if (!result.success) throw new Error(result.error);
        return result.matrixData;
    }
    // ... Additional matrix methods can be implemented as needed
};
