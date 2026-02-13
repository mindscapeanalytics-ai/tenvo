import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function runStep(sql: string, description: string) {
    console.log(`⏳ ${description}...`);
    try {
        await pool.query(sql);
        console.log(`✅ ${description} SUCCESS.`);
    } catch (err: any) {
        console.warn(`⚠️ ${description} SKIPPED/FAILED: ${err.message}`);
    }
}

async function run() {
    console.log('🏁 Starting Granular Schema Recovery...');

    // 1. Columns
    await runStep("ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS business_id UUID", "Adding business_id to product_serials");
    await runStep("ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false", "Adding is_deleted to product_serials");
    await runStep("ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ", "Adding deleted_at to product_serials");

    await runStep("ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS business_id UUID", "Adding business_id to product_variants");
    await runStep("ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false", "Adding is_deleted to product_variants");
    await runStep("ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ", "Adding deleted_at to product_variants");

    // 2. Drop Constraints
    await runStep("ALTER TABLE product_serials DROP CONSTRAINT IF EXISTS product_serials_serial_number_key", "Dropping global serial key");
    await runStep("ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_variant_sku_key", "Dropping global variant sku key");

    // 3. Add Composite Constraints
    await runStep("ALTER TABLE product_serials ADD CONSTRAINT product_serials_business_id_serial_number_key UNIQUE (business_id, serial_number)", "Adding composite serial key");
    await runStep("ALTER TABLE product_variants ADD CONSTRAINT product_variants_business_id_variant_sku_key UNIQUE (business_id, variant_sku)", "Adding composite variant sku key");

    // 4. Products Soft Delete
    await runStep("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false", "Adding is_deleted to products");
    await runStep("ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ", "Adding deleted_at to products");

    await runStep("ALTER TABLE product_batches ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false", "Adding is_deleted to product_batches");
    await runStep("ALTER TABLE product_batches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ", "Adding deleted_at to product_batches");

    console.log('✅ Finalizing recovery.');
    await pool.end();
}

run();
