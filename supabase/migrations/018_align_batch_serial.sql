-- ============================================
-- Migration 018: Align Batch & Serial Tables with Server Actions
-- ============================================

-- Add missing columns to product_batches
ALTER TABLE product_batches ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL;

-- Add missing columns to product_serials
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL;
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL;
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS imei TEXT;
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS mac_address TEXT;
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS warranty_start_date DATE;
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS warranty_end_date DATE;
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS warranty_period_months INTEGER;
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS invoice_id UUID; -- REFERENCES invoices(id)
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE product_serials ADD COLUMN IF NOT EXISTS sale_date DATE;

-- Rename sold_to_customer_id to customer_id if it exists to match action code
-- But we already added customer_id above. If sold_to_customer_id exists, we can drop it later.
-- In my 017 it was sold_to_customer_id.
-- In serial.js it's customer_id.

-- Handle renaming if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_serials' AND column_name = 'sold_to_customer_id') THEN
        ALTER TABLE product_serials RENAME COLUMN sold_to_customer_id TO legacy_sold_to_customer_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_serials' AND column_name = 'sold_date') THEN
        ALTER TABLE product_serials RENAME COLUMN sold_date TO legacy_sold_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_serials' AND column_name = 'warranty_expiry') THEN
        ALTER TABLE product_serials RENAME COLUMN warranty_expiry TO legacy_warranty_expiry;
    END IF;
END $$;
