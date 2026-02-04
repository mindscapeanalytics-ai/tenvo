import pool from '@/lib/db';

/**
 * Verifies if a user has access to a specific business
 * @param {string} userId - The user's ID
 * @param {string} businessId - The business ID to check access for
 * @param {string} requiredRole - Optional minimum role required (owner, admin, member) - NOT YET IMPLEMENTED FULLY
 * @returns {Promise<boolean>} - True if access is allowed
 * @throws {Error} - Throws "Unauthorized" if access is denied
 */
export async function verifyBusinessAccess(userId, businessId) {
    if (!userId || !businessId) {
        throw new Error('Unauthorized: Missing credentials');
    }

    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT role FROM business_users 
            WHERE user_id = $1 AND business_id = $2 AND status = 'active'
        `, [userId, businessId]);

        if (res.rows.length === 0) {
            throw new Error('Unauthorized: No access to this business');
        }

        // Future: Check role permissions if needed
        // const role = res.rows[0].role; 

        return true;
    } finally {
        client.release();
    }
}
