'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { DEFAULT_COA } from '@/lib/config/accounting';

// Helper
async function checkAuth(businessId, requiredRoles = [], client = null) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error('Unauthorized');
    if (businessId) {
        // verifyBusinessAccess now checks roles and supports shared clients
        await verifyBusinessAccess(session.user.id, businessId, requiredRoles, client);
    }
    return session;
}

/**
 * Checks if a domain handle is available for use
 */
export async function checkDomainAvailabilityAction(domain) {
    if (!domain || domain.length < 3) return { success: true, available: false, error: 'Domain must be at least 3 characters' };

    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id FROM businesses WHERE domain = $1', [domain.toLowerCase()]);
        return {
            success: true,
            available: res.rows.length === 0,
            message: res.rows.length === 0 ? 'Available' : 'Taken'
        };
    } catch (error) {
        console.error('Check Domain Availability Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function createBusiness(data) {
    const {
        userId,
        businessName,
        email,
        phone,
        country,
        domain,
        category
    } = data;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 0. Domain Uniqueness Guard (Critical for Multi-Tenant)
        const domainCheck = await client.query('SELECT id FROM businesses WHERE domain = $1', [domain]);
        if (domainCheck.rows.length > 0) {
            throw new Error(`Domain Handle "${domain}" is already taken. Please choose a different unique identifier.`);
        }

        // 0.1 Duplicate Entity Prevention (Enterprise Standard)
        // Prevent the same owner from creating the exact same business name multiple times
        const duplicateCheck = await client.query(`
            SELECT id FROM businesses 
            WHERE user_id = $1 AND LOWER(business_name) = LOWER($2)
        `, [userId, businessName]);

        if (duplicateCheck.rows.length > 0) {
            throw new Error(`You already have a business named "${businessName}". Please choose a different name or manage your existing entity.`);
        }

        // 1. Insert Business
        const bizRes = await client.query(`
            INSERT INTO businesses (
                user_id, business_name, email, phone, country, domain, category
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `, [userId, businessName, email, phone, country, domain, category]);

        const businessId = bizRes.rows[0].id;

        // 2. Insert Business User (Owner)
        await client.query(`
            INSERT INTO business_users (
                business_id, user_id, role, status
            ) VALUES ($1, $2, $3, $4)
        `, [businessId, userId, 'owner', 'active']);

        // 3. Seed Standard Chart of Accounts (COA)
        for (const acc of DEFAULT_COA) {
            await client.query(`
                INSERT INTO gl_accounts (business_id, code, name, type, is_system)
                VALUES ($1, $2, $3, $4, true)
            `, [businessId, acc.code, acc.name, acc.type]);
        }

        await client.query('COMMIT');

        return { success: true, businessId, domain };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in createBusiness:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function getBusinessByUserId(userId) {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT b.*, bu.role as user_role
            FROM businesses b
            JOIN business_users bu ON b.id = bu.business_id
            WHERE bu.user_id = $1 AND bu.status = 'active'
            ORDER BY bu.created_at DESC
            LIMIT 1
        `, [userId]);

        if (res.rows.length > 0) {
            return { success: true, business: res.rows[0] };
        }
        return { success: true, business: null };
    } catch (error) {
        console.error('Error in getBusinessByUserId:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Fetch a specific business by domain and user ID
 */
export async function getBusinessByDomainAndUser(domain, userId) {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT b.*, bu.role as user_role
            FROM businesses b
            JOIN business_users bu ON b.id = bu.business_id
            WHERE bu.user_id = $1 AND b.domain = $2 AND bu.status = 'active'
            LIMIT 1
        `, [userId, domain]);

        if (res.rows.length > 0) {
            return { success: true, business: res.rows[0] };
        }

        // SELF-HEALING MECHANISM
        // If standard access check fails, check if user is the actual CREATOR of the business.
        // This covers cases where the business_users link might be missing or inactive.
        const ownerCheck = await client.query(`
            SELECT * FROM businesses WHERE domain = $1 AND user_id = $2
        `, [domain, userId]);

        if (ownerCheck.rows.length > 0) {
            const biz = ownerCheck.rows[0];
            console.log(`[Self-Healing] Restoring lost access for verified owner: ${userId} -> ${biz.domain}`);

            // Automatically restore the link
            await client.query(`
                INSERT INTO business_users (business_id, user_id, role, status)
                VALUES ($1, $2, 'owner', 'active')
                ON CONFLICT (business_id, user_id) 
                DO UPDATE SET role = 'owner', status = 'active'
            `, [biz.id, userId]);

            return {
                success: true,
                business: { ...biz, user_role: 'owner' }
            };
        }

        return { success: false, error: 'Business not found or access denied' };

    } catch (error) {
        console.error('Error in getBusinessByDomainAndUser:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function updateBusinessAction(businessId, updates) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, ['owner', 'admin'], client);

        // Filter allowed fields for security
        const { business_name, email, phone, address, city, ntn, settings } = updates;

        // Build dynamic query
        const fields = [];
        const values = [];
        let idx = 1;

        if (business_name !== undefined) { fields.push(`business_name = $${idx++}`); values.push(business_name); }
        if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
        if (phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(phone); }
        if (address !== undefined) { fields.push(`address = $${idx++}`); values.push(address); }
        if (city !== undefined) { fields.push(`city = $${idx++}`); values.push(city); }
        if (ntn !== undefined) { fields.push(`ntn = $${idx++}`); values.push(ntn); }
        if (settings !== undefined) { fields.push(`settings = $${idx++}`); values.push(settings); }

        if (fields.length === 0) return { success: true, message: 'No changes' };

        values.push(businessId);

        const result = await client.query(`
            UPDATE businesses 
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE id = $${idx}
            RETURNING *
        `, values);

        return { success: true, business: result.rows[0] };
    } catch (error) {
        console.error('Update Business Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function getBusinessTeamAction(businessId) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, [], client);

        const result = await client.query(`
            SELECT bu.*, u.email as user_email, u.name as user_name
            FROM business_users bu
            LEFT JOIN "user" u ON bu.user_id = u.id
            WHERE bu.business_id = $1
        `, [businessId]);

        const team = result.rows.map(row => ({
            ...row,
            user: {
                email: row.user_email,
                name: row.user_name
            }
        }));

        return { success: true, team };
    } catch (error) {
        console.error('Get Team Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function getBusinessByIdAction(id) {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM businesses WHERE id = $1', [id]);
        if (result.rows.length === 0) return { success: false, error: 'Not found' };
        return { success: true, business: result.rows[0] };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function getJoinedBusinessesAction(userId) {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT b.*, bu.role as user_role, bu.status as user_status
            FROM businesses b
            JOIN business_users bu ON b.id = bu.business_id
            WHERE bu.user_id = $1 AND bu.status = 'active'
            ORDER BY bu.created_at DESC
        `, [userId]);

        return { success: true, businesses: result.rows };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function getUserBusinessRoleAction(businessId, userId) {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT role FROM business_users 
            WHERE business_id = $1 AND user_id = $2
        `, [businessId, userId]);

        if (result.rows.length === 0) return { success: true, role: 'salesperson' }; // Default
        return { success: true, role: result.rows[0].role };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function updateUserRoleAction(userId, businessId, role) {
    const client = await pool.connect();
    try {
        await checkAuth(businessId, ['owner'], client);

        const result = await client.query(`
            UPDATE business_users 
            SET role = $1
            WHERE user_id = $2 AND business_id = $3
            RETURNING *
        `, [role, userId, businessId]);

        return { success: true, membership: result.rows[0] };
    } catch (error) {
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}
