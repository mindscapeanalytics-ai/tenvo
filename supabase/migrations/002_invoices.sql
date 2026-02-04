-- ============================================
-- 5. INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Invoice Header
  invoice_number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'pending', -- pending, paid, cancelled, overdue
  
  -- Financial Summary
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  discount_total DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) DEFAULT 0,
  
  -- Payment Info
  payment_method TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  
  -- Tax Specifics (JSONB for flexibility between FBR/GST)
  tax_details JSONB DEFAULT '{}',
  
  -- Metadata
  notes TEXT,
  terms TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. INVOICE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Line Item Details
  name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(12,2) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Domain-Specific metadata (Batch/Serial used)
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_invoices_business_id ON invoices(business_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own invoices" ON invoices
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own invoices" ON invoices
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own invoices" ON invoices
  FOR DELETE USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Invoice items RLS (inherited via join or directly)
CREATE POLICY "Users can view own invoice items" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE business_id IN (
        SELECT id FROM businesses WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own invoice items" ON invoice_items
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE business_id IN (
        SELECT id FROM businesses WHERE user_id = auth.uid()
      )
    )
  );

-- Triggers
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
