-- ============================================
-- Migration 014: Stock Movements Tracking
-- Adds comprehensive stock movement audit trail
-- ============================================

-- STOCK MOVEMENTS TABLE
-- Tracks all inventory movements for audit trail and reporting
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
  
  -- Movement Details
  movement_type TEXT NOT NULL, -- in, out, transfer_in, transfer_out, adjustment_in, adjustment_out
  quantity DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2),
  
  -- Reference to source transaction
  reference_type TEXT, -- purchase, sale, transfer, adjustment, manufacturing
  reference_id UUID,
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_movement_type CHECK (movement_type IN ('in', 'out', 'transfer_in', 'transfer_out', 'adjustment_in', 'adjustment_out', 'manufacturing_in', 'manufacturing_out'))
);

-- Indexes for performance
CREATE INDEX idx_stock_movements_business ON stock_movements(business_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_batch ON stock_movements(batch_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);

-- RLS Policy
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stock movements" ON stock_movements
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own stock movements" ON stock_movements
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Function to get stock movement summary
CREATE OR REPLACE FUNCTION get_stock_movement_summary(
  prod_id UUID,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  movement_type TEXT,
  total_quantity DECIMAL(12,2),
  movement_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.movement_type,
    SUM(sm.quantity) as total_quantity,
    COUNT(*) as movement_count
  FROM stock_movements sm
  WHERE sm.product_id = prod_id
    AND (start_date IS NULL OR sm.created_at >= start_date)
    AND (end_date IS NULL OR sm.created_at <= end_date)
  GROUP BY sm.movement_type
  ORDER BY sm.movement_type;
END;
$$ LANGUAGE plpgsql;
