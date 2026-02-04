
// Migrated to server actions - see lib/actions/warehouse.js
import {
    getWarehouseLocationsAction,
    createWarehouseLocationAction,
    updateWarehouseLocationAction,
    deleteWarehouseLocationAction,
    getLocationStockAction
} from '@/lib/actions/warehouse';
import { transferStockAction } from '@/lib/actions/stock';

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
        // Use the transferStockAction from stock.js
        const result = await transferStockAction({
            businessId: transferData.business_id,
            productId: transferData.items[0]?.product_id, // Simplified for single item
            fromWarehouseId: transferData.from_location_id,
            toWarehouseId: transferData.to_location_id,
            quantity: transferData.items[0]?.quantity,
            notes: 'Stock transfer'
        });

        if (!result.success) throw new Error(result.error);
        return result.transfer;
    }
};
