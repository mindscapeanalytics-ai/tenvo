-- SQL Migration: Fix Schema Mismatch for Inventory Tables
-- Target: product_serials, product_variants, products

BEGIN;

-- 1. Add missing columns and indices to product_serials
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_serials' AND column_name='is_deleted') THEN
        ALTER TABLE product_serials ADD COLUMN is_deleted BOOLEAN DEFAULT false;
        ALTER TABLE product_serials ADD COLUMN deleted_at TIMESTAMPTZ;
        CREATE INDEX idx_product_serials_is_deleted ON product_serials(is_deleted);
    END IF;
END $$;

-- Fix product_serials constraints: Drop global, Add composite
ALTER TABLE product_serials DROP CONSTRAINT IF EXISTS product_serials_serial_number_key;
ALTER TABLE product_serials DROP CONSTRAINT IF EXISTS product_serials_imei_key;
ALTER TABLE product_serials DROP CONSTRAINT IF EXISTS product_serials_mac_address_key;

ALTER TABLE product_serials ADD CONSTRAINT product_serials_business_id_serial_number_key UNIQUE (business_id, serial_number);
ALTER TABLE product_serials ADD CONSTRAINT product_serials_business_id_imei_key UNIQUE (business_id, imei);
ALTER TABLE product_serials ADD CONSTRAINT product_serials_business_id_mac_address_key UNIQUE (business_id, mac_address);

-- 2. Add missing columns and indices to product_variants
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_variants' AND column_name='is_deleted') THEN
        ALTER TABLE product_variants ADD COLUMN is_deleted BOOLEAN DEFAULT false;
        ALTER TABLE product_variants ADD COLUMN deleted_at TIMESTAMPTZ;
        CREATE INDEX idx_product_variants_is_deleted ON product_variants(is_deleted);
    END IF;
END $$;

-- Fix product_variants constraints: Drop global, Add composite
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_variant_sku_key;
ALTER TABLE product_variants ADD CONSTRAINT product_variants_business_id_variant_sku_key UNIQUE (business_id, variant_sku);

-- 3. Ensure products table has is_deleted index (it already has the column usually, but let's be sure)
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products(is_deleted);

-- 4. Standardize product_batches (Ensure is_deleted index exists)
CREATE INDEX IF NOT EXISTS idx_product_batches_is_deleted ON product_batches(is_deleted);

COMMIT;
