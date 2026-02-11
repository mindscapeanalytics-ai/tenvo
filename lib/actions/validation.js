'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';

/**
 * Authentication helper
 */
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
 * Check if SKU exists for a business (excluding a specific product)
 * Used for real-time validation in forms
 */
export async function checkSKUExistsAction(sku, businessId, excludeProductId = null) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();

        try {
            let query = `
                SELECT id FROM products 
                WHERE business_id = $1 AND sku = $2
            `;
            const params = [businessId, sku];

            if (excludeProductId) {
                query += ` AND id != $3`;
                params.push(excludeProductId);
            }

            const result = await client.query(query, params);

            return {
                success: true,
                exists: result.rows.length > 0,
                productId: result.rows[0]?.id
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Check SKU Exists Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if Barcode exists for a business (excluding a specific product)
 * Used for real-time validation in forms
 */
export async function checkBarcodeExistsAction(barcode, businessId, excludeProductId = null) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();

        try {
            let query = `
                SELECT id FROM products 
                WHERE business_id = $1 AND barcode = $2
            `;
            const params = [businessId, barcode];

            if (excludeProductId) {
                query += ` AND id != $3`;
                params.push(excludeProductId);
            }

            const result = await client.query(query, params);

            return {
                success: true,
                exists: result.rows.length > 0,
                productId: result.rows[0]?.id
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Check Barcode Exists Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check stock availability for a product
 * Used before creating invoices or reserving stock
 */
export async function checkStockAvailabilityAction(productId, quantity, warehouseId = null) {
    try {
        const client = await pool.connect();

        try {
            if (warehouseId) {
                // Check warehouse-specific stock
                const query = `
                    SELECT 
                        psl.quantity as available_quantity,
                        COALESCE(SUM(pb.reserved_quantity), 0) as reserved_quantity
                    FROM product_stock_locations psl
                    LEFT JOIN product_batches pb ON pb.warehouse_id = psl.warehouse_id 
                        AND pb.product_id = psl.product_id
                    WHERE psl.product_id = $1 AND psl.warehouse_id = $2
                    GROUP BY psl.quantity
                `;
                const result = await client.query(query, [productId, warehouseId]);

                if (result.rows.length === 0) {
                    return {
                        success: true,
                        available: false,
                        availableQuantity: 0,
                        message: 'No stock in this warehouse'
                    };
                }

                const row = result.rows[0];
                const availableQty = parseFloat(row.available_quantity) - parseFloat(row.reserved_quantity);

                return {
                    success: true,
                    available: availableQty >= quantity,
                    availableQuantity: availableQty,
                    reservedQuantity: parseFloat(row.reserved_quantity)
                };
            } else {
                // Check global stock
                const query = `
                    SELECT stock FROM products WHERE id = $1
                `;
                const result = await client.query(query, [productId]);

                if (result.rows.length === 0) {
                    return { success: false, error: 'Product not found' };
                }

                const availableQty = parseFloat(result.rows[0].stock);

                return {
                    success: true,
                    available: availableQty >= quantity,
                    availableQuantity: availableQty
                };
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Check Stock Availability Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get low stock products for a business
 * Used for dashboard alerts and notifications
 */
export async function getLowStockProductsAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();

        try {
            const query = `
                SELECT 
                    id,
                    name,
                    sku,
                    stock,
                    min_stock,
                    reorder_point,
                    reorder_quantity
                FROM products
                WHERE business_id = $1 
                  AND is_active = true
                  AND (
                      (min_stock IS NOT NULL AND stock <= min_stock)
                      OR (reorder_point IS NOT NULL AND stock <= reorder_point)
                  )
                ORDER BY (stock - COALESCE(min_stock, reorder_point, 0)) ASC
                LIMIT 50
            `;

            const result = await client.query(query, [businessId]);

            return {
                success: true,
                products: result.rows.map(p => ({
                    ...p,
                    stock: parseFloat(p.stock),
                    min_stock: parseFloat(p.min_stock),
                    reorder_point: parseFloat(p.reorder_point),
                    reorder_quantity: parseFloat(p.reorder_quantity),
                    deficit: parseFloat(p.min_stock || p.reorder_point) - parseFloat(p.stock)
                }))
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Low Stock Products Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get out-of-stock products for a business
 * Used for dashboard alerts
 */
export async function getOutOfStockProductsAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();

        try {
            const query = `
                SELECT 
                    id,
                    name,
                    sku,
                    stock,
                    min_stock
                FROM products
                WHERE business_id = $1 
                  AND is_active = true
                  AND stock = 0
                ORDER BY name ASC
                LIMIT 50
            `;

            const result = await client.query(query, [businessId]);

            return {
                success: true,
                count: result.rows.length,
                products: result.rows
            };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Out of Stock Products Error:', error);
        return { success: false, error: error.message };
    }
}
