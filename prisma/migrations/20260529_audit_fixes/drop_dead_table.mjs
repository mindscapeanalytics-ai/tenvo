import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) {
    console.error('❌ Set DIRECT_URL or DATABASE_URL env var first');
    process.exit(1);
}

const pool = new pg.Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function run() {
    const client = await pool.connect();
    try {
        console.log('🚀 Dropping deprecated delivery_challan_items table...\n');
        await client.query('DROP TABLE IF EXISTS "delivery_challan_items" CASCADE;');
        console.log('✅ Table dropped successfully!\n');
    } catch (err) {
        console.error('❌ Drop failed:', err.message);
        if (err.detail) console.error('  Detail:', err.detail);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
