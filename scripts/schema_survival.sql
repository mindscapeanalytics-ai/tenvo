-- Comprehensive Schema Survival Script
-- Ensures all multi-tenant and soft-delete columns exist across all inventory tables

BEGIN;

-- 1. FIX product_serials
DO $$ 
BEGIN
    -- Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_serials' AND column_name='business_id') THEN
        ALTER TABLE product_serials ADD COLUMN business_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_serials' AND column_name='is_deleted') THEN
        ALTER TABLE product_serials ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_serials' AND column_name='deleted_at') THEN
        ALTER TABLE product_serials ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    -- Indices
    CREATE INDEX IF NOT EXISTS idx_product_serials_business_id ON product_serials(business_id);
    CREATE INDEX IF NOT EXISTS idx_product_serials_is_deleted ON product_serials(is_deleted);
END $$;

-- Constraints for product_serials (Safe Drop & Add)
ALTER TABLE product_serials DROP CONSTRAINT IF EXISTS product_serials_serial_number_key;
ALTER TABLE product_serials DROP CONSTRAINT IF EXISTS product_serials_imei_key;
ALTER TABLE product_serials DROP CONSTRAINT IF EXISTS product_serials_mac_address_key;

-- We ignore errors on ADD if they already exist
DO $$ BEGIN
    ALTER TABLE product_serials ADD CONSTRAINT product_serials_business_id_serial_number_key UNIQUE (business_id, serial_number);
EXCEPTION WHEN others THEN RAISE NOTICE 'product_serials composite serial key already exists or failed';
END $$;

-- 2. FIX product_variants
DO $$ 
BEGIN
    -- Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_variants' AND column_name='business_id') THEN
        ALTER TABLE product_variants ADD COLUMN business_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_variants' AND column_name='is_deleted') THEN
        ALTER TABLE product_variants ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_variants' AND column_name='deleted_at') THEN
        ALTER TABLE product_variants ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;

    -- Indices
    CREATE INDEX IF NOT EXISTS idx_product_variants_business_id ON product_variants(business_id);
    CREATE INDEX IF NOT EXISTS idx_product_variants_is_deleted ON product_variants(is_deleted);
END $$;

-- Constraints for product_variants
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_variant_sku_key;
DO $$ BEGIN
    ALTER TABLE product_variants ADD CONSTRAINT product_variants_business_id_variant_sku_key UNIQUE (business_id, variant_sku);
EXCEPTION WHEN others THEN RAISE NOTICE 'product_variants composite sku key already exists or failed';
END $$;

-- 3. FIX products
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_deleted') THEN
        ALTER TABLE products ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='deleted_at') THEN
        ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted);
END $$;

-- 4. FIX product_batches
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_batches' AND column_name='is_deleted') THEN
        ALTER TABLE product_batches ADD COLUMN is_deleted BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_batches' AND column_name='deleted_at') THEN
        ALTER TABLE product_batches ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_product_batches_is_deleted ON product_batches(is_deleted);
END $$;

COMMIT;
