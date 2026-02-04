-- Migration: 021_domain_indexes.sql
-- Purpose: Add indexes for domain-specific fields to optimize performance

-- 1. Enable GIN extension if not already enabled (for JSONB indexing)
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 2. Add GIN index on domain_data JSONB column in products
CREATE INDEX IF NOT EXISTS idx_products_domain_data_gin ON products USING GIN (domain_data);

-- 3. Add partial indexes for commonly queried domain fields
-- These help drastically when filtering by specific domain attributes without scanning the whole table

-- Textile: Article No
CREATE INDEX IF NOT EXISTS idx_products_articleno ON products ((domain_data->>'articleno')) 
WHERE domain_data->>'articleno' IS NOT NULL;

-- Textile: Design No
CREATE INDEX IF NOT EXISTS idx_products_designno ON products ((domain_data->>'designno')) 
WHERE domain_data->>'designno' IS NOT NULL;

-- Mobile/Electronics: IMEI (Critical for serial tracking lookup)
CREATE INDEX IF NOT EXISTS idx_products_imei ON products ((domain_data->>'imei')) 
WHERE domain_data->>'imei' IS NOT NULL;

-- Auto Parts: Part Number
CREATE INDEX IF NOT EXISTS idx_products_partnumber ON products ((domain_data->>'partnumber')) 
WHERE domain_data->>'partnumber' IS NOT NULL;

-- Auto Parts: Vehicle Model (for rapid fitment search)
CREATE INDEX IF NOT EXISTS idx_products_vehiclemodel ON products ((domain_data->>'vehiclemodel')) 
WHERE domain_data->>'vehiclemodel' IS NOT NULL;

-- Pharmacy: Drug License (Regulatory compliance queries)
CREATE INDEX IF NOT EXISTS idx_products_druglicense ON products ((domain_data->>'druglicense')) 
WHERE domain_data->>'druglicense' IS NOT NULL;

-- 4. Add indexes for batch and serial tracking fields which are often JSONB arrays/objects
CREATE INDEX IF NOT EXISTS idx_products_batches_gin ON products USING GIN (batches);
CREATE INDEX IF NOT EXISTS idx_products_serial_numbers_gin ON products USING GIN (serial_numbers);

-- 5. Add index for manufacturing/expiry dates for FEFO (First Expired First Out) queries
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products (expiry_date)
WHERE expiry_date IS NOT NULL;

-- 6. Add index for invoices JSONB domain data (if invoices table has it, ensuring future proofing)
-- Standard invoices table might not have domain_data, but line_items often do via product snapshot or metadata.
-- Assuming 'invoice_items' table exists or equivalent. Using 'invoice_items' as standard.
-- Checking if invoice_items exists first to avoid error.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_items') THEN
        -- Add index if metadata column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'metadata') THEN
             CREATE INDEX IF NOT EXISTS idx_invoice_items_metadata_gin ON invoice_items USING GIN (metadata);
        END IF;
    END IF;
END $$;
