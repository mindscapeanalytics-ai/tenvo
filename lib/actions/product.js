'use server';

import pool from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { productSchema, validateWithSchema } from '@/lib/validation/schemas';

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
 * Server Action: Get all products with optional pagination
 * 
 * @param {string} businessId - Business UUID
 * @param {Object} [options={}] - Query options
 * @param {number} [options.limit] - Max records
 * @param {number} [options.offset] - Records to skip
 * @param {string} [options.search] - Search query (name, sku, barcode)
 * @returns {Promise<{success: boolean, products?: any[], total?: number, hasMore?: boolean, error?: string}>}
 */
export async function getProductsAction(businessId, options = {}) {
    try {
        await checkAuth(businessId);
        const client = await pool.connect();
        try {
            const { limit, offset, search } = options;
            const usePagination = limit !== undefined && offset !== undefined;

            // Build WHERE clause for search
            let whereClause = 'p.business_id = $1';
            const params = [businessId];

            if (search) {
                params.push(`%${search}%`);
                whereClause += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.barcode ILIKE $${params.length})`;
            }

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
                WHERE ${whereClause}
                ORDER BY p.name ASC
                ${usePagination ? `LIMIT $${params.length + 1} OFFSET $${params.length + 2}` : ''}
            `;

            if (usePagination) {
                params.push(limit, offset);
            }

            const result = await client.query(query, params);

            // Get total count for pagination
            let total = result.rows.length;
            if (usePagination) {
                const countQuery = `SELECT COUNT(*) FROM products p WHERE ${whereClause}`;
                const countResult = await client.query(countQuery, params.slice(0, search ? 2 : 1));
                total = parseInt(countResult.rows[0].count);
            }

            // Ensure JSON fields are parsed correctly and numbers are numbers
            const products = result.rows.map(product => ({
                ...product,
                // Parse numeric fields (pg returns decimals/numeric as strings)
                price: parseFloat(product.price || 0),
                cost_price: parseFloat(product.cost_price || 0),
                mrp: parseFloat(product.mrp || 0),
                stock: parseFloat(product.stock || 0),
                min_stock: parseFloat(product.min_stock || 0),
                max_stock: parseFloat(product.max_stock || 0),
                reorder_point: parseFloat(product.reorder_point || 0),
                reorder_quantity: parseFloat(product.reorder_quantity || 0),
                tax_percent: parseFloat(product.tax_percent || 0),

                // Parse JSON fields
                domain_data: typeof product.domain_data === 'string'
                    ? JSON.parse(product.domain_data)
                    : product.domain_data || {},
                batches: Array.isArray(product.batches) ? product.batches : (typeof product.batches === 'string' ? JSON.parse(product.batches) : []),
                serial_numbers: Array.isArray(product.serial_numbers) ? product.serial_numbers : (typeof product.serial_numbers === 'string' ? JSON.parse(product.serial_numbers) : []),
                locations: typeof product.locations === 'string' ? JSON.parse(product.locations) : product.locations || {}
            }));

            return { success: true, products, total, hasMore: usePagination ? (offset + limit < total) : false };
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Products Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Create Product with Zod Validation and Transaction Support
 * Handles batches and serial numbers atomically
 * 
 * @param {Object} productData - Product data to create
 * @returns {Promise<{success: boolean, product?: any, error?: string, errors?: any[]}>}
 */
export async function createProductAction(productData) {
    try {
        // Sanitize: Parse numeric fields if they are strings
        const numericFields = ['price', 'cost_price', 'mrp', 'stock', 'min_stock', 'max_stock', 'reorder_point', 'reorder_quantity', 'tax_percent'];
        const sanitizedData = { ...productData };

        numericFields.forEach(field => {
            if (sanitizedData[field] !== undefined) {
                if (typeof sanitizedData[field] === 'string') {
                    const val = parseFloat(sanitizedData[field]);
                    sanitizedData[field] = isNaN(val) ? 0 : val;
                } else if (sanitizedData[field] === null) {
                    sanitizedData[field] = 0;
                }
            }
        });

        // Handle camelCase incoming keys for robustness
        if (productData.costPrice !== undefined) sanitizedData.cost_price = parseFloat(productData.costPrice) || 0;
        if (productData.minStock !== undefined) sanitizedData.min_stock = parseFloat(productData.minStock) || 0;
        if (productData.maxStock !== undefined) sanitizedData.max_stock = parseFloat(productData.maxStock) || 0;
        if (productData.reorderPoint !== undefined) sanitizedData.reorder_point = parseFloat(productData.reorderPoint) || 0;
        if (productData.reorderQuantity !== undefined) sanitizedData.reorder_quantity = parseFloat(productData.reorderQuantity) || 0;
        if (productData.taxPercent !== undefined) sanitizedData.tax_percent = parseFloat(productData.taxPercent) || 0;

        // ✅ Validate with Zod before any database operations
        const validation = validateWithSchema(productSchema, sanitizedData);

        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errors: validation.errors,
                details: validation.details
            };
        }

        const validatedData = validation.data;
        await checkAuth(validatedData.business_id);

        // Extract batches and serials for separate insertion
        const batches = validatedData.batches || [];
        const serialNumbers = validatedData.serialNumbers || validatedData.serial_numbers || [];

        // Remove from main product data to avoid column errors
        delete validatedData.batches;
        delete validatedData.serialNumbers;
        delete validatedData.serial_numbers;

        const client = await pool.connect();
        try {
            // BEGIN TRANSACTION
            await client.query('BEGIN');

            // STEP 1: Insert Product
            const validColumns = [
                'business_id', 'name', 'description', 'sku', 'price', 'cost_price',
                'mrp', 'stock', 'min_stock', 'max_stock', 'reorder_point',
                'reorder_quantity', 'unit', 'location', 'barcode', 'brand',
                'tax_percent', 'hsn_code', 'sac_code', 'image_url', 'is_active',
                'variants', 'status', 'expiry_date', 'manufacturing_date',
                'batch_number', 'domain_data', 'category'
            ];

            const cleanData = {};
            for (const [key, val] of Object.entries(validatedData)) {
                let dbKey = key;
                // Handle camelCase to snake_case mappings
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
            if (cleanData.variants && typeof cleanData.variants !== 'string') {
                cleanData.variants = JSON.stringify(cleanData.variants);
            }

            const fields = Object.keys(cleanData);
            const values = Object.values(cleanData);
            const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

            const productQuery = `
                INSERT INTO products (${fields.join(', ')})
                VALUES (${placeholders})
                RETURNING *
            `;

            const productResult = await client.query(productQuery, values);
            const product = productResult.rows[0];
            const productId = product.id;

            // STEP 2: Insert Batches (if any)
            if (batches.length > 0) {
                for (const batch of batches) {
                    await client.query(
                        `INSERT INTO product_batches 
                        (product_id, business_id, batch_number, quantity, manufacturing_date, expiry_date, cost_price, notes, is_active)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
                        [
                            productId,
                            validatedData.business_id,
                            batch.batchNumber || batch.batch_number,
                            Number(batch.quantity) || 0,
                            batch.manufacturingDate || batch.manufacturing_date || null,
                            batch.expiryDate || batch.expiry_date || null,
                            Number(batch.costPrice || batch.cost_price) || null,
                            batch.notes || null
                        ]
                    );
                }
            }

            // STEP 3: Insert Serial Numbers (if any)
            if (serialNumbers.length > 0) {
                for (const serial of serialNumbers) {
                    await client.query(
                        `INSERT INTO product_serials 
                        (product_id, business_id, serial_number, status, notes)
                        VALUES ($1, $2, $3, $4, $5)`,
                        [
                            productId,
                            validatedData.business_id,
                            serial.serialNumber || serial.serial_number,
                            serial.status || 'in_stock',
                            serial.notes || null
                        ]
                    );
                }
            }

            // COMMIT TRANSACTION
            await client.query('COMMIT');

            // Parse JSON fields on return
            if (typeof product.domain_data === 'string') {
                product.domain_data = JSON.parse(product.domain_data);
            }
            if (typeof product.variants === 'string') {
                product.variants = JSON.parse(product.variants);
            }

            // Attach batches and serials to response
            product.batches = batches;
            product.serial_numbers = serialNumbers;

            return { success: true, product, data: product };
        } catch (error) {
            // ROLLBACK on error
            await client.query('ROLLBACK');
            console.error('Transaction failed in createProductAction:', error);
            throw error;
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
 * 
 * @param {string} id - Product UUID
 * @param {string} businessId - Business UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<{success: boolean, product?: any, error?: string}>}
 */
export async function updateProductAction(id, businessId, updates) {
    try {
        await checkAuth(businessId);

        // Sanitize: Parse numeric fields if they are strings
        const numericFields = ['price', 'cost_price', 'mrp', 'stock', 'min_stock', 'max_stock', 'reorder_point', 'reorder_quantity', 'tax_percent'];
        const sanitizedUpdates = { ...updates };

        numericFields.forEach(field => {
            if (sanitizedUpdates[field] !== undefined) {
                // If string, parse. If number/null, keep.
                if (typeof sanitizedUpdates[field] === 'string') {
                    const val = parseFloat(sanitizedUpdates[field]);
                    sanitizedUpdates[field] = isNaN(val) ? 0 : val;
                } else if (sanitizedUpdates[field] === null) {
                    sanitizedUpdates[field] = 0; // Default to 0 for nulls in numeric fields if schema requires it, or let schema handle nulls
                }
            }
        });

        // Handle camelCase incoming keys for robustness
        if (updates.costPrice !== undefined) sanitizedUpdates.cost_price = parseFloat(updates.costPrice) || 0;
        if (updates.minStock !== undefined) sanitizedUpdates.min_stock = parseFloat(updates.minStock) || 0;
        if (updates.maxStock !== undefined) sanitizedUpdates.max_stock = parseFloat(updates.maxStock) || 0;
        if (updates.reorderPoint !== undefined) sanitizedUpdates.reorder_point = parseFloat(updates.reorderPoint) || 0;
        if (updates.reorderQuantity !== undefined) sanitizedUpdates.reorder_quantity = parseFloat(updates.reorderQuantity) || 0;
        if (updates.taxPercent !== undefined) sanitizedUpdates.tax_percent = parseFloat(updates.taxPercent) || 0;

        const client = await pool.connect();
        try {
            // ✅ For updates, we only validate the fields being updated (partial validation)
            // We don't require all fields like 'name' or 'price' since this is a PATCH operation

            // Only validate individual field constraints, not required fields
            const fieldsToValidate = {};

            // Validate numeric fields if present
            if (sanitizedUpdates.price !== undefined) {
                if (sanitizedUpdates.price < 0) {
                    return { success: false, error: 'Price must be non-negative' };
                }
                fieldsToValidate.price = sanitizedUpdates.price;
            }

            if (sanitizedUpdates.cost_price !== undefined) {
                if (sanitizedUpdates.cost_price < 0) {
                    return { success: false, error: 'Cost price must be non-negative' };
                }
                fieldsToValidate.cost_price = sanitizedUpdates.cost_price;
            }

            if (sanitizedUpdates.mrp !== undefined) {
                if (sanitizedUpdates.mrp < 0) {
                    return { success: false, error: 'MRP must be non-negative' };
                }
                fieldsToValidate.mrp = sanitizedUpdates.mrp;
            }

            if (sanitizedUpdates.stock !== undefined) {
                if (sanitizedUpdates.stock < 0) {
                    return { success: false, error: 'Stock cannot be negative' };
                }
                fieldsToValidate.stock = sanitizedUpdates.stock;
            }

            if (sanitizedUpdates.tax_percent !== undefined) {
                if (sanitizedUpdates.tax_percent < 0 || sanitizedUpdates.tax_percent > 100) {
                    return { success: false, error: 'Tax percent must be between 0 and 100' };
                }
                fieldsToValidate.tax_percent = sanitizedUpdates.tax_percent;
            }

            // Validate string length if present
            if (sanitizedUpdates.name !== undefined) {
                if (sanitizedUpdates.name.length === 0) {
                    return { success: false, error: 'Product name cannot be empty' };
                }
                if (sanitizedUpdates.name.length > 255) {
                    return { success: false, error: 'Product name too long (max 255 characters)' };
                }
                fieldsToValidate.name = sanitizedUpdates.name;
            }

            // Collect warnings for business rules (non-blocking)
            const warnings = [];

            // Warn if MRP < price (but don't block save)
            if (sanitizedUpdates.mrp !== undefined && sanitizedUpdates.price !== undefined) {
                if (sanitizedUpdates.mrp < sanitizedUpdates.price) {
                    warnings.push('💡 Recommendation: MRP is usually greater than or equal to selling price');
                }
            }

            // Warn if max_stock < min_stock (but don't block save)
            if (sanitizedUpdates.max_stock !== undefined && sanitizedUpdates.min_stock !== undefined) {
                if (sanitizedUpdates.max_stock < sanitizedUpdates.min_stock) {
                    warnings.push('💡 Recommendation: Max stock is usually greater than or equal to min stock');
                }
            }

            // Warn if cost_price > price (low margin warning)
            if (sanitizedUpdates.cost_price !== undefined && sanitizedUpdates.price !== undefined) {
                if (sanitizedUpdates.cost_price > sanitizedUpdates.price) {
                    warnings.push('⚠️ Warning: Cost price is higher than selling price (negative margin)');
                } else if (sanitizedUpdates.cost_price > 0) {
                    const margin = ((sanitizedUpdates.price - sanitizedUpdates.cost_price) / sanitizedUpdates.price) * 100;
                    if (margin < 10) {
                        warnings.push(`💡 Low margin: ${margin.toFixed(1)}% - Consider increasing price`);
                    }
                }
            }

            // Warn if price is 0
            if (sanitizedUpdates.price !== undefined && sanitizedUpdates.price === 0) {
                warnings.push('💡 Recommendation: Price is set to 0 - Is this intentional?');
            }

            const validatedData = sanitizedUpdates;

            const validColumns = [
                'name', 'description', 'sku', 'price', 'cost_price',
                'mrp', 'stock', 'min_stock', 'max_stock', 'reorder_point',
                'reorder_quantity', 'unit', 'location', 'barcode', 'brand',
                'tax_percent', 'hsn_code', 'sac_code', 'image_url', 'is_active',
                'batches', 'serial_numbers', 'variants', 'status',
                'expiry_date', 'manufacturing_date', 'batch_number', 'domain_data'
            ];

            const cleanUpdates = {};
            for (const [key, val] of Object.entries(validatedData)) {
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

                if (validColumns.includes(dbKey) && key !== 'id' && key !== 'business_id') {
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

            // Parse numeric fields (pg returns decimals/numeric as strings)
            ['price', 'cost_price', 'mrp', 'stock', 'min_stock', 'max_stock', 'reorder_point', 'reorder_quantity', 'tax_percent'].forEach(field => {
                if (product[field] !== undefined) {
                    product[field] = parseFloat(product[field] || 0);
                }
            });

            return {
                success: true,
                product,
                warnings: warnings.length > 0 ? warnings : undefined // Include warnings if any
            };
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
                        business_id, name, description, sku, price, cost_price, mrp,
                        stock, min_stock, max_stock, category, unit, location, barcode,
                        domain_data, is_active, tax_percent, hsn_code
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                    RETURNING *
                `;

                const res = await client.query(query, [
                    businessId,
                    product.name,
                    product.description || '',
                    product.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    Number(product.price) || 0,
                    Number(product.cost_price || product.cost) || 0,
                    Number(product.mrp || product.price) || 0,
                    Number(product.stock) || 0,
                    Number(product.min_stock) || 0,
                    Number(product.max_stock) || 0,
                    product.category || 'General',
                    product.unit || 'pcs',
                    product.location || '',
                    product.barcode || '',
                    JSON.stringify(product.domain_data || {}),
                    true,
                    Number(product.tax_percent) || 17,
                    product.hsn_code || ''
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

