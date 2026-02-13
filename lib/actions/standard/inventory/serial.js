'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { serialSchema, bulkSerialsSchema, validateSchema } from '@/lib/validation/schemas';

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

export async function createSerialAction(serialData) {
    try {
        const validatedData = validateSchema(serialSchema, serialData);
        await checkAuth(validatedData.business_id);
        const client = await pool.connect();
        try {
            const {
                business_id, product_id, batch_id, warehouse_id,
                serial_number, notes
            } = validatedData;

            // Auto-resolve Primary Warehouse if none provided
            let finalWarehouseId = warehouse_id;
            if (!finalWarehouseId) {
                const primaryRes = await client.query(`
                    SELECT id FROM warehouse_locations 
                    WHERE business_id = $1 AND is_primary = TRUE 
                    LIMIT 1
                `, [business_id]);
                if (primaryRes.rows.length > 0) {
                    finalWarehouseId = primaryRes.rows[0].id;
                }
            }

            const result = await client.query(`
                INSERT INTO product_serials (
                    business_id, product_id, batch_id, warehouse_id,
                    serial_number, status, notes
                ) VALUES ($1, $2, $3, $4, $5, 'in_stock', $6)
                RETURNING *
            `, [
                business_id, product_id, batch_id || null, finalWarehouseId || null,
                serial_number.toUpperCase(), notes || ''
            ]);

            return { success: true, serial: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create Serial Error:', error);
        return { success: false, error: error.message };
    }
}

export async function createBulkSerialsAction(bulkData) {
    try {
        const validatedData = validateSchema(bulkSerialsSchema, bulkData);
        await checkAuth(validatedData.business_id);
        const client = await pool.connect();
        try {
            const { business_id, product_id, serials } = validatedData;

            const results = [];
            for (const serialNumber of serials) {
                const res = await client.query(`
                    INSERT INTO product_serials (
                        business_id, product_id, serial_number, status, notes
                    ) VALUES ($1, $2, $3, 'in_stock', 'Bulk Registration')
                    ON CONFLICT (business_id, serial_number) DO NOTHING
                    RETURNING *
                `, [business_id, product_id, serialNumber.toUpperCase()]);

                if (res.rows[0]) results.push(res.rows[0]);
            }

            return { success: true, count: results.length, serials: results };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Bulk Serial Error:', error);
        return { success: false, error: error.message };
    }
}

export async function sellSerialAction(businessId, serialNumber, customerId, invoiceId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const saleDate = new Date().toISOString().split('T')[0];
            const result = await client.query(`
                UPDATE product_serials 
                SET status = 'sold', customer_id = $1, invoice_id = $2, sale_date = $3, updated_at = NOW()
                WHERE serial_number = $4 AND business_id = $5 AND status = 'in_stock'
                RETURNING *
            `, [customerId, invoiceId, saleDate, serialNumber, businessId]);

            if (result.rows.length === 0) return { success: false, error: 'Serial not found or not in stock' };
            return { success: true, serial: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getProductSerialsAction(productId, businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM product_serials WHERE product_id = $1 AND business_id = $2 AND is_deleted = false ORDER BY created_at DESC',
                [productId, businessId]
            );
            return { success: true, serials: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getAvailableSerialsAction(productId, businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT * FROM product_serials 
                 WHERE product_id = $1 
                 AND business_id = $2 
                 AND status = 'in_stock'
                 AND is_deleted = false
                 ORDER BY created_at ASC`,
                [productId, businessId]
            );
            return { success: true, serials: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getSerialAction(businessId, serialNumber) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT ps.*, p.name as product_name, p.sku as product_sku
                 FROM product_serials ps
                 LEFT JOIN products p ON ps.product_id = p.id
                 WHERE ps.business_id = $1 AND ps.serial_number = $2 AND ps.is_deleted = false
                 LIMIT 1`,
                [businessId, serialNumber]
            );

            if (result.rows.length === 0) {
                return { success: false, error: 'Serial number not found' };
            }

            return { success: true, serial: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function deleteSerialAction(serialId, businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(`
                UPDATE product_serials 
                SET is_deleted = true, deleted_at = NOW(), updated_at = NOW()
                WHERE id = $1 AND business_id = $2
                RETURNING *
            `, [serialId, businessId]);

            if (result.rows.length === 0) return { success: false, error: 'Serial not found' };
            return { success: true };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}
