import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function verifyIndex(indexName: string) {
    const res = await pool.query('SELECT 1 FROM pg_indexes WHERE indexname = $1', [indexName]);
    return res.rows.length > 0;
}

async function run() {
    console.log('🏁 Starting Verified Index Creation...');

    const indices = [
        { name: 'idx_inventory_ledger_created_at_br', sql: 'CREATE INDEX IF NOT EXISTS idx_inventory_ledger_created_at_br ON inventory_ledger (business_id, created_at DESC)' },
        { name: 'idx_stock_movements_created_at_br', sql: 'CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at_br ON stock_movements (business_id, created_at DESC)' },
        { name: 'idx_gl_entries_transaction_date_br', sql: 'CREATE INDEX IF NOT EXISTS idx_gl_entries_transaction_date_br ON gl_entries (business_id, transaction_date DESC)' },
        { name: 'idx_production_orders_scheduled_date_br', sql: 'CREATE INDEX IF NOT EXISTS idx_production_orders_scheduled_date_br ON production_orders (business_id, scheduled_date DESC)' },
        { name: 'idx_invoices_date_br', sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_date_br ON invoices (business_id, date DESC)' },
        { name: 'idx_audit_logs_business_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_audit_logs_business_created_at ON audit_logs (business_id, created_at DESC)' }
    ];

    for (const idx of indices) {
        process.stdout.write(`⏳ Creating ${idx.name}... `);
        try {
            await pool.query(idx.sql);
            const exists = await verifyIndex(idx.name);
            if (exists) {
                console.log('✅ VERIFIED.');
            } else {
                console.log('❌ FAILED VERIFICATION (Index created but not found in catalog).');
            }
        } catch (err: any) {
            console.log(`❌ ERROR: ${err.message}`);
        }
    }

    console.log('✅ Process complete.');
    await pool.end();
}

run();
