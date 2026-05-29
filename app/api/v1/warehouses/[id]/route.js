export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/api/_shared/middleware';
import { apiSuccess, apiError } from '@/lib/api/_shared/response';
import {
    getWarehouseLocationsAction,
    updateWarehouseLocationAction,
    deleteWarehouseLocationAction,
} from '@/lib/actions/standard/inventory/warehouse';

/**
 * Warehouse Detail API Routes
 *
 * GET    /api/v1/warehouses/[id] - Get single warehouse
 * PUT    /api/v1/warehouses/[id] - Update warehouse
 * DELETE /api/v1/warehouses/[id] - Delete warehouse
 *
 * Authentication: Required (withApiAuth middleware)
 * Authorization: Business membership required
 */

/**
 * GET /api/v1/warehouses/[id]
 */
export const GET = withApiAuth(async (request, { businessId, routeParams }) => {
    try {
        const warehouseId = routeParams?.params?.id;
        if (!warehouseId) {
            return apiError('MISSING_WAREHOUSE_ID', 'Warehouse ID is required', 400);
        }

        const result = await getWarehouseLocationsAction(businessId);
        if (!result.success) {
            return apiError('FETCH_WAREHOUSE_FAILED', result.error || 'Failed to fetch warehouses', 500);
        }

        const warehouse = (result.locations || []).find(w => w.id === warehouseId);
        if (!warehouse) {
            return apiError('WAREHOUSE_NOT_FOUND', 'Warehouse not found', 404);
        }

        return apiSuccess({ warehouse }, 200);
    } catch (error) {
        console.error('[GET /api/v1/warehouses/[id]] Error:', error);
        return apiError('FETCH_WAREHOUSE_FAILED', 'Failed to fetch warehouse', 500, { message: error.message });
    }
});

/**
 * PUT /api/v1/warehouses/[id]
 */
export const PUT = withApiAuth(async (request, { businessId, session, role, parsedBody, routeParams }) => {
    try {
        if (role === 'viewer') {
            return apiError('FORBIDDEN', 'Insufficient permissions. Viewers cannot update warehouses.', 403);
        }

        const warehouseId = routeParams?.params?.id;
        if (!warehouseId) {
            return apiError('MISSING_WAREHOUSE_ID', 'Warehouse ID is required', 400);
        }

        const body = parsedBody || {};

        const result = await updateWarehouseLocationAction(businessId, warehouseId, body);

        if (!result.success) {
            if (result.error?.includes('not found') || result.error?.includes('does not belong')) {
                return apiError('WAREHOUSE_NOT_FOUND', result.error, 404);
            }
            return apiError('UPDATE_WAREHOUSE_FAILED', result.error || 'Failed to update warehouse', 500);
        }

        return apiSuccess({ warehouse: result.location }, 200);
    } catch (error) {
        console.error('[PUT /api/v1/warehouses/[id]] Error:', error);

        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            return apiError('WAREHOUSE_NOT_FOUND', 'Warehouse not found or does not belong to this business', 404);
        }

        return apiError('UPDATE_WAREHOUSE_FAILED', 'Failed to update warehouse', 500, { message: error.message });
    }
});

/**
 * DELETE /api/v1/warehouses/[id]
 */
export const DELETE = withApiAuth(async (request, { businessId, session, role, routeParams }) => {
    try {
        if (role === 'viewer') {
            return apiError('FORBIDDEN', 'Insufficient permissions. Viewers cannot delete warehouses.', 403);
        }

        const warehouseId = routeParams?.params?.id;
        if (!warehouseId) {
            return apiError('MISSING_WAREHOUSE_ID', 'Warehouse ID is required', 400);
        }

        const result = await deleteWarehouseLocationAction(businessId, warehouseId);

        if (!result.success) {
            if (result.error?.includes('not found') || result.error?.includes('does not belong')) {
                return apiError('WAREHOUSE_NOT_FOUND', result.error, 404);
            }
            return apiError('DELETE_WAREHOUSE_FAILED', result.error || 'Failed to delete warehouse', 500);
        }

        return apiSuccess({ message: 'Warehouse deleted successfully', warehouseId }, 200);
    } catch (error) {
        console.error('[DELETE /api/v1/warehouses/[id]] Error:', error);

        if (error.message?.includes('not found') || error.message?.includes('does not belong')) {
            return apiError('WAREHOUSE_NOT_FOUND', 'Warehouse not found or does not belong to this business', 404);
        }

        return apiError('DELETE_WAREHOUSE_FAILED', 'Failed to delete warehouse', 500, { message: error.message });
    }
});
