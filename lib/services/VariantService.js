import pool from '@/lib/db';
import { createModuleLogger } from '@/lib/services/logging/logger';
import { buildVariantSku } from '@/lib/utils/variantSync';

const log = createModuleLogger('variant-service');

/**
 * Variant Management Service
 * 2026 Enterprise Standards: Service-First Logic
 */
export const VariantService = {

    /**
     * Internal helper for database connection
     */
    async getClient(txClient) {
        return txClient || await pool.connect();
    },

    /**
     * Recalculate parent product stock from active variants.
     */
    async syncParentStockFromVariants(productId, businessId, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const sumRes = await client.query(
                `SELECT COALESCE(SUM(stock), 0)::numeric AS total
                 FROM product_variants
                 WHERE product_id = $1 AND business_id = $2
                   AND COALESCE(is_active, true) = true
                   AND COALESCE(is_deleted, false) = false`,
                [productId, businessId]
            );
            const total = Number(sumRes.rows[0]?.total) || 0;
            await client.query(
                `UPDATE products SET stock = $1, has_variants = $2, updated_at = NOW()
                 WHERE id = $3 AND business_id = $4`,
                [total, total > 0, productId, businessId]
            );
            return total;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Create a new variant
     */
    async createVariant(variantData, txClient = null) {
        const client = await this.getClient(txClient);
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

            await client.query(
                `UPDATE products SET has_variants = true, updated_at = NOW()
                 WHERE id = $1 AND business_id = $2`,
                [product_id, business_id]
            );

            await this.syncParentStockFromVariants(product_id, business_id, client);

            log.info('Variant created', { variantId: result.rows[0].id, sku: variant_sku });
            return result.rows[0];
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Get variants for a product
     */
    async getProductVariants(productId, businessId, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const result = await client.query(
                'SELECT * FROM product_variants WHERE product_id = $1 AND business_id = $2 AND is_active = true AND is_deleted = false ORDER BY size, color',
                [productId, businessId]
            );
            return result.rows;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Update variant stock atomically
     */
    async updateVariantStock(variantId, businessId, quantityChange, reason = 'Adjustment', txClient = null) {
        const client = await this.getClient(txClient);
        const shouldManageTransaction = !txClient;
        try {
            if (shouldManageTransaction) await client.query('BEGIN');

            const result = await client.query(`
                UPDATE product_variants 
                SET stock = stock + $1, updated_at = NOW()
                WHERE id = $2 AND business_id = $3
                RETURNING *
            `, [quantityChange, variantId, businessId]);

            if (result.rows.length === 0) throw new Error('Variant not found');
            const variant = result.rows[0];

            // Record movement
            await client.query(`
                INSERT INTO stock_movements (
                    business_id, product_id, variant_id, movement_type, 
                    transaction_type, quantity_change, unit_cost, reference_type, notes
                ) VALUES ($1, $2, $3, $4, 'adjustment', $5, $6, 'adjustment', $7)
            `, [
                businessId, variant.product_id, variantId,
                quantityChange > 0 ? 'adjustment_in' : 'adjustment_out',
                quantityChange, variant.cost_price || 0, reason
            ]);

            if (shouldManageTransaction) await client.query('COMMIT');
            return variant;
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Search variants with filters
     */
    async searchVariants(businessId, filters = {}, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const fields = ['business_id = $1', 'is_active = true', 'is_deleted = false'];
            const values = [businessId];
            let idx = 2;

            if (filters.size) { fields.push(`size = $${idx++}`); values.push(filters.size); }
            if (filters.color) { fields.push(`color = $${idx++}`); values.push(filters.color); }
            if (filters.productId) { fields.push(`product_id = $${idx++}`); values.push(filters.productId); }

            const result = await client.query(`
                SELECT * FROM product_variants 
                WHERE ${fields.join(' AND ')}
            `, values);

            return result.rows;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Resolve product base SKU for variant SKU generation.
     */
    async resolveProductSku(client, productId, businessId) {
        const res = await client.query(
            'SELECT sku, name, price, cost_price, mrp FROM products WHERE id = $1 AND business_id = $2',
            [productId, businessId]
        );
        return res.rows[0] || null;
    },

    /**
     * Sync variant rows from form/matrix — upserts by SKU, updates parent stock sum.
     */
    async syncProductVariants(productId, businessId, variantRows, options = {}, txClient = null) {
        const client = await this.getClient(txClient);
        const shouldManageTransaction = !txClient;

        if (!Array.isArray(variantRows) || variantRows.length === 0) {
            return { count: 0, variants: [], totalStock: 0 };
        }

        try {
            if (shouldManageTransaction) await client.query('BEGIN');

            const product = await this.resolveProductSku(client, productId, businessId);
            if (!product) throw new Error('Product not found');

            const baseSku = options.baseSku || product.sku || 'PROD';
            const basePrice = Number(options.basePrice ?? product.price) || 0;
            const baseCost = Number(options.baseCostPrice ?? product.cost_price) || 0;
            const baseMrp = Number(options.baseMrp ?? product.mrp) || 0;

            const results = [];
            let totalStock = 0;
            let isFirst = true;

            for (const row of variantRows) {
                const size = row.size || null;
                const color = row.color || null;
                const stock = Number(row.stock) || 0;
                totalStock += stock;

                const variantSku =
                    row.variant_sku ||
                    row.variantSku ||
                    buildVariantSku(baseSku, [size, color, row.pattern, row.material].filter(Boolean));

                const variantName =
                    row.variant_name ||
                    row.variantName ||
                    [size, color].filter(Boolean).join(' - ') ||
                    'Variant';

                const res = await client.query(`
                    INSERT INTO product_variants (
                        business_id, product_id, variant_sku, variant_name,
                        size, color, pattern, material, custom_attributes,
                        price, cost_price, mrp, stock, min_stock, image_url,
                        is_default, is_active
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true)
                    ON CONFLICT (business_id, variant_sku) WHERE COALESCE(is_deleted, false) = false DO UPDATE SET
                        variant_name = EXCLUDED.variant_name,
                        size = EXCLUDED.size,
                        color = EXCLUDED.color,
                        pattern = EXCLUDED.pattern,
                        material = EXCLUDED.material,
                        custom_attributes = EXCLUDED.custom_attributes,
                        price = EXCLUDED.price,
                        cost_price = EXCLUDED.cost_price,
                        mrp = EXCLUDED.mrp,
                        stock = EXCLUDED.stock,
                        min_stock = EXCLUDED.min_stock,
                        image_url = COALESCE(EXCLUDED.image_url, product_variants.image_url),
                        is_active = true,
                        is_deleted = false,
                        updated_at = NOW()
                    RETURNING *
                `, [
                    businessId, productId, variantSku, variantName,
                    size, color, row.pattern || null, row.material || null,
                    row.custom_attributes || row.customAttributes || {},
                    Number(row.price ?? basePrice) || 0,
                    Number(row.cost_price ?? row.costPrice ?? baseCost) || 0,
                    Number(row.mrp ?? baseMrp) || 0,
                    stock,
                    Number(row.min_stock ?? row.minStock) || 0,
                    row.image_url || row.imageUrl || null,
                    isFirst
                ]);
                if (res.rows[0]) results.push(res.rows[0]);
                isFirst = false;
            }

            await client.query(
                `UPDATE products SET has_variants = true, stock = $1, updated_at = NOW()
                 WHERE id = $2 AND business_id = $3`,
                [totalStock, productId, businessId]
            );

            if (shouldManageTransaction) await client.query('COMMIT');
            log.info('Variants synced', { productId, count: results.length, totalStock });
            return { count: results.length, variants: results, totalStock };
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Create variant matrix
     */
    async createVariantMatrix(data, txClient = null) {
        const client = await this.getClient(txClient);
        const shouldManageTransaction = !txClient;
        try {
            if (shouldManageTransaction) await client.query('BEGIN');

            const {
                business_id, product_id, sizes, colors,
                base_price, base_cost_price, base_mrp,
                price_modifiers = {}
            } = data;

            const product = await this.resolveProductSku(client, product_id, business_id);
            const baseSku = product?.sku || product_id;

            const results = [];
            for (const size of sizes) {
                const sizeModifier = Number(price_modifiers[size]) || 0;
                for (const color of colors) {
                    const variantSku = buildVariantSku(baseSku, [size, color]);
                    const variantName = `${size} - ${color}`;
                    const price = Number(base_price) + sizeModifier;

                    const res = await client.query(`
                        INSERT INTO product_variants (
                            business_id, product_id, variant_sku, variant_name,
                            size, color, price, cost_price, mrp, stock
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)
                        ON CONFLICT (business_id, variant_sku) WHERE COALESCE(is_deleted, false) = false DO UPDATE SET
                            size = EXCLUDED.size,
                            color = EXCLUDED.color,
                            price = EXCLUDED.price,
                            cost_price = EXCLUDED.cost_price,
                            mrp = EXCLUDED.mrp,
                            is_active = true,
                            is_deleted = false,
                            updated_at = NOW()
                        RETURNING *
                    `, [
                        business_id, product_id, variantSku, variantName,
                        size, color, price, base_cost_price, base_mrp
                    ]);
                    if (res.rows[0]) results.push(res.rows[0]);
                }
            }

            // Flag the parent product so the storefront renders the variant selector.
            if (results.length > 0) {
                await client.query(
                    `UPDATE products SET has_variants = true, updated_at = NOW()
                     WHERE id = $1 AND business_id = $2`,
                    [product_id, business_id]
                );
            }

            if (shouldManageTransaction) await client.query('COMMIT');
            return { count: results.length, variants: results };
        } catch (error) {
            if (shouldManageTransaction) await client.query('ROLLBACK');
            throw error;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Get variant matrix for UI
     */
    async getVariantMatrix(productId, businessId, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const result = await client.query(
                'SELECT * FROM product_variants WHERE product_id = $1 AND business_id = $2 AND is_active = true AND is_deleted = false',
                [productId, businessId]
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

            return { sizes, colors, matrix };
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Update variant pricing
     */
    async updateVariantPricing(variantId, businessId, pricingData, txClient = null) {
        const client = await this.getClient(txClient);
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

            if (setClauses.length === 0) throw new Error('No pricing fields provided');

            setClauses.push('updated_at = NOW()');

            values.push(variantId);
            values.push(businessId);

            const result = await client.query(`
                UPDATE product_variants 
                SET ${setClauses.join(', ')}
                WHERE id = $${idx++} AND business_id = $${idx}
                RETURNING *
            `, values);

            if (result.rows.length === 0) throw new Error('Variant not found');

            return result.rows[0];
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Create a single variant (manual add)
     */
    async createSingleVariant(data, txClient = null) {
        const payload = {
            ...data,
            variant_sku: data.variant_sku || buildVariantSku(
                data.base_sku || 'PROD',
                [data.size, data.color, data.pattern, data.material].filter(Boolean)
            ),
            variant_name: data.variant_name || [data.size, data.color].filter(Boolean).join(' - ') || 'Variant',
            price: data.price ?? 0,
            cost_price: data.cost_price ?? 0,
            mrp: data.mrp ?? 0,
        };
        return this.createVariant(payload, txClient);
    },

    /**
     * Update variant fields (stock, pricing, metadata)
     */
    async updateVariant(variantId, businessId, updates, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const allowed = {
                variant_name: updates.variant_name ?? updates.variantName,
                size: updates.size,
                color: updates.color,
                pattern: updates.pattern,
                material: updates.material,
                price: updates.price,
                cost_price: updates.cost_price ?? updates.costPrice,
                mrp: updates.mrp,
                stock: updates.stock,
                min_stock: updates.min_stock ?? updates.minStock,
                image_url: updates.image_url ?? updates.imageUrl,
                is_active: updates.is_active,
            };

            const setClauses = [];
            const values = [];
            let idx = 1;

            for (const [col, val] of Object.entries(allowed)) {
                if (val !== undefined) {
                    setClauses.push(`${col} = $${idx++}`);
                    values.push(val);
                }
            }

            if (setClauses.length === 0) throw new Error('No fields to update');

            setClauses.push('updated_at = NOW()');
            values.push(variantId, businessId);

            const result = await client.query(`
                UPDATE product_variants
                SET ${setClauses.join(', ')}
                WHERE id = $${idx++} AND business_id = $${idx}
                RETURNING *
            `, values);

            if (result.rows.length === 0) throw new Error('Variant not found');
            const updated = result.rows[0];
            if (updates.stock !== undefined) {
                await this.syncParentStockFromVariants(updated.product_id, businessId, client);
            }
            return updated;
        } finally {
            if (!txClient) client.release();
        }
    },

    /**
     * Soft delete a variant
     */
    async deleteVariant(variantId, businessId, txClient = null) {
        const client = await this.getClient(txClient);
        try {
            const result = await client.query(`
                UPDATE product_variants 
                SET is_deleted = true, deleted_at = NOW(), is_active = false
                WHERE id = $1 AND business_id = $2
                RETURNING id, product_id
            `, [variantId, businessId]);

            if (result.rows.length === 0) throw new Error('Variant not found');

            // Keep products.has_variants accurate: clear it once the last active variant is gone.
            const productId = result.rows[0].product_id;
            const remaining = await client.query(
                `SELECT COUNT(*)::int AS count FROM product_variants
                 WHERE product_id = $1 AND business_id = $2
                   AND COALESCE(is_active, true) = true
                   AND COALESCE(is_deleted, false) = false`,
                [productId, businessId]
            );
            await client.query(
                `UPDATE products SET has_variants = $1, updated_at = NOW()
                 WHERE id = $2 AND business_id = $3`,
                [remaining.rows[0].count > 0, productId, businessId]
            );

            return true;
        } finally {
            if (!txClient) client.release();
        }
    }
};
