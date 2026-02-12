import 'dotenv/config';
import pool from './lib/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    console.log('🔗 Connecting to database...');

    const client = await pool.connect();

    try {
        console.log('✅ Connected successfully!\n');
        console.log('🔄 Running migration 027_add_missing_tables.sql...\n');

        const migrationPath = path.join(__dirname, 'supabase', 'migrations', '027_add_missing_tables.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        await client.query(sql);

        console.log('✅ Migration completed successfully!\n');

        // Verify the tables
        console.log('🔍 Verifying tables...\n');

        const tables = ['general_ledger', 'workflow_rules', 'workflow_history'];

        for (const table of tables) {
            const result = await client.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = $1;
      `, [table]);

            if (result.rows[0].count > 0) {
                console.log(`✓ ${table} exists`);

                // Show columns
                const columns = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `, [table]);

                columns.rows.forEach(col => {
                    console.log(`  - ${col.column_name} (${col.data_type})`);
                });
                console.log('');
            } else {
                console.log(`✗ ${table} NOT FOUND`);
            }
        }

        console.log('✅ Verification complete!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
