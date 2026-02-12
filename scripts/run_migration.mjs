import 'dotenv/config';
import pool from './lib/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('🔗 Connecting to database...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set');

    const client = await pool.connect();

    try {
        console.log('✅ Connected successfully!\n');
        console.log('🔄 Running migration 026_fix_stock_locations_schema.sql...\n');

        const migrationPath = path.join(__dirname, 'supabase', 'migrations', '026_fix_stock_locations_schema.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Execute the entire migration as one transaction
        await client.query(sql);

        console.log('\n✅ Migration completed successfully!\n');

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

        console.log('\n✅ Schema verification complete!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }

        // If it's an "already exists" error, that's actually fine
        if (error.code === '42P07' || error.code === '42710' || error.message.includes('already exists')) {
            console.log('\n⚠️  Some objects already exist - this is normal if migration was partially run before.');
            console.log('Proceeding with verification...\n');

            // Still verify the schema
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
        } else {
            console.error('\nFull error:', error);
            process.exit(1);
        }
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
