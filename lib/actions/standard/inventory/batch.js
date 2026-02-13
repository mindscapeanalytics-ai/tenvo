'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { batchSchema, validateSchema } from '@/lib/validation/schemas';

async function checkAuth(businessId, requiredRoles = []) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');
    if (businessId) {
        await verifyBusinessAccess(session.user.id, businessId, requiredRoles);
    }
    return session;
}

/**
 * Server Action: Create Batch
 */
export async function createBatchAction(batchData) {
    try {
        const validatedData = validateSchema(batchSchema, batchData);
        await checkAuth(validatedData.business_id);
        const client = await pool.connect();
        try {
            // Auto-resolve Primary Warehouse if none provided
            if (!validatedData.warehouse_id) {
                const primaryRes = await client.query(`
                    SELECT id FROM warehouse_locations 
                    WHERE business_id = $1 AND is_primary = TRUE 
                    LIMIT 1
                `, [validatedData.business_id]);
                if (primaryRes.rows.length > 0) {
                    validatedData.warehouse_id = primaryRes.rows[0].id;
                }
            }

            const fields = [
                'business_id',
                'product_id',
                'batch_number',
                'quantity',
                'manufacturing_date',
                'expiry_date',
                'cost_price',
                'mrp',
                'warehouse_id'
            ];

            const values = fields.map(f => validatedData[f] ?? null);
            const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

            const query = `
                INSERT INTO product_batches (${fields.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;

            const result = await client.query(query, values);
            return { success: true, batch: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create Batch Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Batches for a Product
 */
export async function getBatchesAction(productId, businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT * FROM product_batches 
                 WHERE product_id = $1 AND business_id = $2 
                 AND is_deleted = false
                 ORDER BY expiry_date ASC NULLS LAST`,
                [productId, businessId]
            );
            return { success: true, batches: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Batches Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update Batch
 */
export async function updateBatchAction(batchId, businessId, updates) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const fields = Object.keys(updates);
            const values = Object.values(updates);
            const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');

            const query = `
                UPDATE product_batches 
                SET ${setClause}, updated_at = NOW()
                WHERE id = $1 AND business_id = $2
                RETURNING *
            `;

            const result = await client.query(query, [batchId, businessId, ...values]);
            if (result.rows.length === 0) throw new Error('Batch not found');

            return { success: true, batch: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Batch Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Delete Batch
 */
export async function deleteBatchAction(batchId, businessId) {
    try {
        await checkAuth(businessId, ['owner', 'admin']);
        const client = await pool.connect();
        try {
            await client.query(
                'UPDATE product_batches SET is_deleted = true, deleted_at = NOW(), is_active = false WHERE id = $1 AND business_id = $2',
                [batchId, businessId]
            );
            return { success: true };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete Batch Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Expiring Batches
 */
export async function getExpiringBatchesAction(businessId, daysThreshold = 30) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT pb.*, p.name as product_name
                 FROM product_batches pb
                 JOIN products p ON pb.product_id = p.id
                 WHERE pb.business_id = $1
                   AND pb.expiry_date IS NOT NULL
                   AND pb.expiry_date > CURRENT_DATE
                   AND pb.expiry_date <= CURRENT_DATE + $2
                   AND pb.is_active = true
                   AND pb.is_deleted = false
                   AND pb.quantity > 0
                 ORDER BY pb.expiry_date ASC`,
                [businessId, daysThreshold]
            );
            return { success: true, batches: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Expiring Batches Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Available Batches (Qty > 0 & Not Expired)
 */
export async function getAvailableBatchesAction(productId, businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT * FROM product_batches 
                 WHERE product_id = $1 
                 AND business_id = $2 
                 AND quantity > 0
                 AND is_active = true
                 AND is_deleted = false
                 AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
                 ORDER BY expiry_date ASC NULLS LAST`,
                [productId, businessId]
            );
            return { success: true, batches: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Available Batches Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update Batch Quantity (Atomic)
 */
export async function updateBatchQuantityAction(batchId, businessId, quantityChange, isReservation = false) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const field = isReservation ? 'reserved_quantity' : 'quantity';
            const result = await client.query(
                `UPDATE product_batches 
                 SET ${field} = COALESCE(${field}, 0) + $1, updated_at = NOW() 
                 WHERE id = $2 AND business_id = $3
                 RETURNING *`,
                [quantityChange, batchId, businessId]
            );
            if (result.rows.length === 0) throw new Error('Batch not found');
            return { success: true, batch: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Batch Quantity Error:', error);
        return { success: false, error: error.message };
    }
}
