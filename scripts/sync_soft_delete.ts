
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function syncSoftDeleteStates() {
    const client = await pool.connect();
    try {
        console.log('🔄 Syncing Soft-Delete States for Legacy Records...\n');

        // 1. Sync product_variants
        console.log('📦 Updating product_variants...');
        const variantRes = await client.query(`
      UPDATE product_variants 
      SET is_deleted = false 
      WHERE is_deleted IS NULL
    `);
        console.log(`✅ ${variantRes.rowCount} variants updated.`);

        // 2. Sync product_batches
        console.log('📦 Updating product_batches...');
        const batchRes = await client.query(`
      UPDATE product_batches 
      SET is_deleted = false 
      WHERE is_deleted IS NULL
    `);
        console.log(`✅ ${batchRes.rowCount} batches updated.`);

        // 3. Sync product_serials
        console.log('📦 Updating product_serials...');
        const serialRes = await client.query(`
      UPDATE product_serials 
      SET is_deleted = false 
      WHERE is_deleted IS NULL
    `);
        console.log(`✅ ${serialRes.rowCount} serials updated.`);

        console.log('\n----------------------------------------');
        console.log('🏁 Sync Complete.');

    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

syncSoftDeleteStates();
