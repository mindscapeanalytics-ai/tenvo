import {
    getRecentStockAdjustmentsAction,
    getInventoryReservationsAction,
    expireOverdueReservationsAction,
    reserveStockAction,
    releaseStockAction
} from '@/lib/actions/standard/inventory/stock';

export const stockAPI = {
    async getRecentAdjustments(businessId, limit = 100) {
        if (!businessId) throw new Error('businessId is required');
        const result = await getRecentStockAdjustmentsAction(businessId, limit);
        if (!result.success) throw new Error(result.error || 'Failed to load stock adjustments');
        return result.adjustments || [];
    },

    async getReservations(businessId, status = 'all', limit = 200) {
        if (!businessId) throw new Error('businessId is required');
        const result = await getInventoryReservationsAction(businessId, status, limit);
        if (!result.success) throw new Error(result.error || 'Failed to load reservations');
        return result.reservations || [];
    },

    async expireOverdueReservations(businessId, limit = 200) {
        if (!businessId) throw new Error('businessId is required');
        const result = await expireOverdueReservationsAction(businessId, limit);
        if (!result.success) throw new Error(result.error || 'Failed to expire overdue reservations');
        return result;
    },

    async reserve(data) {
        if (!data?.business_id) throw new Error('business_id is required');
        const result = await reserveStockAction(data);
        if (!result.success) throw new Error(result.error || 'Failed to reserve stock');
        return result.reservation;
    },

    async release(data) {
        if (!data?.business_id) throw new Error('business_id is required');
        const result = await releaseStockAction(data);
        if (!result.success) throw new Error(result.error || 'Failed to release reservation');
        return result;
    }
};
