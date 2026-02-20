import pool from '@/lib/db';

/**
 * Verifies if a user has access to a specific business with optional role requirements
 * @param {string} userId - The user's ID
 * @param {string} businessId - The business ID to check access for
 * @param {string[]} requiredRoles - Optional array of roles that are allowed (e.g. ['owner', 'admin'])
 * @param {object} existingClient - Optional existing DB client to reuse
 * @returns {Promise<boolean>} - True if access is allowed
 * @throws {Error} - Throws "Unauthorized" if access is denied
 */
export async function verifyBusinessAccess(userId, businessId, requiredRoles = [], existingClient = null) {
    if (!userId || !businessId) {
        throw new Error('Unauthorized: Missing credentials');
    }

    const client = existingClient || await pool.connect();
    try {
        const res = await client.query(`
            SELECT role, status FROM business_users 
            WHERE user_id = $1 AND business_id = $2
        `, [userId, businessId]);

        if (res.rows.length === 0 || res.rows[0].status !== 'active') {
            // Failsafe: Check if user is the direct creator/owner in the businesses table
            const ownerCheck = await client.query(`
                SELECT id FROM businesses WHERE id = $1 AND user_id = $2
            `, [businessId, userId]);

            if (ownerCheck.rows.length > 0) {
                console.log(`[Access Failsafe] Auto-restoring missing business_users link for owner: ${userId} -> ${businessId}`);
                await client.query(`
                    INSERT INTO business_users (business_id, user_id, role, status)
                    VALUES ($1, $2, 'owner', 'active')
                    ON CONFLICT (business_id, user_id) 
                    DO UPDATE SET role = 'owner', status = 'active'
                `, [businessId, userId]);
                return true;
            }

            console.error(`[Access Denied] User: ${userId}, Business: ${businessId}. Reason: No active link found.`);
            throw new Error('Unauthorized: No access to this business');
        }

        const role = res.rows[0].role;

        // Check if role meets requirements if any are specified
        if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
            throw new Error(`Unauthorized: Role '${role}' does not have permission for this action`);
        }

        return true;
    } finally {
        if (!existingClient) {
            client.release();
        }
    }
}
