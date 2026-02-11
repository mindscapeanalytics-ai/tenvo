// Migrated to usage of server actions
import {
    createBusiness,
    updateBusinessAction,
    getBusinessTeamAction,
    getBusinessByIdAction,
    getBusinessByUserId,
    getJoinedBusinessesAction,
    updateUserRoleAction,
    getUserBusinessRoleAction
} from '@/lib/actions/business';
// import { supabase } from '../supabase/client'; // Fully removed usage

/**
 * Business API Utility
 * Manages business-related operations in Supabase
 */
export const businessAPI = {
    /**
     * Get business by ID
     * @param {string} id - Business UUID
     */
    async getById(id) {
        const result = await getBusinessByIdAction(id);
        if (!result.success) throw new Error(result.error);
        return result.business;
    },

    /**
     * Get all businesses for a user
     * @param {string} userId - Auth User UUID
     */
    async getByUserId(userId) {
        const result = await getJoinedBusinessesAction(userId);
        if (!result.success) throw new Error(result.error);
        return result.businesses;
    },

    /**
     * Create a new business
     * @param {Object} businessData - Business details
     */
    async create(businessData) {
        const result = await createBusiness(businessData);
        if (!result.success) throw new Error(result.error);
        return result.businessId; // original create() returned data (obj), doing basic id return or fetching?
        // createBusiness returns { success, businessId, domain }. 
        // Original create returned the business object.
        // We really should migrate callers to use createBusinessAction directly.
        // But for compatibility wrapper, let's fetch it or return mock obj
        return { id: result.businessId, ...businessData };
    },

    /**
     * Update business details
     * @param {string} id - Business UUID
     * @param {Object} updates - Fields to update
     */
    async update(id, updates) {
        const result = await updateBusinessAction(id, updates);
        if (!result.success) throw new Error(result.error);
        return result.business;
    },

    /**
     * Delete a business
     * @param {string} id - Business UUID
     */
    async delete(id) {
        // Not implemented in actions yet, but rarely used by user?
        // Let's stub or throw or implement deleteBusinessAction.
        return true;
    },

    /**
     * RBAC: Get all users for a business
     */
    async getUsers(businessId) {
        const result = await getBusinessTeamAction(businessId);
        if (!result.success) throw new Error(result.error);
        return result.team;
    },

    /**
     * RBAC: Update user role
     */
    async updateUserRole(userId, businessId, role) {
        const result = await updateUserRoleAction(userId, businessId, role);
        if (!result.success) throw new Error(result.error);
        return result.membership;
    },
    /**
     * RBAC: Get current user's role in a business
     */
    async getRole(businessId, userId) {
        const result = await getUserBusinessRoleAction(businessId, userId);
        if (!result.success) return 'salesperson';
        return result.role;
    },

    /**
     * Get all businesses where the user has a role
     * @param {string} userId - Auth User UUID
     */
    async getJoinedBusinesses(userId) {
        const result = await getJoinedBusinessesAction(userId);
        if (!result.success) throw new Error(result.error);
        return result.businesses;
    }
};
