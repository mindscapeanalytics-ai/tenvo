
// Migrated to server actions - see lib/actions/standard/inventory/warehouse.js
import {
    getWarehouseLocationsAction,
    createWarehouseLocationAction,
    updateWarehouseLocationAction,
    deleteWarehouseLocationAction,
    getLocationStockAction
} from '@/lib/actions/standard/inventory/warehouse';
import { transferStockAction } from '@/lib/actions/standard/inventory/stock';

export const warehouseAPI = {
    // --- Locations ---

    async getLocations(businessId) {
        const result = await getWarehouseLocationsAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.locations;
    },

    async createLocation(locationData) {
        const result = await createWarehouseLocationAction(locationData);
        if (!result.success) throw new Error(result.error);
        return result.location;
    },

    async updateLocation(businessId, id, updates) {
        const result = await updateWarehouseLocationAction(businessId, id, updates);
        if (!result.success) throw new Error(result.error);
        return result.location;
    },

    async deleteLocation(businessId, id) {
        const result = await deleteWarehouseLocationAction(businessId, id);
        if (!result.success) throw new Error(result.error);
        return true;
    },

    // --- Stock Levels per Location ---

    async getLocationStock(businessId) {
        const result = await getLocationStockAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.stockLevels;
    },

    // --- Stock Transfers ---

    async createTransfer(transferData) {
        const firstItem = transferData.items?.[0] || {};

        // Use standardized snake_case payload expected by transferStockAction
        const result = await transferStockAction({
            business_id: transferData.business_id,
            product_id: firstItem.product_id,
            from_warehouse_id: transferData.from_location_id,
            to_warehouse_id: transferData.to_location_id,
            quantity: Number(firstItem.quantity || 0),
            batch_id: firstItem.batch_id || null,
            serial_numbers: firstItem.serial_numbers || [],
            notes: transferData.reason || 'Stock transfer'
        });

        if (!result.success) throw new Error(result.error);
        return result.transfer;
    }
};
