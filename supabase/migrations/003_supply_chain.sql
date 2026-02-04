-- ============================================
-- 7. PURCHASE ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  -- PO Header
  po_number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  expected_date DATE,
  status TEXT DEFAULT 'draft', -- draft, sent, received, cancelled
  
  -- Financial Summary
  total_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. PO ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS po_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Line Item Details
  name TEXT NOT NULL,
  quantity DECIMAL(12,2) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0
);

-- ============================================
-- 9. BILLS (VENDOR INVOICES) TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  
  -- Bill Details
  bill_number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid, overdue
  
  -- Financial Summary
  amount_due DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_po_business_id ON purchase_orders(business_id);
CREATE INDEX idx_bills_business_id ON bills(business_id);

-- RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- PO Policies
CREATE POLICY "Users can view own POs" ON purchase_orders
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own POs" ON purchase_orders
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own POs" ON purchase_orders
  FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Bill Policies
CREATE POLICY "Users can view own bills" ON bills
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own bills" ON bills
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Triggers
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
