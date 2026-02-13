
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pool from '../lib/db';

// Handling __dirname in ES modules if needed, but tsx handles standard commonjs or esm
// We'll rely on simple relative paths

async function run() {
    console.log('🚀 Starting Database Optimization...');

    const sqlPath = path.join(process.cwd(), '20260213_optimize_product_indices.sql');

    if (!fs.existsSync(sqlPath)) {
        console.error('❌ SQL file not found at:', sqlPath);
        console.log('Please ensure the file exists in the root directory.');
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📝 Loaded SQL migration.');

    try {
        const client = await pool.connect();
        console.log('🔌 Connected to database.');

        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');
            console.log('✅ Optimization applied successfully!');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('❌ Error executing SQL:', err);
            process.exit(1);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    } finally {
        // End the pool to allow script to exit
        await pool.end();
    }
}

run();
