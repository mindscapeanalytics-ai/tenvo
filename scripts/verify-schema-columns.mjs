#!/usr/bin/env node
/**
 * Verify Database Schema Columns
 * Connects to the database and checks actual column presence
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
});

const EXPECTED_SCHEMA = {
  storefront_orders: [
    'id', 'business_id', 'order_number', 'customer_email', 'customer_phone',
    'customer_name', 'shipping_address', 'billing_address', 'subtotal',
    'tax_amount', 'shipping_amount', 'discount_amount', 'total_amount',
    'currency', 'status', 'payment_status', 'fulfillment_status',
    'notes', 'metadata', 'created_at', 'updated_at'
  ],
  storefront_order_items: [
    'id', 'order_id', 'business_id', 'product_id', 'product_name',
    'product_sku', 'variant_id', 'quantity', 'unit_price', 
    'tax_amount', 'total_price', 'metadata'
  ],
  products: [
    'id', 'business_id', 'name', 'sku', 'barcode', 'price', 'stock',
    'is_deleted', 'deleted_at', 'has_variants'
  ],
  product_variants: [
    'id', 'business_id', 'product_id', 'variant_sku', 'variant_name',
    'price', 'stock', 'is_deleted', 'deleted_at'
  ],
  product_stock_locations: [
    'id', 'business_id', 'product_id', 'warehouse_id', 'quantity', 'state'
  ],
  invoice_payments: [
    'id', 'business_id', 'invoice_id', 'amount', 'payment_method',
    'payment_date', 'received_by', 'is_deleted', 'deleted_at'
  ]
};

async function getTableColumns(tableName) {
  const result = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  
  return result.rows;
}

async function checkIndexes(tableName) {
  const result = await pool.query(`
    SELECT
      i.relname as index_name,
      a.attname as column_name,
      ix.indisunique as is_unique,
      ix.indisprimary as is_primary
    FROM
      pg_class t,
      pg_class i,
      pg_index ix,
      pg_attribute a
    WHERE
      t.oid = ix.indrelid
      AND i.oid = ix.indexrelid
      AND a.attrelid = t.oid
      AND a.attnum = ANY(ix.indkey)
      AND t.relname = $1
    ORDER BY i.relname, a.attname
  `, [tableName]);
  
  return result.rows;
}

async function verifySchema() {
  console.log('🔍 Verifying Database Schema\n');
  console.log('═══════════════════════════════════════\n');

  const issues = {
    missingTables: [],
    missingColumns: [],
    extraColumns: [],
    missingIndexes: []
  };

  for (const [tableName, expectedColumns] of Object.entries(EXPECTED_SCHEMA)) {
    console.log(`📋 Checking table: ${tableName}`);
    
    try {
      const actualColumns = await getTableColumns(tableName);
      
      if (actualColumns.length === 0) {
        console.log(`  ❌ Table does not exist\n`);
        issues.missingTables.push(tableName);
        continue;
      }

      const actualColumnNames = actualColumns.map(c => c.column_name);
      const missing = expectedColumns.filter(c => !actualColumnNames.includes(c));
      const extra = actualColumnNames.filter(c => !expectedColumns.includes(c) && c !== 'created_at' && c !== 'updated_at');

      console.log(`  ✓ Table exists with ${actualColumns.length} columns`);

      if (missing.length > 0) {
        console.log(`  ⚠️  Missing expected columns: ${missing.join(', ')}`);
        issues.missingColumns.push({ table: tableName, columns: missing });
      } else {
        console.log(`  ✓ All expected columns present`);
      }

      // Show key columns with their types
      const keyColumns = actualColumns.filter(c => 
        expectedColumns.includes(c.column_name) || 
        c.column_name === 'business_id' || 
        c.column_name === 'id'
      );
      
      console.log(`  📊 Key columns:`);
      keyColumns.slice(0, 5).forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`     - ${col.column_name}: ${col.data_type} ${nullable}`);
      });
      if (keyColumns.length > 5) {
        console.log(`     ... and ${keyColumns.length - 5} more`);
      }

      // Check indexes
      const indexes = await checkIndexes(tableName);
      const uniqueIndexes = indexes.filter(i => i.is_unique && !i.is_primary);
      if (uniqueIndexes.length > 0) {
        console.log(`  🔑 Unique constraints: ${uniqueIndexes.length}`);
      }

      console.log('');
    } catch (error) {
      console.log(`  ❌ Error checking table: ${error.message}\n`);
      issues.missingTables.push(tableName);
    }
  }

  // Check critical constraints
  console.log('🔑 Checking Critical Constraints\n');
  
  // Check storefront_orders unique constraint
  try {
    const result = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'storefront_orders'
        AND constraint_type = 'UNIQUE'
    `);
    
    const hasBusinessOrderUnique = result.rows.some(r => 
      r.constraint_name.includes('business') && r.constraint_name.includes('order_number')
    );
    
    if (hasBusinessOrderUnique) {
      console.log('  ✓ storefront_orders: (business_id, order_number) UNIQUE');
    } else {
      console.log('  ⚠️  storefront_orders: Missing (business_id, order_number) UNIQUE');
      issues.missingIndexes.push('storefront_orders (business_id, order_number) UNIQUE');
    }
  } catch (error) {
    console.log(`  ⚠️  Could not verify constraints: ${error.message}`);
  }

  // Check for orphan global unique on order_number
  try {
    const result = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'storefront_orders'
        AND indexname LIKE '%order_number%'
    `);
    
    const hasGlobalUnique = result.rows.some(r => 
      r.indexname.includes('order_number') && 
      !r.indexname.includes('business')
    );
    
    if (hasGlobalUnique) {
      console.log('  ⚠️  Found orphan global order_number index (should be removed)');
      issues.missingIndexes.push('Remove orphan global order_number index');
    } else {
      console.log('  ✓ No orphan global order_number index');
    }
  } catch (error) {
    console.log(`  ⚠️  Could not check indexes: ${error.message}`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 VERIFICATION SUMMARY\n');

  let totalIssues = 0;

  if (issues.missingTables.length > 0) {
    console.log('❌ Missing Tables:');
    issues.missingTables.forEach(t => console.log(`  - ${t}`));
    totalIssues += issues.missingTables.length;
    console.log('');
  }

  if (issues.missingColumns.length > 0) {
    console.log('⚠️  Missing Columns:');
    issues.missingColumns.forEach(({ table, columns }) => {
      console.log(`  ${table}:`);
      columns.forEach(c => console.log(`    - ${c}`));
    });
    totalIssues += issues.missingColumns.length;
    console.log('');
  }

  if (issues.missingIndexes.length > 0) {
    console.log('⚠️  Index Issues:');
    issues.missingIndexes.forEach(i => console.log(`  - ${i}`));
    totalIssues += issues.missingIndexes.length;
    console.log('');
  }

  if (totalIssues === 0) {
    console.log('✅ All required schema elements are present!\n');
  } else {
    console.log(`❌ Found ${totalIssues} schema issues\n`);
  }

  console.log('═══════════════════════════════════════\n');

  return totalIssues === 0 ? 0 : 1;
}

// Run verification
verifySchema()
  .then(exitCode => {
    pool.end();
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    pool.end();
    process.exit(1);
  });
