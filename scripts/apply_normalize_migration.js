const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const migrationSql = `
-- =============================================
-- Migration: Normalize Entity Status (is_active, is_deleted)
-- =============================================

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='customers' AND COLUMN_NAME='is_active') THEN
        ALTER TABLE customers ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='customers' AND COLUMN_NAME='is_deleted') THEN
        ALTER TABLE customers ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='customers' AND COLUMN_NAME='deleted_at') THEN
        ALTER TABLE customers ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

UPDATE customers SET is_active = true WHERE is_active IS NULL;
UPDATE customers SET is_deleted = false WHERE is_deleted IS NULL;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='vendors' AND COLUMN_NAME='is_active') THEN
        ALTER TABLE vendors ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='vendors' AND COLUMN_NAME='is_deleted') THEN
        ALTER TABLE vendors ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='vendors' AND COLUMN_NAME='deleted_at') THEN
        ALTER TABLE vendors ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

UPDATE vendors SET is_active = true WHERE is_active IS NULL;
UPDATE vendors SET is_deleted = false WHERE is_deleted IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_status_filter ON customers(business_id, is_active, is_deleted);
CREATE INDEX IF NOT EXISTS idx_vendors_status_filter ON vendors(business_id, is_active, is_deleted);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='is_deleted') THEN
        ALTER TABLE products ADD COLUMN is_deleted BOOLEAN DEFAULT false;
        ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

UPDATE products SET is_deleted = false WHERE is_deleted IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_status_filter ON products(business_id, is_active, is_deleted);
    `;

    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        try {
            console.log('Executing migration...');
            await client.query(migrationSql);
            console.log('Migration Applied Successfully');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
