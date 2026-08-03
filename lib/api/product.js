import {
    getProductsAction,
    createProductAction,
    updateProductAction,
    deleteProductAction,
    bulkImportProductsAction,
    bulkExportProductsAction
} from '@/lib/actions/standard/inventory/product';
import {
    upsertIntegratedProductAction,
    bulkUpsertIntegratedProductsAction,
} from '@/lib/actions/premium/automation/inventory_composite';
import { createApiError } from '@/lib/api/_shared/error';

/**
 * Product API Utility
 * Client-side wrapper for server actions
 */
export const productAPI = {
    /**
     * List products. When limit/offset omitted, auto-pages the full catalog
     * (legacy callers expect complete pickers — never silently truncate at 500).
     */
    async getAll(businessId, options = {}) {
        const {
            unbounded,
            limit,
            offset,
            ...rest
        } = options || {};

        if (unbounded === true || (limit !== undefined && offset !== undefined)) {
            const result = await getProductsAction(businessId, options);
            if (!result.success) throw createApiError(result);
            return result.products;
        }

        const pageSize = Math.min(Math.max(Number(limit) || 200, 1), 200);
        const all = [];
        let cursor = 0;
        let pages = 0;
        let hasMore = true;
        while (hasMore && pages < 100) {
            const result = await getProductsAction(businessId, {
                ...rest,
                limit: pageSize,
                offset: cursor,
            });
            if (!result.success) throw createApiError(result);
            const chunk = result.products || [];
            all.push(...chunk);
            hasMore = Boolean(result.hasMore);
            cursor += pageSize;
            pages += 1;
            if (chunk.length === 0) break;
        }
        return all;
    },

    async create(productData) {
        const result = await createProductAction(productData);
        if (!result.success) throw createApiError(result);
        return result.product;
    },

    async upsertIntegrated(params) {
        const result = await upsertIntegratedProductAction(params);
        if (!result.success) throw createApiError(result);
        return result.product;
    },

    async bulkUpsertIntegrated(businessId, items, options = {}) {
        const result = await bulkUpsertIntegratedProductsAction(businessId, items, options);
        if (!result.success && result.failed?.length === result.total) {
            throw createApiError(result);
        }
        return result;
    },

    async update(id, updates) {
        const result = await updateProductAction(id, updates.business_id, updates);
        if (!result.success) {
            const apiResult = result.errors
                ? { ...result, error: `Validation failed: ${JSON.stringify(result.errors)}` }
                : result;
            throw createApiError(apiResult);
        }
        return result.product;
    },

    async delete(id, businessId) {
        const result = await deleteProductAction(id, businessId);
        if (!result.success) throw createApiError(result);
        return true;
    },

    async bulkExport(businessId, options = {}) {
        const result = await bulkExportProductsAction(businessId, options);
        if (!result.success) throw createApiError(result);
        return result;
    },

    async bulkImport(businessId, file, options = {}) {
        const result = await bulkImportProductsAction(businessId, file, options);
        if (!result.success) throw createApiError(result);
        return result;
    }
};
