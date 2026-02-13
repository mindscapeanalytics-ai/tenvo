
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateVariants() {
    const client = await pool.connect();
    try {
        console.log('Starting Variant Unification Migration...');
        await client.query('BEGIN');

        // 1. Fetch products with potential JSON variant data
        const res = await client.query(`
      SELECT id, name, sku, business_id, variants 
      FROM products 
      WHERE variants IS NOT NULL 
      AND variants::text != '[]' 
      AND variants::text != 'null'
    `);

        console.log(`Found ${res.rowCount} products with JSON variants.`);

        for (const product of res.rows) {
            const { id: productId, business_id, variants } = product;
            let variantData = [];

            try {
                variantData = typeof variants === 'string' ? JSON.parse(variants) : variants;
            } catch (e) {
                console.warn(`Failed to parse variants JSON for product ${product.id}:`, e);
                continue;
            }

            if (!Array.isArray(variantData) || variantData.length === 0) continue;

            console.log(`Migrating ${variantData.length} variants for product ${product.name} (${product.id})...`);

            for (const v of variantData) {
                // Map JSON fields to Table columns
                // Assuming JSON shape matched the payload structure
                const variantSku = v.sku || v.variant_sku || `${product.sku}-${Math.random().toString(36).substr(2, 5)}`;

                // Check if variant already exists in table
                const existing = await client.query(
                    `SELECT id FROM product_variants WHERE product_id = $1 AND variant_sku = $2`,
                    [productId, variantSku]
                );

                if (existing.rowCount === 0) {
                    // Insert
                    await client.query(`
            INSERT INTO product_variants (
                business_id, product_id, variant_sku, variant_name,
                size, color, pattern, material, custom_attributes,
                price, cost_price, mrp, stock, min_stock, image_url,
                is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true)
          `, [
                        business_id,
                        productId,
                        variantSku,
                        v.name || v.variant_name || `${product.name} - Variant`,
                        v.size || null,
                        v.color || null,
                        v.pattern || null,
                        v.material || null,
                        v.custom_attributes || v.customAttributes || {},
                        Number(v.price) || 0,
                        Number(v.cost_price || v.costPrice) || 0,
                        Number(v.mrp) || 0,
                        Number(v.stock) || 0,
                        Number(v.min_stock || v.minStock) || 0,
                        v.image_url || v.imageUrl || null
                    ]);
                }
            }
        }

        // 2. Clean up JSON columns
        console.log('Cleaning up redundant JSON columns...');
        await client.query(`
      UPDATE products 
      SET variants = '[]'::json, 
          batches = '[]'::json, 
          serial_numbers = '[]'::json
    `);

        // Optional: We could DROP the columns here, but usually safer to just clear data first.
        // For "Schema Perfection", we will issue ALTER TABLE later or manually. 
        // This script just unifies the DATA.

        await client.query('COMMIT');
        console.log('Migration completed successfully.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrateVariants();
