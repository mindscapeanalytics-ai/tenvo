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

    // STRICT VALIDATION: Business ID is mandatory for all write operations
    if (!businessId) {
        throw new Error('Business Context Missing: Operations require a valid business ID.');
    }

    await verifyBusinessAccess(session.user.id, businessId);
    return session;
}

/**
 * Server Action: Get all products
 */
export async function getProductsAction(businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // RELATIONAL UPGRADE: Fetch products with aggregated batches and serials
            // This ensures data is always live and not reliant on denormalized JSON columns
            const query = `
                SELECT 
                    p.*,
                    COALESCE(
                        (SELECT json_agg(b.*) FROM product_batches b WHERE b.product_id = p.id AND b.is_active = true),
                        '[]'::json
                    ) as batches,
                    COALESCE(
                        (SELECT json_agg(s.*) FROM product_serials s WHERE s.product_id = p.id AND s.status = 'in_stock'),
                        '[]'::json
                    ) as serial_numbers,
                    COALESCE(
                        (SELECT json_object_agg(psl.warehouse_id::text, psl.quantity) 
                         FROM product_stock_locations psl 
                         WHERE psl.product_id = p.id AND psl.business_id = $1),
                        '{}'::json
                    ) as locations
                FROM products p
                WHERE p.business_id = $1
                ORDER BY p.name ASC
            `;

            const result = await client.query(query, [businessId]);

            // Ensure JSON fields are parsed correctly
            const products = result.rows.map(product => ({
                ...product,
                domain_data: typeof product.domain_data === 'string'
                    ? JSON.parse(product.domain_data)
                    : product.domain_data || {},
                // aggregates are already returned as JSON by json_agg/json_object_agg in most pg setups
                // but we safely handle them just in case
                batches: typeof product.batches === 'string' ? JSON.parse(product.batches) : product.batches || [],
                serial_numbers: typeof product.serial_numbers === 'string' ? JSON.parse(product.serial_numbers) : product.serial_numbers || [],
                locations: typeof product.locations === 'string' ? JSON.parse(product.locations) : product.locations || {}
            }));

            return { success: true, products };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Products Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Create Product
 */
export async function createProductAction(productData) {
    try {
        await checkAuth(productData.business_id);
        const client = await pool.connect();
        try {
            // CRITICAL FIX: Build dynamic insert query with whitelist of valid columns
            const validColumns = [
                'business_id', 'name', 'description', 'sku', 'price', 'cost_price',
                'mrp', 'stock', 'min_stock', 'max_stock', 'reorder_point',
                'reorder_quantity', 'unit', 'location', 'barcode', 'brand',
                'tax_percent', 'hsn_code', 'sac_code', 'image_url', 'is_active',
                'batches', 'serial_numbers', 'variants', 'status',
                'expiry_date', 'manufacturing_date', 'batch_number', 'domain_data'
            ];

            const cleanData = {};
            for (const [key, val] of Object.entries(productData)) {
                let dbKey = key;
                // Handle common mappings
                if (key === 'costPrice') dbKey = 'cost_price';
                if (key === 'minStock') dbKey = 'min_stock';
                if (key === 'maxStock') dbKey = 'max_stock';
                if (key === 'reorderPoint') dbKey = 'reorder_point';
                if (key === 'reorderQuantity') dbKey = 'reorder_quantity';
                if (key === 'hsnCode') dbKey = 'hsn_code';
                if (key === 'sacCode') dbKey = 'sac_code';
                if (key === 'taxPercent') dbKey = 'tax_percent';
                if (key === 'imageUrl') dbKey = 'image_url';
                if (key === 'isActive') dbKey = 'is_active';
                if (key === 'domainData') dbKey = 'domain_data';
                if (key === 'businessId') dbKey = 'business_id';
                if (key === 'expiryDate') dbKey = 'expiry_date';
                if (key === 'manufacturingDate') dbKey = 'manufacturing_date';
                if (key === 'batchNumber') dbKey = 'batch_number';

                if (validColumns.includes(dbKey)) {
                    cleanData[dbKey] = val;
                }
            }

            // Ensure JSON fields are properly serialized
            if (cleanData.domain_data && typeof cleanData.domain_data !== 'string') {
                cleanData.domain_data = JSON.stringify(cleanData.domain_data);
            }
            if (cleanData.batches && typeof cleanData.batches !== 'string') {
                cleanData.batches = JSON.stringify(cleanData.batches);
            }
            if (cleanData.serial_numbers && typeof cleanData.serial_numbers !== 'string') {
                cleanData.serial_numbers = JSON.stringify(cleanData.serial_numbers);
            }
            if (cleanData.variants && typeof cleanData.variants !== 'string') {
                cleanData.variants = JSON.stringify(cleanData.variants);
            }

            const fields = Object.keys(cleanData);
            const values = Object.values(cleanData);
            const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

            const query = `
                INSERT INTO products (${fields.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;

            const result = await client.query(query, values);

            // Parse JSON fields on return
            const product = result.rows[0];
            if (typeof product.domain_data === 'string') {
                product.domain_data = JSON.parse(product.domain_data);
            }
            if (typeof product.batches === 'string') {
                product.batches = JSON.parse(product.batches);
            }
            if (typeof product.serial_numbers === 'string') {
                product.serial_numbers = JSON.parse(product.serial_numbers);
            }
            if (typeof product.variants === 'string') {
                product.variants = JSON.parse(product.variants);
            }

            return { success: true, product };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create Product Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update Product
 */
export async function updateProductAction(id, businessId, updates) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            // CRITICAL FIX: Build dynamic update query with whitelist of valid columns
            // This prevents "multiple assignments to same column 'updated_at'" and other schema errors.
            const validColumns = [
                'name', 'description', 'sku', 'price', 'cost_price',
                'mrp', 'stock', 'min_stock', 'max_stock', 'reorder_point',
                'reorder_quantity', 'unit', 'location', 'barcode', 'brand',
                'tax_percent', 'hsn_code', 'sac_code', 'image_url', 'is_active',
                'batches', 'serial_numbers', 'variants', 'status',
                'expiry_date', 'manufacturing_date', 'batch_number', 'domain_data'
            ];

            const cleanUpdates = {};
            for (const [key, val] of Object.entries(updates)) {
                let dbKey = key;
                // Handle common mappings
                if (key === 'costPrice') dbKey = 'cost_price';
                if (key === 'minStock') dbKey = 'min_stock';
                if (key === 'maxStock') dbKey = 'max_stock';
                if (key === 'reorderPoint') dbKey = 'reorder_point';
                if (key === 'reorderQuantity') dbKey = 'reorder_quantity';
                if (key === 'hsnCode') dbKey = 'hsn_code';
                if (key === 'sacCode') dbKey = 'sac_code';
                if (key === 'taxPercent') dbKey = 'tax_percent';
                if (key === 'imageUrl') dbKey = 'image_url';
                if (key === 'isActive') dbKey = 'is_active';
                if (key === 'domainData') dbKey = 'domain_data';
                if (key === 'expiryDate') dbKey = 'expiry_date';
                if (key === 'manufacturingDate') dbKey = 'manufacturing_date';
                if (key === 'batchNumber') dbKey = 'batch_number';

                if (validColumns.includes(dbKey)) {
                    cleanUpdates[dbKey] = val;
                }
            }

            // Ensure JSON fields are properly serialized
            if (cleanUpdates.domain_data && typeof cleanUpdates.domain_data !== 'string') {
                cleanUpdates.domain_data = JSON.stringify(cleanUpdates.domain_data);
            }
            if (cleanUpdates.batches && typeof cleanUpdates.batches !== 'string') {
                cleanUpdates.batches = JSON.stringify(cleanUpdates.batches);
            }
            if (cleanUpdates.serial_numbers && typeof cleanUpdates.serial_numbers !== 'string') {
                cleanUpdates.serial_numbers = JSON.stringify(cleanUpdates.serial_numbers);
            }
            if (cleanUpdates.variants && typeof cleanUpdates.variants !== 'string') {
                cleanUpdates.variants = JSON.stringify(cleanUpdates.variants);
            }

            const fields = Object.keys(cleanUpdates);
            const values = Object.values(cleanUpdates);

            if (fields.length === 0) {
                return { success: true, message: 'No valid fields provided for update' };
            }

            const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

            const query = `
                UPDATE products
                SET ${setClause}, updated_at = NOW()
                WHERE id = $${fields.length + 1} AND business_id = $${fields.length + 2}
                RETURNING *
            `;

            const result = await client.query(query, [...values, id, businessId]);

            if (result.rows.length === 0) {
                throw new Error('Product not found or access denied');
            }

            // Parse JSON fields on return
            const product = result.rows[0];
            if (typeof product.domain_data === 'string') {
                product.domain_data = JSON.parse(product.domain_data);
            }
            if (typeof product.batches === 'string') {
                product.batches = JSON.parse(product.batches);
            }
            if (typeof product.serial_numbers === 'string') {
                product.serial_numbers = JSON.parse(product.serial_numbers);
            }
            if (typeof product.variants === 'string') {
                product.variants = JSON.parse(product.variants);
            }

            return { success: true, product };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Product Error:', error);
        return { success: false, error: error.message };
    }
}

// ... existing imports

/**
 * Server Action: Bulk Create Products for Seeding
 */
export async function seedBusinessProductsAction(businessId, products) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const results = [];
            for (const product of products) {
                // Ensure default fields
                const {
                    name,
                    description,
                    sku,
                    price = 0,
                    cost_price = product.cost || 0, // Fallback to 'cost' if present
                    stock = 0,
                    min_stock = 0,
                    category = 'General',
                    unit = 'pcs',
                    location = '',
                    barcode = '',
                    domain_data = {},
                    status = 'active'
                } = product;

                const query = `
                    INSERT INTO products (
                        business_id, name, description, sku, price, cost_price,
                        stock, min_stock, category, unit, location, barcode,
                        domain_data, is_active
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING *
                `;

                const res = await client.query(query, [
                    businessId, name, description || '', sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    price, cost_price, stock, min_stock, category, unit, location, barcode,
                    domain_data, true
                ]);
                results.push(res.rows[0]);
            }

            await client.query('COMMIT');
            return { success: true, products: results, count: results.length };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Seed Products Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Delete Product
 */
export async function deleteProductAction(id, businessId) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            await client.query(
                'DELETE FROM products WHERE id = $1 AND business_id = $2',
                [id, businessId]
            );
            return { success: true };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete Product Error:', error);
        return { success: false, error: error.message };
    }
}

