-- =============================================
-- Migration: Normalize Entity Status (is_active, is_deleted)
-- Applied to: customers, vendors
-- =============================================

-- 1. CUSTOMERS TABLE UPDATES
DO $$ 
BEGIN 
    -- Add is_active if not exists
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='customers' AND COLUMN_NAME='is_active') THEN
        ALTER TABLE customers ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add is_deleted if not exists (already exists in Prisma schema but checking DB)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='customers' AND COLUMN_NAME='is_deleted') THEN
        ALTER TABLE customers ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;

    -- Add deleted_at if not exists
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='customers' AND COLUMN_NAME='deleted_at') THEN
        ALTER TABLE customers ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Update existing records to ensure non-null defaults
UPDATE customers SET is_active = true WHERE is_active IS NULL;
UPDATE customers SET is_deleted = false WHERE is_deleted IS NULL;

-- 2. VENDORS TABLE UPDATES
DO $$ 
BEGIN 
    -- Add is_active if not exists
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='vendors' AND COLUMN_NAME='is_active') THEN
        ALTER TABLE vendors ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Add is_deleted if not exists
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='vendors' AND COLUMN_NAME='is_deleted') THEN
        ALTER TABLE vendors ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;

    -- Add deleted_at if not exists
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='vendors' AND COLUMN_NAME='deleted_at') THEN
        ALTER TABLE vendors ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Update existing records
UPDATE vendors SET is_active = true WHERE is_active IS NULL;
UPDATE vendors SET is_deleted = false WHERE is_deleted IS NULL;

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_customers_status_filter ON customers(business_id, is_active, is_deleted);
CREATE INDEX IF NOT EXISTS idx_vendors_status_filter ON vendors(business_id, is_active, is_deleted);

-- 4. PRODUCTS SANITY CHECK (Already has is_active, but ensuring is_deleted exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='products' AND COLUMN_NAME='is_deleted') THEN
        ALTER TABLE products ADD COLUMN is_deleted BOOLEAN DEFAULT false;
        ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

UPDATE products SET is_deleted = false WHERE is_deleted IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_status_filter ON products(business_id, is_active, is_deleted);
