-- Schema Hardening Migration
-- Phase 10: Add NOT NULL constraints and composite indexes
-- Date: 2026-02-05

-- ============================================
-- PART 1: Add Composite Indexes for Performance
-- ============================================

-- GL Entries (frequently queried by business + date for reports)
CREATE INDEX IF NOT EXISTS idx_gl_entries_business_date 
  ON gl_entries(business_id, transaction_date);

CREATE INDEX IF NOT EXISTS idx_gl_entries_business_account 
  ON gl_entries(business_id, account_id);

-- Stock Movements (business + product + date for inventory reports)
CREATE INDEX IF NOT EXISTS idx_stock_movements_composite 
  ON stock_movements(business_id, product_id, created_at);

-- Invoice Items (business + product for sales analytics)
CREATE INDEX IF NOT EXISTS idx_invoice_items_business_product 
  ON invoice_items(business_id, product_id);

-- Payments (business + date + type for cash flow reports)
CREATE INDEX IF NOT EXISTS idx_payments_business_date_type 
  ON payments(business_id, payment_date, payment_type);

-- Products (business + active status for inventory lists)
CREATE INDEX IF NOT EXISTS idx_products_business_active 
  ON products(business_id, is_active) WHERE is_active = true;

-- Invoices (business + status + date for dashboard)
CREATE INDEX IF NOT EXISTS idx_invoices_business_status_date 
  ON invoices(business_id, status, date);

-- ============================================
-- PART 2: Standardize Decimal Precision
-- ============================================

-- Products table - standardize stock to Decimal(12, 2)
ALTER TABLE products 
  ALTER COLUMN stock TYPE DECIMAL(12, 2) USING stock::DECIMAL(12, 2);

-- ============================================
-- PART 3: Add NOT NULL Constraints (with data validation)
-- ============================================

-- First, ensure no NULL values exist (should be clean after fix_floating_stock.sql)
DO $$
BEGIN
    -- Check product_batches
    IF EXISTS (SELECT 1 FROM product_batches WHERE warehouse_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot add NOT NULL constraint: product_batches has NULL warehouse_id values. Run fix_floating_stock.sql first.';
    END IF;
    
    -- Check stock_movements
    IF EXISTS (SELECT 1 FROM stock_movements WHERE warehouse_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot add NOT NULL constraint: stock_movements has NULL warehouse_id values. Run fix_floating_stock.sql first.';
    END IF;
    
    -- Check invoices
    IF EXISTS (SELECT 1 FROM invoices WHERE business_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot add NOT NULL constraint: invoices has NULL business_id values.';
    END IF;
END $$;

-- Add NOT NULL constraints
ALTER TABLE product_batches 
  ALTER COLUMN warehouse_id SET NOT NULL;

ALTER TABLE stock_movements 
  ALTER COLUMN warehouse_id SET NOT NULL;

ALTER TABLE invoices 
  ALTER COLUMN business_id SET NOT NULL;

-- ============================================
-- PART 4: Add Check Constraints for Data Integrity
-- ============================================

-- Ensure positive quantities
ALTER TABLE product_batches 
  ADD CONSTRAINT chk_batch_quantity_positive 
  CHECK (quantity >= 0);

ALTER TABLE product_batches 
  ADD CONSTRAINT chk_batch_reserved_positive 
  CHECK (reserved_quantity >= 0);

-- Ensure prices are non-negative
ALTER TABLE products 
  ADD CONSTRAINT chk_product_price_positive 
  CHECK (price >= 0);

ALTER TABLE products 
  ADD CONSTRAINT chk_product_cost_positive 
  CHECK (cost_price >= 0);

ALTER TABLE products 
  ADD CONSTRAINT chk_product_mrp_positive 
  CHECK (mrp >= 0);

-- Ensure stock levels are logical
ALTER TABLE products 
  ADD CONSTRAINT chk_product_stock_positive 
  CHECK (stock >= 0);

-- Ensure invoice totals are non-negative
ALTER TABLE invoices 
  ADD CONSTRAINT chk_invoice_total_positive 
  CHECK (grand_total >= 0);

-- ============================================
-- PART 5: Create Partial Indexes for Active Records
-- ============================================

-- Products - only index active products for faster queries
CREATE INDEX IF NOT EXISTS idx_products_active_stock 
  ON products(business_id, stock) 
  WHERE is_active = true AND stock > 0;

-- Product Batches - only index active batches
CREATE INDEX IF NOT EXISTS idx_batches_active_expiry 
  ON product_batches(product_id, expiry_date) 
  WHERE is_active = true AND quantity > 0;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%_business_%'
ORDER BY tablename, indexname;

-- Verify constraints were added
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conname LIKE 'chk_%'
ORDER BY table_name, constraint_name;
