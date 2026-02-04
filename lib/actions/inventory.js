'use server';

import pool from '@/lib/db';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

/**
 * Server Action: Create Batch
 */
export async function createBatchAction(params, txClient = null) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    const {
        businessId,
        productId,
        warehouseId,
        batchNumber,
        manufacturingDate,
        expiryDate,
        quantity,
        costPrice,
        mrp,
        notes
    } = params;

    const client = txClient || await pool.connect();
    try {
        // If external client is used, we don't need to manage connection release here
        // as it will be managed by the caller
        const res = await client.query(`
            INSERT INTO product_batches (
                business_id, product_id, warehouse_id, batch_number,
                manufacturing_date, expiry_date, quantity, cost_price, mrp, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (business_id, product_id, batch_number) 
            DO UPDATE SET 
                quantity = product_batches.quantity + EXCLUDED.quantity,
                cost_price = CASE 
                    WHEN (product_batches.quantity + EXCLUDED.quantity) > 0 
                    THEN (product_batches.quantity * product_batches.cost_price + EXCLUDED.quantity * EXCLUDED.cost_price) / (product_batches.quantity + EXCLUDED.quantity)
                    ELSE EXCLUDED.cost_price 
                END,
                updated_at = NOW()
            RETURNING *
        `, [
            businessId, productId, warehouseId, batchNumber,
            manufacturingDate, expiryDate, quantity, costPrice, mrp, notes
        ]);
        return { success: true, batch: res.rows[0] };
    } catch (error) {
        console.error('Create Batch Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Get Product Batches
 */
export async function getProductBatchesAction(productId, warehouseId = null) {
    const client = await pool.connect();
    try {
        let query = `
            SELECT * FROM product_batches 
            WHERE product_id = $1 AND is_active = true 
        `;
        const params = [productId];

        if (warehouseId) {
            query += ` AND warehouse_id = $2`;
            params.push(warehouseId);
        }

        query += ` ORDER BY expiry_date ASC NULLS FIRST`; // FEFO friendly sorting

        const res = await client.query(query, params);
        return { success: true, batches: res.rows };
    } catch (error) {
        console.error('Get Batches Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Get Expiring Batches
 */
export async function getExpiringBatchesAction(businessId, daysThreshold = 30) {
    const client = await pool.connect();
    try {
        // Using raw query instead of RPC if possible, or calling RPC
        // Let's use raw query for control and simplicity with pg driver
        const res = await client.query(`
            SELECT *,
                   (expiry_date::date - CURRENT_DATE) as days_until_expiry
            FROM product_batches
            WHERE business_id = $1
              AND is_active = true
              AND quantity > 0
              AND expiry_date IS NOT NULL
              AND expiry_date <= (CURRENT_DATE + $2 * INTERVAL '1 day')
            ORDER BY expiry_date ASC
        `, [businessId, daysThreshold]);

        return { success: true, batches: res.rows };
    } catch (error) {
        console.error('Get Expiring Batches Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

/**
 * Server Action: Update Batch Quantity
 */
export async function updateBatchQuantityAction(batchId, quantityChange, isReservation = false) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Fetch current with lock
        const getRes = await client.query('SELECT * FROM product_batches WHERE id = $1 FOR UPDATE', [batchId]);
        if (getRes.rows.length === 0) throw new Error('Batch not found');

        const batch = getRes.rows[0];

        // Update logic
        let updateQuery = 'UPDATE product_batches SET ';
        const params = [];

        if (isReservation) {
            updateQuery += 'reserved_quantity = reserved_quantity + $2 ';
            params.push(batchId, quantityChange);
        } else {
            updateQuery += 'quantity = quantity + $2 ';
            params.push(batchId, quantityChange);
        }

        updateQuery += 'WHERE id = $1 RETURNING *';

        const updateRes = await client.query(updateQuery, params);

        await client.query('COMMIT');
        return { success: true, batch: updateRes.rows[0] };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update Batch Error:', error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}
