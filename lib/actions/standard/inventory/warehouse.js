'use server';

import { withGuard } from '@/lib/rbac/serverGuard';
import { WarehouseService } from '@/lib/services/WarehouseService';
import pool from '@/lib/db';

async function checkAuthAndPlan(businessId, permission = 'warehouses.view', feature = 'multi_warehouse', options = {}) {
    if (options.skipAuth) return null;
    const { session } = await withGuard(businessId, { permission, feature });
    return session;
}

/**
 * Server Action: Get all warehouse locations for a business
 * @param {string} businessId
 * @param {{ skipAuth?: boolean }} [options] - Nested callers (hub shell bootstrap) already ran withGuard.
 */
export async function getWarehouseLocationsAction(businessId, options = {}) {
    try {
        await checkAuthAndPlan(businessId, 'warehouses.view', 'multi_warehouse', options);
        const locations = await WarehouseService.getWarehouses(businessId);
        return { success: true, locations };
    } catch (error) {
        console.error('Get warehouse locations error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Create warehouse location
 */
export async function createWarehouseLocationAction(locationData) {
    try {
        await checkAuthAndPlan(locationData.business_id, 'warehouses.manage', 'multi_warehouse');

        // Validation: Validate input data
        const { createWarehouseLocationSchema } = await import('@/lib/validation/schemas');
        const validated = createWarehouseLocationSchema.safeParse(locationData);

        if (!validated.success) {
            const errors = validated.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: `Validation failed: ${errors}` };
        }

        const location = await WarehouseService.createWarehouse(validated.data);
        return { success: true, location };
    } catch (error) {
        console.error('Create warehouse location error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update warehouse location
 */
export async function updateWarehouseLocationAction(businessId, locationId, updates) {
    try {
        await checkAuthAndPlan(businessId, 'warehouses.manage', 'multi_warehouse');

        // Validation: Validate input data
        const { updateWarehouseLocationSchema } = await import('@/lib/validation/schemas');
        const validated = updateWarehouseLocationSchema.safeParse({ ...updates, business_id: businessId });

        if (!validated.success) {
            const errors = validated.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: `Validation failed: ${errors}` };
        }

        const location = await WarehouseService.updateWarehouse(locationId, businessId, validated.data);
        return { success: true, location };
    } catch (error) {
        console.error('Update warehouse location error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get location stock levels
 */
export async function getLocationStockAction(businessId) {
    try {
        await checkAuthAndPlan(businessId, 'warehouses.view', 'multi_warehouse');
        const stockLevels = await WarehouseService.getLocationStock(businessId);
        return { success: true, stockLevels };
    } catch (error) {
        console.error('Get location stock error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Delete warehouse location
 */
export async function deleteWarehouseLocationAction(businessId, locationId) {
    try {
        await checkAuthAndPlan(businessId, 'warehouses.manage', 'multi_warehouse');
        await WarehouseService.deleteWarehouse(locationId, businessId);
        return { success: true };
    } catch (error) {
        console.error('Delete warehouse location error:', error);
        return { success: false, error: error.message };
    }
}
