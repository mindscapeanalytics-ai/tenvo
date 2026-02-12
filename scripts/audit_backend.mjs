import 'dotenv/config';
import pool from './lib/db.js';

async function auditBackend() {
    const client = await pool.connect();

    try {
        console.log('🔍 Backend Audit Report\n');
        console.log('='.repeat(60));

        // 1. Check all tables exist
        console.log('\n1. Database Tables:');
        const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
        console.log(`   ✓ Found ${tables.rows.length} tables`);

        // 2. Check for missing foreign keys
        console.log('\n2. Foreign Key Integrity:');
        const fks = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'FOREIGN KEY';
    `);
        console.log(`   ✓ ${fks.rows[0].count} foreign key constraints`);

        // 3. Check for indexes
        console.log('\n3. Performance Indexes:');
        const indexes = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `);
        console.log(`   ✓ ${indexes.rows[0].count} indexes created`);

        // 4. Check critical tables
        console.log('\n4. Critical Tables Check:');
        const criticalTables = [
            'businesses',
            'products',
            'product_stock_locations',
            'warehouse_locations',
            'invoices',
            'invoice_items',
            'customers',
            'vendors',
            'payments',
            'general_ledger',
            'stock_movements',
            'product_batches',
            'product_serials',
            'workflow_rules',
            'workflow_history'
        ];

        for (const table of criticalTables) {
            const result = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = $1;
      `, [table]);

            if (result.rows[0].count > 0) {
                console.log(`   ✓ ${table}`);
            } else {
                console.log(`   ✗ ${table} (MISSING)`);
            }
        }

        // 5. Check for orphaned records
        console.log('\n5. Data Integrity:');

        // Check products without business
        const orphanedProducts = await client.query(`
      SELECT COUNT(*) as count 
      FROM products p 
      LEFT JOIN businesses b ON p.business_id = b.id 
      WHERE b.id IS NULL;
    `);
        console.log(`   ${orphanedProducts.rows[0].count === '0' ? '✓' : '✗'} Products: ${orphanedProducts.rows[0].count} orphaned records`);

        // Check stock locations without warehouse
        const orphanedStock = await client.query(`
      SELECT COUNT(*) as count 
      FROM product_stock_locations psl 
      LEFT JOIN warehouse_locations wl ON psl.warehouse_id = wl.id 
      WHERE wl.id IS NULL;
    `);
        console.log(`   ${orphanedStock.rows[0].count === '0' ? '✓' : '✗'} Stock Locations: ${orphanedStock.rows[0].count} orphaned records`);

        // 6. Check schema consistency
        console.log('\n6. Schema Consistency:');

        // Check product_stock_locations has state column
        const stateColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'product_stock_locations' 
      AND column_name = 'state';
    `);
        console.log(`   ${stateColumn.rows.length > 0 ? '✓' : '✗'} product_stock_locations.state column`);

        // Check product_stock_locations has warehouse_id
        const warehouseIdColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'product_stock_locations' 
      AND column_name = 'warehouse_id';
    `);
        console.log(`   ${warehouseIdColumn.rows.length > 0 ? '✓' : '✗'} product_stock_locations.warehouse_id column`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ Backend audit complete!\n');

    } catch (error) {
        console.error('❌ Audit failed:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

auditBackend();
