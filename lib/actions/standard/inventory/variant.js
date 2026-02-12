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

export async function createVariantAction(variantData) {
    try {
        await checkAuth(variantData.business_id);
        const client = await pool.connect();
        try {
            const {
                business_id, product_id, variant_sku, variant_name,
                size, color, pattern, material, custom_attributes,
                price, cost_price, mrp, stock, min_stock, image_url
            } = variantData;

            const result = await client.query(`
                INSERT INTO product_variants (
                    business_id, product_id, variant_sku, variant_name,
                    size, color, pattern, material, custom_attributes,
                    price, cost_price, mrp, stock, min_stock, image_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `, [
                business_id, product_id, variant_sku, variant_name,
                size, color, pattern, material, custom_attributes || {},
                price || 0, cost_price || 0, mrp || 0, stock || 0, min_stock || 0, image_url
            ]);

            return { success: true, variant: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getProductVariantsAction(productId) {
    try {
        // Product doesn't have businessId here, usually we'd verify access to the product
        // For now, simple fetch
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM product_variants WHERE product_id = $1 AND is_active = true ORDER BY size, color',
                [productId]
            );
            return { success: true, variants: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function updateVariantStockAction(variantId, businessId, quantityChange, reason = 'Manual Adjustment', notes = '') {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const result = await client.query(`
                UPDATE product_variants 
                SET stock = stock + $1, updated_at = NOW()
                WHERE id = $2 AND business_id = $3
                RETURNING *
            `, [quantityChange, variantId, businessId]);

            if (result.rows.length === 0) throw new Error('Variant not found');
            const variant = result.rows[0];

            // Record movement for audit trail
            await client.query(`
                INSERT INTO stock_movements (
                    business_id, product_id, variant_id, movement_type, 
                    transaction_type, quantity_change, unit_cost, reference_type, notes
                ) VALUES ($1, $2, $3, $4, 'adjustment', $5, $6, 'adjustment', $7)
            `, [
                businessId,
                variant.product_id,
                variantId,
                quantityChange > 0 ? 'adjustment_in' : 'adjustment_out',
                quantityChange,
                variant.cost_price || 0,
                `${reason}: ${notes}`
            ]);

            await client.query('COMMIT');
            return { success: true, variant };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Variant Stock Error:', error);
        return { success: false, error: error.message };
    }
}

export async function searchVariantsAction(businessId, filters = {}) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const fields = ['business_id = $1', 'is_active = true'];
            const values = [businessId];
            let idx = 2;

            if (filters.size) { fields.push(`size = $${idx++}`); values.push(filters.size); }
            if (filters.color) { fields.push(`color = $${idx++}`); values.push(filters.color); }
            if (filters.productId) { fields.push(`product_id = $${idx++}`); values.push(filters.productId); }

            const result = await client.query(`
                SELECT * FROM product_variants 
                WHERE ${fields.join(' AND ')}
            `, values);

            return { success: true, variants: result.rows };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function createVariantMatrixAction(data) {
    try {
        await checkAuth(data.business_id);
        const client = await pool.connect();
        try {
            const {
                business_id, product_id, sizes, colors,
                base_price, base_cost_price, base_mrp
            } = data;

            const results = [];
            for (const size of sizes) {
                for (const color of colors) {
                    const variantSku = `${product_id}-${size}-${color}`.toUpperCase();
                    const variantName = `${size} - ${color}`;

                    const res = await client.query(`
                        INSERT INTO product_variants (
                            business_id, product_id, variant_sku, variant_name,
                            size, color, price, cost_price, mrp, stock
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
                        ON CONFLICT (business_id, product_id, variant_sku) DO NOTHING
                        RETURNING *
                    `, [
                        business_id, product_id, variantSku, variantName,
                        size, color, base_price, base_cost_price, base_mrp
                    ]);
                    if (res.rows[0]) results.push(res.rows[0]);
                }
            }

            return { success: true, count: results.length, variants: results };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getVariantMatrixAction(productId) {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM product_variants WHERE product_id = $1 AND is_active = true',
                [productId]
            );
            const variants = result.rows;

            const sizes = [...new Set(variants.map(v => v.size))].filter(Boolean).sort();
            const colors = [...new Set(variants.map(v => v.color))].filter(Boolean).sort();

            const matrix = {};
            variants.forEach(v => {
                const key = `${v.size}-${v.color}`;
                matrix[key] = {
                    id: v.id,
                    sku: v.variant_sku,
                    stock: v.stock,
                    price: v.price,
                    isLowStock: v.stock <= (v.min_stock || 0)
                };
            });

            return {
                success: true,
                matrixData: {
                    sizes,
                    colors,
                    matrix
                }
            };
        } finally {
            client.release();
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update variant pricing (price, cost_price, mrp)
 * Only updates fields that are provided in the pricingData object
 */
export async function updateVariantPricingAction(variantId, businessId, pricingData) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const setClauses = [];
            const values = [];
            let idx = 1;

            if (pricingData.price !== undefined) {
                setClauses.push(`price = $${idx++}`);
                values.push(pricingData.price);
            }
            if (pricingData.costPrice !== undefined || pricingData.cost_price !== undefined) {
                setClauses.push(`cost_price = $${idx++}`);
                values.push(pricingData.costPrice ?? pricingData.cost_price);
            }
            if (pricingData.mrp !== undefined) {
                setClauses.push(`mrp = $${idx++}`);
                values.push(pricingData.mrp);
            }

            if (setClauses.length === 0) {
                return { success: false, error: 'No pricing fields provided' };
            }

            setClauses.push('updated_at = NOW()');

            values.push(variantId);
            values.push(businessId);

            const result = await client.query(`
                UPDATE product_variants 
                SET ${setClauses.join(', ')}
                WHERE id = $${idx++} AND business_id = $${idx}
                RETURNING *
            `, values);

            if (result.rows.length === 0) {
                return { success: false, error: 'Variant not found' };
            }

            return { success: true, variant: result.rows[0] };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Variant Pricing Error:', error);
        return { success: false, error: error.message };
    }
}

