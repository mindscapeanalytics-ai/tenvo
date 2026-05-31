-- =====================================================
-- URGENT: Execute this in Supabase SQL Editor
-- This fixes the "inventory_stock does not exist" error
-- =====================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create inventory_stock table
CREATE TABLE IF NOT EXISTS inventory_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    warehouse_id UUID,
    
    -- Stock Levels
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    available_quantity DECIMAL(12,3) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    
    -- Tracking
    last_movement_at TIMESTAMPTZ,
    last_counted_at TIMESTAMPTZ,
    
    -- Metadata
    notes TEXT,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_stock_business_id ON inventory_stock(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_product_id ON inventory_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_warehouse_id ON inventory_stock(warehouse_id) WHERE warehouse_id IS NOT NULL;

-- 4. Enable RLS
ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Drop first to avoid conflicts, then recreate)
DROP POLICY IF EXISTS "Users can view own inventory stock" ON inventory_stock;
DROP POLICY IF EXISTS "Users can manage own inventory stock" ON inventory_stock;

CREATE POLICY "Users can view own inventory stock" ON inventory_stock
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own inventory stock" ON inventory_stock
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id::text = auth.uid()::text
    )
  );

-- 6. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_inventory_stock_updated_at ON inventory_stock;
CREATE TRIGGER update_inventory_stock_updated_at 
    BEFORE UPDATE ON inventory_stock
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ALSO FIX: is_deleted column in payments table
-- =====================================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- Index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_payments_is_deleted ON payments(business_id, is_deleted) WHERE is_deleted = false;

-- =====================================================
-- ALSO FIX: inventory_reservations table (for stock pre-validation)
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    
    -- What is reserved
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    warehouse_id UUID,
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    
    -- Why it's reserved
    reference_type TEXT NOT NULL, -- 'invoice', 'sales_order', 'production_order'
    reference_id UUID NOT NULL,
    
    -- Reservation status
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'fulfilled', 'cancelled', 'expired'
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    notes TEXT,
    created_by TEXT,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists without them
ALTER TABLE inventory_reservations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE inventory_reservations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE inventory_reservations ADD COLUMN IF NOT EXISTS created_by TEXT;
DO $$ BEGIN
  ALTER TABLE inventory_reservations ALTER COLUMN created_by TYPE TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Indexes for inventory_reservations
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_business_id ON inventory_reservations(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product_id ON inventory_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_reference ON inventory_reservations(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_status ON inventory_reservations(status);

-- RLS for inventory_reservations
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reservations" ON inventory_reservations;
DROP POLICY IF EXISTS "Users can manage own reservations" ON inventory_reservations;

CREATE POLICY "Users can view own reservations" ON inventory_reservations
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own reservations" ON inventory_reservations
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id::text = auth.uid()::text
    )
  );

-- Trigger for inventory_reservations
DROP TRIGGER IF EXISTS update_inventory_reservations_updated_at ON inventory_reservations;
CREATE TRIGGER update_inventory_reservations_updated_at 
    BEFORE UPDATE ON inventory_reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ALSO FIX: invoice_payments table (for payment tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    
    -- Payment Details
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'card', 'bank_transfer', 'check', 'digital_wallet'
    payment_date DATE DEFAULT CURRENT_DATE,
    reference_number TEXT, -- Check number, transaction ID, etc.
    
    -- For digital payments
    transaction_id TEXT,
    gateway_response JSONB DEFAULT '{}',
    
    -- Metadata
    notes TEXT,
    received_by TEXT,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists without them
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS gateway_response JSONB DEFAULT '{}';
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE;
UPDATE invoice_payments SET payment_method = 'cash' WHERE payment_method IS NULL;

ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS business_id UUID;
UPDATE invoice_payments ip
SET business_id = i.business_id
FROM invoices i
WHERE ip.invoice_id = i.id
  AND ip.business_id IS NULL
  AND i.business_id IS NOT NULL;

ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS deleted_by TEXT;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS gateway_response JSONB DEFAULT '{}';
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS received_by TEXT;

-- Fix column type if already exists as UUID
DO $$ BEGIN
  ALTER TABLE invoice_payments ALTER COLUMN received_by TYPE TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE invoice_payments ALTER COLUMN deleted_by TYPE TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE;

-- Indexes for invoice_payments
CREATE INDEX IF NOT EXISTS idx_invoice_payments_business_id ON invoice_payments(business_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_date ON invoice_payments(payment_date);

-- RLS for invoice_payments
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own invoice payments" ON invoice_payments;
DROP POLICY IF EXISTS "Users can manage own invoice payments" ON invoice_payments;

CREATE POLICY "Users can view own invoice payments" ON invoice_payments
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can manage own invoice payments" ON invoice_payments
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id::text = auth.uid()::text
    )
  );

-- Trigger for invoice_payments
DROP TRIGGER IF EXISTS update_invoice_payments_updated_at ON invoice_payments;
CREATE TRIGGER update_invoice_payments_updated_at 
    BEFORE UPDATE ON invoice_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ALSO FIX: stock_movements warehouse_id constraint
-- =====================================================
ALTER TABLE stock_movements ALTER COLUMN warehouse_id DROP NOT NULL;

-- =====================================================
-- ALSO FIX: calculate_invoice_balance function
-- (invoice_payments.is_deleted is added above ~195; this block must stay after those ALTERs)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_invoice_balance(invoice_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    invoice_total DECIMAL(12,2);
    total_paid DECIMAL(12,2);
    balance DECIMAL(12,2);
BEGIN
    SELECT COALESCE(grand_total, 0) INTO invoice_total
    FROM invoices
    WHERE id = invoice_uuid
      AND (is_deleted = false OR is_deleted IS NULL);

    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM invoice_payments
    WHERE invoice_id = invoice_uuid
      AND (is_deleted = false OR is_deleted IS NULL);

    balance := invoice_total - total_paid;
    RETURN GREATEST(balance, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ALSO FIX: Ensure invoices has payment_status column
-- =====================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- =====================================================
-- ALSO FIX: Auto-update payment_status trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    v_total DECIMAL(12,2);
    v_paid DECIMAL(12,2);
    v_new_status TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    SELECT COALESCE(grand_total, 0) INTO v_total
    FROM invoices
    WHERE id = v_invoice_id;

    SELECT COALESCE(SUM(amount), 0) INTO v_paid
    FROM invoice_payments
    WHERE invoice_id = v_invoice_id
      AND (is_deleted = false OR is_deleted IS NULL);

    IF v_paid >= v_total AND v_total > 0 THEN
        v_new_status := 'paid';
    ELSIF v_paid > 0 THEN
        v_new_status := 'partial';
    ELSE
        v_new_status := 'unpaid';
    END IF;

    UPDATE invoices
    SET payment_status = v_new_status,
        status = CASE
            WHEN v_new_status = 'paid' AND status IN ('draft', 'sent', 'awaiting_approval') THEN 'paid'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = v_invoice_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoice_payment_status_on_insert ON invoice_payments;
DROP TRIGGER IF EXISTS update_invoice_payment_status_on_update ON invoice_payments;
DROP TRIGGER IF EXISTS update_invoice_payment_status_on_delete ON invoice_payments;

CREATE TRIGGER update_invoice_payment_status_on_insert
    AFTER INSERT ON invoice_payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

CREATE TRIGGER update_invoice_payment_status_on_update
    AFTER UPDATE ON invoice_payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

CREATE TRIGGER update_invoice_payment_status_on_delete
    AFTER DELETE ON invoice_payments
    FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

-- =====================================================
-- SUCCESS! Now restart your app and invoice creation will work
-- =====================================================
