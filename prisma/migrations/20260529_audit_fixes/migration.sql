-- ============================================
-- Migration: Platform Audit Fixes (2026-05-29)
-- Addresses: M1 soft-delete, M3 dead table, L3 missing indexes,
--            delivery_challans missing columns
-- ============================================

-- 1. Add soft-delete columns to quotations
ALTER TABLE "quotations"
  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

-- 2. Add soft-delete columns to sales_orders
ALTER TABLE "sales_orders"
  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

-- 3. Add soft-delete + missing columns to delivery_challans
ALTER TABLE "delivery_challans"
  ADD COLUMN IF NOT EXISTS "warehouse_id" UUID,
  ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "tax_total" DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "total_amount" DECIMAL(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

-- 4. Add missing index on delivery_challans.sales_order_id
CREATE INDEX IF NOT EXISTS "idx_delivery_challans_sales_order_id"
  ON "delivery_challans" ("sales_order_id");

-- 5. Add missing index on payment_allocations.business_id
CREATE INDEX IF NOT EXISTS "idx_payment_allocations_business_id"
  ON "payment_allocations" ("business_id");

-- 6. Add missing index on challan_items.batch_id
CREATE INDEX IF NOT EXISTS "idx_challan_items_batch_id"
  ON "challan_items" ("batch_id");

-- 7. Drop the dead delivery_challan_items table (unused, duplicated by challan_items)
-- Safety: only drop if no data exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_challan_items') THEN
    IF NOT EXISTS (SELECT 1 FROM delivery_challan_items LIMIT 1) THEN
      DROP TABLE "delivery_challan_items";
      RAISE NOTICE 'Dropped empty delivery_challan_items table';
    ELSE
      RAISE NOTICE 'delivery_challan_items has data -- skipping drop. Manual migration required.';
    END IF;
  END IF;
END $$;
