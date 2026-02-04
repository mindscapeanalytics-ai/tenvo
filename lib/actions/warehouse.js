'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

/**
 * Server Action: Get all warehouse locations for a business
 */
export async function getWarehouseLocationsAction(businessId) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, businessId);

        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT * FROM warehouse_locations 
                WHERE business_id = $1 
                ORDER BY name ASC
            `, [businessId]);

            return { success: true, locations: result.rows };
        } finally {
            client.release();
        }
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
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, locationData.business_id);

        const client = await pool.connect();
        try {
            // Ensure only one primary location per business
            if (locationData.isPrimary || locationData.is_primary) {
                await client.query(`
                    UPDATE warehouse_locations 
                    SET is_primary = FALSE 
                    WHERE business_id = $1
                `, [locationData.business_id]);
            } else {
                // If it's the first location, make it primary
                const countRes = await client.query('SELECT COUNT(*) FROM warehouse_locations WHERE business_id = $1', [locationData.business_id]);
                if (parseInt(countRes.rows[0].count) === 0) {
                    locationData.isPrimary = true;
                }
            }

            const result = await client.query(`
                INSERT INTO warehouse_locations (
                    business_id, name, address, city, type, code, contact_person, phone, email, is_active, is_primary
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `, [
                locationData.business_id,
                locationData.name,
                locationData.address || null,
                locationData.city || null,
                locationData.type || 'warehouse',
                locationData.code || null,
                locationData.contactPerson || locationData.contact_person || null,
                locationData.phone || null,
                locationData.email || null,
                locationData.isActive !== undefined ? locationData.isActive : (locationData.is_active !== undefined ? locationData.is_active : true),
                locationData.isPrimary || locationData.is_primary || false
            ]);

            return { success: true, location: result.rows[0] };
        } finally {
            client.release();
        }
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
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, businessId);

        // Map camelCase UI fields to snake_case DB fields if necessary
        const dbUpdates = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.city !== undefined) dbUpdates.city = updates.city;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.code !== undefined) dbUpdates.code = updates.code;
        if (updates.contactPerson !== undefined) dbUpdates.contact_person = updates.contactPerson;
        if (updates.contact_person !== undefined) dbUpdates.contact_person = updates.contact_person;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
        if (updates.isPrimary !== undefined) dbUpdates.is_primary = updates.isPrimary;
        if (updates.is_primary !== undefined) dbUpdates.is_primary = updates.is_primary;

        const client = await pool.connect();
        try {
            if (dbUpdates.is_primary) {
                await client.query(`
                    UPDATE warehouse_locations 
                    SET is_primary = FALSE 
                    WHERE business_id = $1
                `, [businessId]);
            }
            const fields = Object.keys(dbUpdates);
            const values = Object.values(dbUpdates);

            if (fields.length === 0) {
                return { success: false, error: 'No fields to update' };
            }

            const setClause = fields.map((field, idx) => `"${field}" = $${idx + 3}`).join(', ');

            const result = await client.query(`
                UPDATE warehouse_locations 
                SET ${setClause}, updated_at = NOW()
                WHERE id = $1 AND business_id = $2
                RETURNING *
            `, [locationId, businessId, ...values]);

            if (result.rows.length === 0) {
                return { success: false, error: 'Warehouse location not found' };
            }

            return { success: true, location: result.rows[0] };
        } finally {
            client.release();
        }
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
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, businessId);

        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT * FROM product_stock_locations 
                WHERE business_id = $1
            `, [businessId]);

            return { success: true, stockLevels: result.rows };
        } finally {
            client.release();
        }
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
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { success: false, error: 'Unauthorized' };
        }

        await verifyBusinessAccess(session.user.id, businessId);

        const client = await pool.connect();
        try {
            // Check if there's stock at this location before deleting
            const stockCheck = await client.query(`
                SELECT SUM(quantity) as total_stock 
                FROM product_stock_locations 
                WHERE warehouse_id = $1 AND business_id = $2
            `, [locationId, businessId]);

            if (stockCheck.rows[0]?.total_stock > 0) {
                return { success: false, error: 'Cannot delete location with existing stock. Please transfer stock first.' };
            }

            await client.query(`
                DELETE FROM warehouse_locations 
                WHERE id = $1 AND business_id = $2
            `, [locationId, businessId]);

            return { success: true };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete warehouse location error:', error);
        return { success: false, error: error.message };
    }
}
