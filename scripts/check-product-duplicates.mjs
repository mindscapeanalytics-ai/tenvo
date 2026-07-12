#!/usr/bin/env node
/**
 * Check for duplicate products that would violate unique constraints
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate products...\n');

  try {
    // Check duplicate SKUs
    const dupSku = await pool.query(`
      SELECT business_id, sku, COUNT(*) as count, array_agg(id) as product_ids
      FROM products
      WHERE COALESCE(is_deleted, false) = false
        AND sku IS NOT NULL
        AND TRIM(sku) != ''
      GROUP BY business_id, sku
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `);

    console.log(`📦 Duplicate SKUs: ${dupSku.rows.length}`);
    if (dupSku.rows.length > 0) {
      dupSku.rows.forEach((row, i) => {
        console.log(`  ${i + 1}. SKU "${row.sku}" - ${row.count} products`);
        console.log(`     Business: ${row.business_id}`);
        console.log(`     IDs: ${row.product_ids.join(', ')}`);
      });
    } else {
      console.log('  ✓ No duplicate SKUs found');
    }

    // Check duplicate barcodes
    const dupBarcode = await pool.query(`
      SELECT business_id, barcode, COUNT(*) as count, array_agg(id) as product_ids
      FROM products
      WHERE COALESCE(is_deleted, false) = false
        AND barcode IS NOT NULL
        AND TRIM(barcode) != ''
      GROUP BY business_id, barcode
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `);

    console.log(`\n📊 Duplicate Barcodes: ${dupBarcode.rows.length}`);
    if (dupBarcode.rows.length > 0) {
      dupBarcode.rows.forEach((row, i) => {
        console.log(`  ${i + 1}. Barcode "${row.barcode}" - ${row.count} products`);
        console.log(`     Business: ${row.business_id}`);
        console.log(`     IDs: ${row.product_ids.join(', ')}`);
      });
    } else {
      console.log('  ✓ No duplicate barcodes found');
    }

    // Check duplicate names
    const dupName = await pool.query(`
      SELECT business_id, name, COUNT(*) as count, array_agg(id) as product_ids
      FROM products
      WHERE COALESCE(is_deleted, false) = false
        AND name IS NOT NULL
        AND TRIM(name) != ''
      GROUP BY business_id, name
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `);

    console.log(`\n🏷️  Duplicate Names: ${dupName.rows.length}`);
    if (dupName.rows.length > 0) {
      dupName.rows.forEach((row, i) => {
        console.log(`  ${i + 1}. Name "${row.name.substring(0, 50)}" - ${row.count} products`);
        console.log(`     Business: ${row.business_id}`);
        console.log(`     IDs: ${row.product_ids.slice(0, 3).join(', ')}${row.product_ids.length > 3 ? '...' : ''}`);
      });
    } else {
      console.log('  ✓ No duplicate names found');
    }

    const totalDups = dupSku.rows.length + dupBarcode.rows.length + dupName.rows.length;

    console.log('\n═══════════════════════════════════════');
    if (totalDups === 0) {
      console.log('✅ No duplicates found! Migration should succeed.\n');
      return 0;
    } else {
      console.log(`⚠️  Found ${totalDups} duplicate groups.\n`);
      console.log('💡 Options to fix:');
      console.log('  1. Soft-delete duplicates (recommended):');
      console.log('     UPDATE products SET is_deleted = true WHERE id IN (...)');
      console.log('  2. Modify SKUs/names:');
      console.log('     UPDATE products SET sku = sku || \'-dup\' WHERE id IN (...)');
      console.log('  3. Mark migration as resolved:');
      console.log('     npx prisma migrate resolve --rolled-back "20260713_products_unique_constraints"\n');
      return 1;
    }
  } catch (error) {
    console.error('Error:', error.message);
    return 1;
  } finally {
    await pool.end();
  }
}

checkDuplicates().then(code => process.exit(code));
