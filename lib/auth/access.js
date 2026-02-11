import pool from '@/lib/db';

/**
 * Verifies if a user has access to a specific business with optional role requirements
 * @param {string} userId - The user's ID
 * @param {string} businessId - The business ID to check access for
 * @param {string[]} requiredRoles - Optional array of roles that are allowed (e.g. ['owner', 'admin'])
 * @returns {Promise<boolean>} - True if access is allowed
 * @throws {Error} - Throws "Unauthorized" if access is denied
 */
export async function verifyBusinessAccess(userId, businessId, requiredRoles = []) {
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

        const role = res.rows[0].role;

        // Check if role meets requirements if any are specified
        if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
            throw new Error(`Unauthorized: Role '${role}' does not have permission for this action`);
        }

        return true;
    } finally {
        client.release();
    }
}
