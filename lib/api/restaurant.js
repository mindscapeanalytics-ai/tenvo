import {
    upsertTableAction,
    getTablesAction,
    updateTableStatusAction,
    createRestaurantOrderAction,
    updateOrderStatusAction,
    getActiveOrdersAction,
    getKitchenQueueAction,
    updateKitchenOrderAction
} from '@/lib/actions/standard/restaurant';

export const restaurantAPI = {
    // Tables
    async upsertTable(data) { return await upsertTableAction(data); },
    async getTables(businessId) { return await getTablesAction(businessId); },
    async updateTableStatus(data) { return await updateTableStatusAction(data); },

    // Orders
    async createOrder(data) { return await createRestaurantOrderAction(data); },
    async updateOrderStatus(data) { return await updateOrderStatusAction(data); },
    async getActiveOrders(businessId, filters) { return await getActiveOrdersAction(businessId, filters); },

    // Kitchen Display System
    async getKitchenQueue(businessId, station) { return await getKitchenQueueAction(businessId, station); },
    async updateKitchenOrder(data) { return await updateKitchenOrderAction(data); },
};
