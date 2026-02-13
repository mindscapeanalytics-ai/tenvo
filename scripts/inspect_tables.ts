import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const tables = ['product_serials', 'product_variants', 'products', 'product_batches'];
        for (const table of tables) {
            console.log(`\n📊 Table: ${table}`);
            const res = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table]);
            if (res.rows.length === 0) {
                console.log('⚠️ No columns found (table might not exist or name is incorrect)');
            } else {
                console.table(res.rows);
            }
        }
    } catch (err) {
        console.error('❌ Diagnostic failed:', err);
    } finally {
        await pool.end();
    }
}

run();
