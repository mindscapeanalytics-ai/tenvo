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

export async function createSerialAction(serialData) {
    try {
        await checkAuth(serialData.business_id);
        const client = await pool.connect();
        try {
            const {
                business_id, product_id, batch_id, warehouse_id,
                serial_number, imei, mac_address, purchase_date,
                warranty_period_months, notes
            } = serialData;

            // Auto-resolve Primary Warehouse if none provided
            if (!warehouse_id) {
                const primaryRes = await client.query(`
                    SELECT id FROM warehouse_locations 
                    WHERE business_id = $1 AND is_primary = TRUE 
                    LIMIT 1
                `, [business_id]);
                if (primaryRes.rows.length > 0) {
                    serialData.warehouse_id = primaryRes.rows[0].id;
                }
            }

            // Calculate dates
            const warrantyStartDate = purchase_date || new Date().toISOString().split('T')[0];
            let warrantyEndDate = null;
            if (warranty_period_months) {
                const endDate = new Date(warrantyStartDate);
                endDate.setMonth(endDate.getMonth() + warranty_period_months);
                warrantyEndDate = endDate.toISOString().split('T')[0];
            }

            const result = await client.query(`
                INSERT INTO product_serials (
                    business_id, product_id, batch_id, warehouse_id,
                    serial_number, imei, mac_address, purchase_date,
                    warranty_start_date, warranty_end_date, warranty_period_months,
                    status, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'in_stock', $12)
                RETURNING *
            `, [
                business_id, product_id, batch_id || null, serialData.warehouse_id || null,
                serial_number, imei, mac_address, warrantyStartDate,
                warrantyStartDate, warrantyEndDate, warranty_period_months, notes
            ]);

            return { success: true, serial: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function createBulkSerialsAction(data) {
    try {
        await checkAuth(data.business_id);
        const client = await pool.connect();
        try {
            const {
                business_id, product_id, batch_id, warehouse_id,
                serial_numbers, warranty_period_months, notes
            } = data;

            // Auto-resolve Primary Warehouse if none provided
            if (!warehouse_id) {
                const primaryRes = await client.query(`
                    SELECT id FROM warehouse_locations 
                    WHERE business_id = $1 AND is_primary = TRUE 
                    LIMIT 1
                `, [business_id]);
                if (primaryRes.rows.length > 0) {
                    data.warehouse_id = primaryRes.rows[0].id;
                }
            }

            const warrantyStartDate = new Date().toISOString().split('T')[0];
            let warrantyEndDate = null;
            if (warranty_period_months) {
                const endDate = new Date(warrantyStartDate);
                endDate.setMonth(endDate.getMonth() + warranty_period_months);
                warrantyEndDate = endDate.toISOString().split('T')[0];
            }

            const results = [];
            for (const serialNumber of serial_numbers) {
                const res = await client.query(`
                    INSERT INTO product_serials (
                        business_id, product_id, batch_id, warehouse_id,
                        serial_number, purchase_date, warranty_start_date, 
                        warranty_end_date, warranty_period_months, status, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'in_stock', $10)
                    ON CONFLICT (business_id, product_id, serial_number) DO NOTHING
                    RETURNING *
                `, [
                    business_id, product_id, batch_id || null, data.warehouse_id || null,
                    serialNumber.toUpperCase(), warrantyStartDate, warrantyStartDate,
                    warrantyEndDate, warranty_period_months, notes || 'Bulk Registration'
                ]);
                if (res.rows[0]) results.push(res.rows[0]);
            }

            return { success: true, count: results.length, serials: results };
        } finally {
            client.release();
        }
    } catch (error) {
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
                'SELECT * FROM product_serials WHERE product_id = $1 AND business_id = $2 ORDER BY created_at DESC',
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

/**
 * Server Action: Get Available Serials (Status = 'in_stock')
 */
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

/**
 * Server Action: Get a single serial by its serial number
 * Efficient DB-level lookup instead of fetching all serials and filtering client-side
 */
export async function getSerialAction(businessId, serialNumber) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const result = await client.query(
                `SELECT ps.*, p.name as product_name, p.sku as product_sku
                 FROM product_serials ps
                 LEFT JOIN products p ON ps.product_id = p.id
                 WHERE ps.business_id = $1 AND ps.serial_number = $2
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

