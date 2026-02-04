'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

async function checkAuth(businessId) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) throw new Error('Unauthorized');
    if (businessId) {
        await verifyBusinessAccess(session.user.id, businessId);
    }
    return session;
}

/**
 * Server Action: Create Batch
 */
export async function createBatchAction(batchData) {
    try {
        await checkAuth(batchData.business_id);
        const client = await pool.connect();
        try {
            // Ensure all required fields are present
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

            // Auto-resolve Primary Warehouse if none provided
            if (!batchData.warehouse_id) {
                const primaryRes = await client.query(`
                    SELECT id FROM warehouse_locations 
                    WHERE business_id = $1 AND is_primary = TRUE 
                    LIMIT 1
                `, [batchData.business_id]);
                if (primaryRes.rows.length > 0) {
                    batchData.warehouse_id = primaryRes.rows[0].id;
                }
            }

            const values = fields.map(f => batchData[f] ?? null);
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
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            await client.query(
                'DELETE FROM product_batches WHERE id = $1 AND business_id = $2',
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
