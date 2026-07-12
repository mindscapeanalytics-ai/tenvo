#!/usr/bin/env node
/**
 * Fix All Schema Issues
 * - Add missing columns
 * - Add missing constraints
 * - Fix duplicate products
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function fixAllIssues() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing all schema issues...\n');
    console.log('═══════════════════════════════════════\n');

    await client.query('BEGIN');

    // 1. Add missing variant_id column
    console.log('📋 Step 1: Adding variant_id column to storefront_order_items');
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'storefront_order_items' 
              AND column_name = 'variant_id'
          ) THEN
              ALTER TABLE storefront_order_items 
              ADD COLUMN variant_id UUID;
              
              RAISE NOTICE 'Added variant_id column';
          ELSE
              RAISE NOTICE 'variant_id column already exists';
          END IF;
      END $$;
    `);
    console.log('  ✓ Done\n');

    // 2. Fix duplicate products by soft-deleting extras
    console.log('📋 Step 2: Fixing duplicate products (soft-delete extras)');
    
    // Find duplicates and keep the oldest one
    const dupSku = await client.query(`
      SELECT business_id, sku, array_agg(id ORDER BY created_at ASC) as product_ids
      FROM products
      WHERE COALESCE(is_deleted, false) = false
        AND sku IS NOT NULL
        AND TRIM(sku) != ''
      GROUP BY business_id, sku
      HAVING COUNT(*) > 1
    `);

    let deletedCount = 0;
    for (const row of dupSku.rows) {
      const [keep, ...toDelete] = row.product_ids;
      if (toDelete.length > 0) {
        await client.query(`
          UPDATE products 
          SET is_deleted = true, 
              deleted_at = NOW(),
              sku = sku || '-dup-' || SUBSTRING(id::text, 1, 8)
          WHERE id = ANY($1::uuid[])
        `, [toDelete]);
        deletedCount += toDelete.length;
      }
    }
    console.log(`  ✓ Soft-deleted ${deletedCount} duplicate SKU products\n`);

    // Fix duplicate names
    const dupName = await client.query(`
      SELECT business_id, name, array_agg(id ORDER BY created_at ASC) as product_ids
      FROM products
      WHERE COALESCE(is_deleted, false) = false
        AND name IS NOT NULL
        AND TRIM(name) != ''
      GROUP BY business_id, name
      HAVING COUNT(*) > 1
    `);

    let nameFixCount = 0;
    for (const row of dupName.rows) {
      const [keep, ...toModify] = row.product_ids;
      if (toModify.length > 0) {
        // Instead of soft-deleting, append a number to the name
        for (let i = 0; i < toModify.length; i++) {
          await client.query(`
            UPDATE products 
            SET name = name || ' #' || $1
            WHERE id = $2::uuid
          `, [i + 2, toModify[i]]);
          nameFixCount++;
        }
      }
    }
    console.log(`  ✓ Fixed ${nameFixCount} duplicate product names\n`);

    // 3. Add unique constraint on (business_id, order_number)
    console.log('📋 Step 3: Adding unique constraint on storefront_orders');
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'storefront_orders_business_id_order_number_key'
          ) THEN
              ALTER TABLE storefront_orders 
              ADD CONSTRAINT storefront_orders_business_id_order_number_key 
              UNIQUE (business_id, order_number);
              
              RAISE NOTICE 'Added unique constraint';
          ELSE
              RAISE NOTICE 'Unique constraint already exists';
          END IF;
      END $$;
    `);
    console.log('  ✓ Done\n');

    await client.query('COMMIT');

    console.log('═══════════════════════════════════════');
    console.log('✅ All schema issues fixed!\n');
    console.log('📋 Next steps:');
    console.log('  1. Mark failed migration as resolved:');
    console.log('     npx prisma migrate resolve --rolled-back "20260713_products_unique_constraints"');
    console.log('  2. Apply the migration:');
    console.log('     npx prisma migrate deploy');
    console.log('  3. Verify schema:');
    console.log('     node scripts/verify-schema-columns.mjs\n');

    return 0;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing schema:', error.message);
    console.error(error.stack);
    return 1;
  } finally {
    client.release();
    await pool.end();
  }
}

fixAllIssues().then(code => process.exit(code));
