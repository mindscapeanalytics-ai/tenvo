import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    console.log('🔍 Visual Index Verification...');
    try {
        const res = await pool.query(`
            SELECT tablename, indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename IN ('inventory_ledger', 'stock_movements', 'gl_entries', 'products', 'product_serials', 'product_variants')
            ORDER BY tablename, indexname
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Verification failed:', err);
    } finally {
        await pool.end();
    }
}

run();
