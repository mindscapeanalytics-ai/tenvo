#!/usr/bin/env node
/**
 * Fix Storefront Order Number Constraint Issue
 * 
 * Problem: "duplicate key value violates unique constraint storefront_orders_order_number_key"
 * Root Cause: Global unique constraint on order_number prevents multiple businesses from
 *             using the same order number format (e.g., ORD-20260703-0001).
 * 
 * Solution: Drop global constraint, add composite (business_id, order_number) constraint
 */

import pool from '../lib/db.js';

async function fixOrderNumberConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking storefront_orders constraints...\n');
    
    // Step 1: Check current constraints
    const constraintsResult = await client.query(`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'storefront_orders'::regclass
        AND conname LIKE '%order_number%'
      ORDER BY conname
    `);
    
    console.log('Current constraints:');
    constraintsResult.rows.forEach(row => {
      console.log(`  - ${row.constraint_name} (${row.constraint_type}): ${row.definition}`);
    });
    console.log('');
    
    // Step 2: Drop orphan global unique index (constraint drop alone may leave this behind)
    console.log('\n🗑️  Dropping orphan global index if present...');
    await client.query(`DROP INDEX IF EXISTS storefront_orders_order_number_key`);

    // Step 3: Drop remaining order_number unique constraints
    const constraintsToDrop = await client.query(`
      SELECT conname
      FROM pg_constraint 
      WHERE conrelid = 'storefront_orders'::regclass
        AND contype = 'u'
        AND conname LIKE '%order_number%'
    `);
    
    for (const row of constraintsToDrop.rows) {
      console.log(`🗑️  Dropping constraint: ${row.conname}`);
      await client.query(`
        ALTER TABLE storefront_orders 
        DROP CONSTRAINT IF EXISTS ${row.conname} CASCADE
      `);
    }
    
    // Step 4: Add composite unique constraint
    console.log('\n✅ Adding composite unique constraint (business_id, order_number)...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'storefront_orders_business_id_order_number_key'
            AND conrelid = 'storefront_orders'::regclass
        ) THEN
          ALTER TABLE storefront_orders
            ADD CONSTRAINT storefront_orders_business_id_order_number_key
            UNIQUE (business_id, order_number);
        END IF;
      END;
      $$;
    `);
    
    // Step 5: Ensure indexes exist
    console.log('📊 Creating indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_id
        ON storefront_orders (business_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_storefront_orders_business_order
        ON storefront_orders (business_id, order_number)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_storefront_orders_email
        ON storefront_orders (customer_email)
    `);
    
    // Step 6: Verify the fix
    console.log('\n🔍 Verifying fix...');
    
    const verifyResult = await client.query(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'storefront_orders'::regclass
        AND conname LIKE '%order_number%'
      ORDER BY conname
    `);
    
    console.log('\nFinal constraints:');
    verifyResult.rows.forEach(row => {
      console.log(`  ✓ ${row.constraint_name}: ${row.definition}`);
    });
    
    const indexVerify = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'storefront_orders'
        AND indexname = 'storefront_orders_order_number_key'
    `);

    const hasGlobalIndex = indexVerify.rows.length > 0;
    if (hasGlobalIndex) {
      console.log('\n⚠️  Global index still present:', indexVerify.rows[0]?.indexdef);
    }

    // Step 7: Final check
    const hasGlobal = verifyResult.rows.some(r => 
      r.constraint_name === 'storefront_orders_order_number_key'
    );
    
    const hasComposite = verifyResult.rows.some(r => 
      r.constraint_name === 'storefront_orders_business_id_order_number_key'
    );
    
    console.log('\n' + '='.repeat(60));
    if (!hasGlobal && !hasGlobalIndex && hasComposite) {
      console.log('✅ SUCCESS! Constraints are correctly configured.');
      console.log('   Multiple businesses can now use the same order number.');
    } else {
      console.log('⚠️  WARNING: Configuration may not be optimal.');
      if (hasGlobal) console.log('   - Global constraint still exists');
      if (hasGlobalIndex) console.log('   - Global unique index still exists');
      if (!hasComposite) console.log('   - Composite constraint missing');
    }
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error fixing constraints:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the fix
fixOrderNumberConstraint()
  .then(() => {
    console.log('✅ Fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
