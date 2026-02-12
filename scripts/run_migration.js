const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    });

    const client = await pool.connect();

    try {
        console.log('🔄 Running migration 026_fix_stock_locations_schema.sql...\n');

        const migrationPath = path.join(__dirname, 'supabase', 'migrations', '026_fix_stock_locations_schema.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        await client.query(sql);

        console.log('✅ Migration completed successfully!\n');

        // Verify the schema
        console.log('🔍 Verifying schema...\n');
        const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'product_stock_locations'
      ORDER BY ordinal_position;
    `);

        console.log('Columns in product_stock_locations:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})${row.column_default ? ` DEFAULT ${row.column_default}` : ''}`);
        });

        // Check constraints
        const constraints = await client.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'product_stock_locations';
    `);

        console.log('\nConstraints:');
        constraints.rows.forEach(row => {
            console.log(`  - ${row.constraint_name} (${row.constraint_type})`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
