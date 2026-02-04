-- ============================================
-- 10. WAREHOUSES (Multi-Location)
-- ============================================
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  type TEXT DEFAULT 'store', -- store, warehouse, godown, factory
  address TEXT,
  city TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own warehouses" ON warehouses
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own warehouses" ON warehouses
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ============================================
-- 11. INVENTORY LEDGER (Audit Trail)
-- Replaces simple stock updates with a transaction log
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Transaction Details
  transaction_type TEXT NOT NULL, -- purchase, sale, return, adjustment, transfer, manufacturing
  reference_id UUID, -- Link to invoice_id, bill_id, or po_id
  reference_type TEXT, -- 'invoices', 'bills', 'production_orders'
  
  -- Quantity Movement
  quantity_change DECIMAL(12,2) NOT NULL, -- Positive for IN, Negative for OUT
  running_balance DECIMAL(12,2) NOT NULL, -- Snapshot of balance after transaction
  
  -- Valuation
  unit_cost DECIMAL(12,2) DEFAULT 0,
  total_value DECIMAL(12,2) DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  batch_number TEXT,
  serial_number TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE inventory_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory ledger" ON inventory_ledger
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own inventory ledger" ON inventory_ledger
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_inventory_ledger_product ON inventory_ledger(product_id);
CREATE INDEX idx_inventory_ledger_date ON inventory_ledger(created_at);
CREATE INDEX idx_inventory_ledger_reference ON inventory_ledger(reference_id);

-- ============================================
-- 12. GENERAL LEDGER (Accounting)
-- ============================================

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS gl_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  code TEXT NOT NULL, -- e.g. 1001, 2001
  name TEXT NOT NULL, -- e.g. "Cash on Hand", "Sales Revenue"
  type TEXT NOT NULL, -- asset, liability, equity, income, expense
  subtype TEXT, -- current_asset, fixed_asset, etc.
  
  is_system BOOLEAN DEFAULT false, -- If true, cannot be deleted (e.g. specialized accounts)
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GL Entries (Double Entry System)
CREATE TABLE IF NOT EXISTS gl_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  transaction_date DATE DEFAULT CURRENT_DATE,
  reference_id UUID,
  reference_type TEXT,
  description TEXT,
  
  -- The Entry
  account_id UUID REFERENCES gl_accounts(id) ON DELETE RESTRICT NOT NULL,
  debit DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts" ON gl_accounts
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own accounts" ON gl_accounts
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own gl entries" ON gl_entries
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own gl entries" ON gl_entries
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ============================================
-- 13. MANUFACTURING (BOM & Production)
-- ============================================

CREATE TABLE IF NOT EXISTS production_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  order_number TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL, -- Finished Good
  
  quantity_planned DECIMAL(12,2) NOT NULL,
  quantity_produced DECIMAL(12,2) DEFAULT 0,
  
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  
  cost_material DECIMAL(12,2) DEFAULT 0,
  cost_labor DECIMAL(12,2) DEFAULT 0,
  cost_overhead DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own production orders" ON production_orders
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own production orders" ON production_orders
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Trigger for timestamps
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_orders_updated_at BEFORE UPDATE ON production_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
