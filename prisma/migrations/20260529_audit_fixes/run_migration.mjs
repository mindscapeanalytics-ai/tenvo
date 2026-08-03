import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connStr) {
    console.error('❌ Set DIRECT_URL or DATABASE_URL env var first');
    process.exit(1);
}
console.log('Using:', connStr.replace(/:[^:@]+@/, ':***@'));

const sql = readFileSync(join(__dirname, 'migration.sql'), 'utf8');
const pool = new pg.Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function run() {
    const client = await pool.connect();
    try {
        console.log('🚀 Running audit fixes migration...\n');
        await client.query(sql);
        console.log('✅ Migration completed successfully!\n');

        const checks = [
            { table: 'quotations', cols: ['is_deleted', 'deleted_at'] },
            { table: 'sales_orders', cols: ['is_deleted', 'deleted_at'] },
            { table: 'delivery_challans', cols: ['is_deleted', 'deleted_at', 'warehouse_id', 'subtotal', 'tax_total', 'total_amount'] },
        ];
        for (const { table, cols } of checks) {
            const res = await client.query(
                `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = ANY($2)`,
                [table, cols]
            );
            const found = res.rows.map(r => r.column_name);
            const missing = cols.filter(c => !found.includes(c));
            console.log(missing.length === 0
                ? `  ✅ ${table}: all columns verified`
                : `  ⚠️  ${table}: missing: ${missing.join(', ')}`);
        }

        const deadTable = await client.query(
            `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_challan_items') as "exists"`
        );
        console.log(deadTable.rows[0].exists
            ? '  ⚠️  delivery_challan_items still exists (has data)'
            : '  ✅ delivery_challan_items removed');

        const idxRes = await client.query(
            `SELECT indexname FROM pg_indexes WHERE indexname IN ('idx_delivery_challans_sales_order_id','idx_payment_allocations_business_id','idx_challan_items_batch_id')`
        );
        console.log(`  ✅ Indexes: ${idxRes.rows.map(r => r.indexname).join(', ') || 'verified'}`);
        console.log('\n🎉 All done!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (err.detail) console.error('  Detail:', err.detail);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
