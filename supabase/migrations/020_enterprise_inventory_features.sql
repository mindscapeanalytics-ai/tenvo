-- ============================================
-- ENTERPRISE INVENTORY SYSTEM CONSOLIDATION
-- Migration: 020_enterprise_inventory_features
-- Purpose: Add enterprise features for inventory management
-- - Costing methods (FIFO/LIFO/WAC)
-- - Multi-location support
-- - Approval workflows
-- - Enhanced batch/serial tracking
-- - Audit trails
-- ============================================

-- ============================================
-- 1. EXTEND BUSINESSES TABLE
-- Add enterprise-level configurations
-- ============================================

-- Add costing method configuration
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS costing_method VARCHAR(10) DEFAULT 'FIFO' 
CHECK (costing_method IN ('FIFO', 'LIFO', 'WAC'));

-- Add approval threshold for stock adjustments
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS approval_threshold_amount DECIMAL(15,2) DEFAULT 10000.00;

-- Add multi-location support flag
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS multi_location_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN businesses.costing_method IS 'Inventory costing method: FIFO (First In First Out), LIFO (Last In First Out), WAC (Weighted Average Cost)';
COMMENT ON COLUMN businesses.approval_threshold_amount IS 'Stock adjustments above this value require approval';
COMMENT ON COLUMN businesses.multi_location_enabled IS 'Enable multi-warehouse location tracking';

-- ============================================
-- 2. EXTEND PRODUCT_BATCHES TABLE
-- Add merge/split tracking and enhanced fields
-- ============================================

-- Add batch merge/split tracking
ALTER TABLE product_batches
ADD COLUMN IF NOT EXISTS parent_batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_merged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_split BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS child_batch_ids UUID[] DEFAULT '{}';

-- Add warehouse location support
ALTER TABLE product_batches
ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;

-- Add quantity tracking for reservations
ALTER TABLE product_batches
ADD COLUMN IF NOT EXISTS available_quantity DECIMAL(12,2) GENERATED ALWAYS AS (
  CASE 
    WHEN quantity - COALESCE(reserved_quantity, 0) < 0 THEN 0
    ELSE quantity - COALESCE(reserved_quantity, 0)
  END
) STORED,
ADD COLUMN IF NOT EXISTS reserved_quantity DECIMAL(12,2) DEFAULT 0;

-- Add batch status
ALTER TABLE product_batches
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' 
CHECK (status IN ('active', 'expired', 'quarantine', 'merged', 'split'));

-- Add receipt date for costing calculations
ALTER TABLE product_batches
ADD COLUMN IF NOT EXISTS receipt_date DATE DEFAULT CURRENT_DATE;

-- Add notes field
ALTER TABLE product_batches
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add audit fields
ALTER TABLE product_batches
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update existing status column if it was is_active
UPDATE product_batches SET status = 'active' WHERE is_active = true AND status IS NULL;
UPDATE product_batches SET status = 'expired' WHERE is_active = false AND status IS NULL;

COMMENT ON COLUMN product_batches.parent_batch_id IS 'Reference to parent batch if this was created from a split';
COMMENT ON COLUMN product_batches.is_merged IS 'True if this batch was created by merging other batches';
COMMENT ON COLUMN product_batches.is_split IS 'True if this batch was split into smaller batches';
COMMENT ON COLUMN product_batches.available_quantity IS 'Quantity available for sale (quantity - reserved)';
COMMENT ON COLUMN product_batches.reserved_quantity IS 'Quantity reserved for pending transfers or orders';

-- ============================================
-- 3. EXTEND PRODUCT_SERIALS TABLE
-- Add warranty tracking and enhanced fields
-- ============================================

-- Add warranty tracking
ALTER TABLE product_serials
ADD COLUMN IF NOT EXISTS warranty_start_date DATE,
ADD COLUMN IF NOT EXISTS warranty_end_date DATE,
ADD COLUMN IF NOT EXISTS warranty_period_months INTEGER DEFAULT 12;

-- Add warehouse location
ALTER TABLE product_serials
ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;

-- Add IMEI and MAC address for electronics
ALTER TABLE product_serials
ADD COLUMN IF NOT EXISTS imei TEXT,
ADD COLUMN IF NOT EXISTS mac_address TEXT;

-- Add invoice reference
ALTER TABLE product_serials
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;

-- Add notes
ALTER TABLE product_serials
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add audit fields
ALTER TABLE product_serials
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update status values to match design
ALTER TABLE product_serials
DROP CONSTRAINT IF EXISTS product_serials_status_check;

ALTER TABLE product_serials
ADD CONSTRAINT product_serials_status_check 
CHECK (status IN ('available', 'sold', 'returned', 'defective', 'under_repair'));

-- Update existing status values
UPDATE product_serials SET status = 'available' WHERE status = 'in_stock';

COMMENT ON COLUMN product_serials.warranty_period_months IS 'Warranty period in months from purchase date';
COMMENT ON COLUMN product_serials.imei IS 'International Mobile Equipment Identity for mobile devices';
COMMENT ON COLUMN product_serials.mac_address IS 'MAC address for network devices';

-- ============================================
-- 4. CREATE WAREHOUSES TABLE
-- Multi-location inventory support
-- ============================================

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Pakistan',
  postal_code TEXT,
  
  -- Contact
  phone TEXT,
  email TEXT,
  manager_name TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_warehouse_code UNIQUE (business_id, code)
);

CREATE INDEX idx_warehouses_business_id ON warehouses(business_id);
CREATE INDEX idx_warehouses_is_active ON warehouses(business_id, is_active);

COMMENT ON TABLE warehouses IS 'Warehouse/location master for multi-location inventory tracking';

-- ============================================
-- 5. CREATE PRODUCT_LOCATIONS TABLE
-- Track inventory by warehouse location
-- ============================================

CREATE TABLE IF NOT EXISTS product_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  
  -- Quantity Tracking
  quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
  reserved_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
  available_quantity DECIMAL(15,3) GENERATED ALWAYS AS (
    CASE 
      WHEN quantity - reserved_quantity < 0 THEN 0
      ELSE quantity - reserved_quantity
    END
  ) STORED,
  
  -- Stock Levels
  min_stock DECIMAL(15,3) DEFAULT 0,
  max_stock DECIMAL(15,3),
  reorder_point DECIMAL(15,3),
  
  -- Sync Tracking
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_product_location UNIQUE (product_id, warehouse_id),
  CONSTRAINT positive_quantity CHECK (quantity >= 0),
  CONSTRAINT positive_reserved CHECK (reserved_quantity >= 0)
);

CREATE INDEX idx_product_locations_business ON product_locations(business_id);
CREATE INDEX idx_product_locations_product ON product_locations(product_id);
CREATE INDEX idx_product_locations_warehouse ON product_locations(warehouse_id);
CREATE INDEX idx_product_locations_low_stock ON product_locations(product_id, warehouse_id) 
  WHERE available_quantity <= min_stock;

COMMENT ON TABLE product_locations IS 'Product inventory levels by warehouse location';
COMMENT ON COLUMN product_locations.available_quantity IS 'Quantity available for sale (quantity - reserved)';

-- ============================================
-- 6. CREATE STOCK_TRANSFERS TABLE
-- Track stock movements between locations
-- ============================================

CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Transfer Details
  from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT NOT NULL,
  to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  
  -- Status Tracking
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  
  -- User Tracking
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  
  -- Additional Info
  notes TEXT,
  transfer_document_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT different_warehouses CHECK (from_warehouse_id != to_warehouse_id),
  CONSTRAINT positive_transfer_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_stock_transfers_business ON stock_transfers(business_id);
CREATE INDEX idx_stock_transfers_product ON stock_transfers(product_id);
CREATE INDEX idx_stock_transfers_from_warehouse ON stock_transfers(from_warehouse_id);
CREATE INDEX idx_stock_transfers_to_warehouse ON stock_transfers(to_warehouse_id);
CREATE INDEX idx_stock_transfers_status ON stock_transfers(business_id, status);
CREATE INDEX idx_stock_transfers_pending ON stock_transfers(business_id, status) 
  WHERE status = 'pending';

COMMENT ON TABLE stock_transfers IS 'Stock transfer requests between warehouse locations';

-- ============================================
-- 7. CREATE STOCK_ADJUSTMENTS TABLE
-- Track manual stock adjustments with approval workflow
-- ============================================

CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  
  -- Adjustment Details
  adjustment_type VARCHAR(20) NOT NULL 
    CHECK (adjustment_type IN ('increase', 'decrease', 'correction')),
  quantity_before DECIMAL(15,3) NOT NULL,
  quantity_after DECIMAL(15,3) NOT NULL,
  quantity_change DECIMAL(15,3) NOT NULL,
  
  -- Reason
  reason_code VARCHAR(50) NOT NULL 
    CHECK (reason_code IN ('damage', 'theft', 'count_error', 'return', 'expired', 'cycle_count', 'other')),
  reason_notes TEXT NOT NULL,
  
  -- Valuation
  adjustment_value DECIMAL(15,2),
  
  -- Approval Workflow
  requires_approval BOOLEAN DEFAULT false,
  approval_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_level INTEGER DEFAULT 1,
  
  -- Request Tracking
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Approval Tracking
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Audit Trail
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_adjustments_business ON stock_adjustments(business_id);
CREATE INDEX idx_stock_adjustments_product ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_warehouse ON stock_adjustments(warehouse_id);
CREATE INDEX idx_stock_adjustments_status ON stock_adjustments(business_id, approval_status);
CREATE INDEX idx_stock_adjustments_pending ON stock_adjustments(business_id, approval_status) 
  WHERE approval_status = 'pending';
CREATE INDEX idx_stock_adjustments_requested_by ON stock_adjustments(requested_by);
CREATE INDEX idx_stock_adjustments_date ON stock_adjustments(business_id, created_at DESC);

COMMENT ON TABLE stock_adjustments IS 'Manual stock adjustments with approval workflow and audit trail';
COMMENT ON COLUMN stock_adjustments.adjustment_value IS 'Monetary value of adjustment (quantity_change × cost_price)';
COMMENT ON COLUMN stock_adjustments.requires_approval IS 'True if adjustment value exceeds approval threshold';

-- ============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- Optimize query performance for enterprise features
-- ============================================

-- Batch tracking indexes
CREATE INDEX IF NOT EXISTS idx_batches_product_expiry 
  ON product_batches(product_id, expiry_date) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_batches_expiring 
  ON product_batches(business_id, expiry_date) 
  WHERE expiry_date <= CURRENT_DATE + INTERVAL '90 days' AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_batches_warehouse 
  ON product_batches(warehouse_id, product_id) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_batches_receipt_date 
  ON product_batches(product_id, receipt_date, cost_price) 
  WHERE status = 'active';

-- Serial tracking indexes
CREATE INDEX IF NOT EXISTS idx_serials_product_status 
  ON product_serials(product_id, status);

CREATE INDEX IF NOT EXISTS idx_serials_warranty 
  ON product_serials(business_id, warranty_end_date) 
  WHERE warranty_end_date >= CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_serials_warehouse 
  ON product_serials(warehouse_id, product_id);

-- ============================================
-- 9. CREATE FUNCTIONS FOR BUSINESS LOGIC
-- Helper functions for inventory operations
-- ============================================

-- Function to calculate FEFO (First Expiry First Out) batch order
CREATE OR REPLACE FUNCTION get_fefo_batches(p_product_id UUID, p_warehouse_id UUID DEFAULT NULL)
RETURNS TABLE (
  batch_id UUID,
  batch_number TEXT,
  expiry_date DATE,
  available_quantity DECIMAL,
  cost_price DECIMAL,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pb.id,
    pb.batch_number,
    pb.expiry_date,
    pb.available_quantity,
    pb.cost_price,
    CASE 
      WHEN pb.expiry_date IS NULL THEN NULL
      ELSE (pb.expiry_date - CURRENT_DATE)::INTEGER
    END as days_until_expiry
  FROM product_batches pb
  WHERE pb.product_id = p_product_id
    AND pb.status = 'active'
    AND pb.available_quantity > 0
    AND (p_warehouse_id IS NULL OR pb.warehouse_id = p_warehouse_id)
  ORDER BY 
    CASE WHEN pb.expiry_date IS NULL THEN 1 ELSE 0 END, -- Non-expiring batches last
    pb.expiry_date ASC NULLS LAST,
    pb.receipt_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_fefo_batches IS 'Get batches in FEFO order (First Expiry First Out) for a product';

-- Function to check if stock adjustment requires approval
CREATE OR REPLACE FUNCTION check_adjustment_approval(
  p_business_id UUID,
  p_adjustment_value DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
  v_threshold DECIMAL;
BEGIN
  SELECT approval_threshold_amount INTO v_threshold
  FROM businesses
  WHERE id = p_business_id;
  
  RETURN ABS(p_adjustment_value) > COALESCE(v_threshold, 10000);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_adjustment_approval IS 'Check if stock adjustment requires approval based on business threshold';

-- ============================================
-- 10. CREATE TRIGGERS FOR AUTOMATION
-- Automate common inventory operations
-- ============================================

-- Trigger to update product_batches.updated_at
CREATE OR REPLACE FUNCTION update_batch_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_batch_timestamp
  BEFORE UPDATE ON product_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_timestamp();

-- Trigger to update product_serials.updated_at
CREATE OR REPLACE FUNCTION update_serial_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_serial_timestamp
  BEFORE UPDATE ON product_serials
  FOR EACH ROW
  EXECUTE FUNCTION update_serial_timestamp();

-- Trigger to update product_locations.updated_at and last_sync_at
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_sync_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location_timestamp
  BEFORE UPDATE ON product_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_location_timestamp();

-- ============================================
-- 11. GRANT PERMISSIONS
-- Ensure proper access control
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON warehouses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_transfers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stock_adjustments TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- 12. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE product_batches IS 'Enhanced batch tracking with FEFO, merge/split support, and multi-location';
COMMENT ON TABLE product_serials IS 'Enhanced serial tracking with warranty management and multi-location';
COMMENT ON TABLE warehouses IS 'Warehouse/location master for multi-location inventory';
COMMENT ON TABLE product_locations IS 'Product inventory levels by warehouse location';
COMMENT ON TABLE stock_transfers IS 'Stock transfers between warehouse locations';
COMMENT ON TABLE stock_adjustments IS 'Manual stock adjustments with approval workflow';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
