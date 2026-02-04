-- ============================================
-- Migration 005: Critical Foundation Enhancements
-- Adds proper batch, serial, variant, and tax tables
-- Maintains backward compatibility with existing JSONB fields
-- ============================================

-- ============================================
-- 1. PRODUCT BATCHES TABLE
-- For pharmacy, food, FMCG, chemical domains
-- ============================================
CREATE TABLE IF NOT EXISTS product_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  
  -- Batch Information
  batch_number TEXT NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  
  -- Inventory
  quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  reserved_quantity DECIMAL(12,2) DEFAULT 0,
  available_quantity DECIMAL(12,2) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  
  -- Costing
  cost_price DECIMAL(12,2),
  mrp DECIMAL(12,2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_expired BOOLEAN GENERATED ALWAYS AS (expiry_date < CURRENT_DATE) STORED,
  
  -- Metadata
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_batch_quantity CHECK (quantity >= 0),
  CONSTRAINT positive_reserved CHECK (reserved_quantity >= 0),
  CONSTRAINT reserved_not_exceed CHECK (reserved_quantity <= quantity),
  CONSTRAINT valid_batch_expiry CHECK (expiry_date IS NULL OR manufacturing_date IS NULL OR expiry_date > manufacturing_date),
  CONSTRAINT unique_batch_per_product UNIQUE (product_id, batch_number, warehouse_id)
);

-- Indexes
CREATE INDEX idx_batches_product ON product_batches(product_id);
CREATE INDEX idx_batches_warehouse ON product_batches(warehouse_id);
CREATE INDEX idx_batches_expiry ON product_batches(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_batches_active ON product_batches(is_active);
CREATE INDEX idx_batches_business ON product_batches(business_id);

-- ============================================
-- 2. PRODUCT SERIALS TABLE
-- For auto parts, electronics, computer hardware
-- ============================================
CREATE TABLE IF NOT EXISTS product_serials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  
  -- Serial Information
  serial_number TEXT NOT NULL,
  imei TEXT, -- For mobile devices
  mac_address TEXT, -- For network devices
  
  -- Status
  status TEXT DEFAULT 'in_stock', -- in_stock, sold, returned, defective, under_repair
  
  -- Dates
  purchase_date DATE,
  sale_date DATE,
  
  -- Warranty
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_period_months INTEGER,
  
  -- Customer (if sold)
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_id UUID, -- Will reference invoices table
  
  -- Metadata
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_serial_number UNIQUE (serial_number),
  CONSTRAINT valid_status CHECK (status IN ('in_stock', 'sold', 'returned', 'defective', 'under_repair', 'scrapped')),
  CONSTRAINT sale_requires_customer CHECK (status != 'sold' OR customer_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_serials_product ON product_serials(product_id);
CREATE INDEX idx_serials_batch ON product_serials(batch_id);
CREATE INDEX idx_serials_warehouse ON product_serials(warehouse_id);
CREATE INDEX idx_serials_status ON product_serials(status);
CREATE INDEX idx_serials_customer ON product_serials(customer_id);
CREATE INDEX idx_serials_warranty ON product_serials(warranty_end_date) WHERE warranty_end_date IS NOT NULL;
CREATE INDEX idx_serials_business ON product_serials(business_id);

-- ============================================
-- 3. PRODUCT VARIANTS TABLE
-- For retail, garments, furniture (size-color matrix)
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  
  -- Variant Information
  variant_sku TEXT NOT NULL,
  variant_name TEXT,
  
  -- Attributes
  size TEXT,
  color TEXT,
  pattern TEXT,
  material TEXT,
  custom_attributes JSONB DEFAULT '{}',
  
  -- Pricing
  price DECIMAL(12,2),
  cost_price DECIMAL(12,2),
  mrp DECIMAL(12,2),
  
  -- Inventory
  stock DECIMAL(12,2) DEFAULT 0,
  min_stock DECIMAL(12,2) DEFAULT 0,
  
  -- Media
  image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_variant_sku UNIQUE (business_id, variant_sku),
  CONSTRAINT positive_variant_price CHECK (price IS NULL OR price >= 0),
  CONSTRAINT positive_variant_stock CHECK (stock >= 0)
);

-- Indexes
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(variant_sku);
CREATE INDEX idx_variants_size ON product_variants(size) WHERE size IS NOT NULL;
CREATE INDEX idx_variants_color ON product_variants(color) WHERE color IS NOT NULL;
CREATE INDEX idx_variants_active ON product_variants(is_active);
CREATE INDEX idx_variants_business ON product_variants(business_id);

-- ============================================
-- 4. STOCK VALUATION LOG TABLE
-- Track stock valuation over time
-- ============================================
CREATE TABLE IF NOT EXISTS stock_valuation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  
  -- Valuation Details
  valuation_method TEXT NOT NULL, -- FIFO, LIFO, FEFO, Weighted_Average
  valuation_date DATE DEFAULT CURRENT_DATE,
  
  -- Quantities
  total_quantity DECIMAL(12,2) NOT NULL,
  
  -- Values
  total_value DECIMAL(12,2) NOT NULL,
  average_cost DECIMAL(12,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_quantity > 0 THEN total_value / total_quantity
      ELSE 0
    END
  ) STORED,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_valuation_method CHECK (valuation_method IN ('FIFO', 'LIFO', 'FEFO', 'Weighted_Average'))
);

-- Indexes
CREATE INDEX idx_valuation_product ON stock_valuation_log(product_id);
CREATE INDEX idx_valuation_date ON stock_valuation_log(valuation_date);
CREATE INDEX idx_valuation_warehouse ON stock_valuation_log(warehouse_id);
CREATE INDEX idx_valuation_business ON stock_valuation_log(business_id);

-- ============================================
-- 5. TAX CONFIGURATIONS TABLE
-- Pakistani tax compliance (FBR, NTN, Sales Tax)
-- ============================================
CREATE TABLE IF NOT EXISTS tax_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  -- Pakistani Tax Details
  ntn_number TEXT,
  srn_number TEXT,
  filer_status TEXT DEFAULT 'Non-Filer', -- Filer, Non-Filer
  
  -- Tax Rates
  sales_tax_rate DECIMAL(5,2) DEFAULT 17.00, -- Federal Sales Tax (Pakistan standard)
  provincial_tax_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Withholding Tax
  withholding_tax_applicable BOOLEAN DEFAULT false,
  withholding_tax_rate DECIMAL(5,2) DEFAULT 0,
  withholding_tax_category TEXT, -- Goods, Services, etc.
  
  -- GST (for compatibility)
  gst_number TEXT,
  gst_rate DECIMAL(5,2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_filer_status CHECK (filer_status IN ('Filer', 'Non-Filer')),
  CONSTRAINT unique_business_tax UNIQUE (business_id)
);

-- Index
CREATE INDEX idx_tax_config_business ON tax_configurations(business_id);

-- ============================================
-- 6. E-INVOICES TABLE
-- FBR e-invoice compliance
-- ============================================
CREATE TABLE IF NOT EXISTS e_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID, -- Will reference invoices table when created
  
  -- E-Invoice Details
  irn TEXT UNIQUE, -- Invoice Reference Number
  qr_code TEXT,
  ack_number TEXT,
  ack_date TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, generated, cancelled, failed
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_einvoice_status CHECK (status IN ('pending', 'generated', 'cancelled', 'failed'))
);

-- Indexes
CREATE INDEX idx_einvoices_invoice ON e_invoices(invoice_id);
CREATE INDEX idx_einvoices_irn ON e_invoices(irn);
CREATE INDEX idx_einvoices_status ON e_invoices(status);
CREATE INDEX idx_einvoices_business ON e_invoices(business_id);

-- ============================================
-- 7. STOCK TRANSFERS TABLE
-- Multi-location stock transfers
-- ============================================
CREATE TABLE IF NOT EXISTS stock_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  -- Transfer Details
  transfer_number TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
  
  -- Locations
  from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT NOT NULL,
  to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT NOT NULL,
  
  -- Quantity
  quantity DECIMAL(12,2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, in_transit, completed, cancelled
  
  -- Dates
  transfer_date DATE DEFAULT CURRENT_DATE,
  expected_arrival_date DATE,
  actual_arrival_date DATE,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_transfer_quantity CHECK (quantity > 0),
  CONSTRAINT different_warehouses CHECK (from_warehouse_id != to_warehouse_id),
  CONSTRAINT valid_transfer_status CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  CONSTRAINT unique_transfer_number UNIQUE (business_id, transfer_number)
);

-- Indexes
CREATE INDEX idx_transfers_product ON stock_transfers(product_id);
CREATE INDEX idx_transfers_from_warehouse ON stock_transfers(from_warehouse_id);
CREATE INDEX idx_transfers_to_warehouse ON stock_transfers(to_warehouse_id);
CREATE INDEX idx_transfers_status ON stock_transfers(status);
CREATE INDEX idx_transfers_business ON stock_transfers(business_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_valuation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for PRODUCT_BATCHES
CREATE POLICY "Users can view own batches" ON product_batches
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own batches" ON product_batches
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own batches" ON product_batches
  FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own batches" ON product_batches
  FOR DELETE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- RLS Policies for PRODUCT_SERIALS
CREATE POLICY "Users can view own serials" ON product_serials
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own serials" ON product_serials
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own serials" ON product_serials
  FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own serials" ON product_serials
  FOR DELETE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- RLS Policies for PRODUCT_VARIANTS
CREATE POLICY "Users can view own variants" ON product_variants
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own variants" ON product_variants
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own variants" ON product_variants
  FOR UPDATE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own variants" ON product_variants
  FOR DELETE USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- RLS Policies for STOCK_VALUATION_LOG
CREATE POLICY "Users can view own valuation" ON stock_valuation_log
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own valuation" ON stock_valuation_log
  FOR INSERT WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- RLS Policies for TAX_CONFIGURATIONS
CREATE POLICY "Users can view own tax config" ON tax_configurations
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own tax config" ON tax_configurations
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- RLS Policies for E_INVOICES
CREATE POLICY "Users can view own e-invoices" ON e_invoices
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own e-invoices" ON e_invoices
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- RLS Policies for STOCK_TRANSFERS
CREATE POLICY "Users can view own transfers" ON stock_transfers
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own transfers" ON stock_transfers
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON product_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_serials_updated_at BEFORE UPDATE ON product_serials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_config_updated_at BEFORE UPDATE ON tax_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_einvoices_updated_at BEFORE UPDATE ON e_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfers_updated_at BEFORE UPDATE ON stock_transfers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get available batch quantity
CREATE OR REPLACE FUNCTION get_available_batch_quantity(batch_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
BEGIN
  RETURN (
    SELECT available_quantity 
    FROM product_batches 
    WHERE id = batch_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if serial number exists
CREATE OR REPLACE FUNCTION serial_number_exists(serial TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM product_serials WHERE serial_number = serial
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get product total stock from variants
CREATE OR REPLACE FUNCTION get_product_variant_stock(prod_id UUID)
RETURNS DECIMAL(12,2) AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(stock) 
    FROM product_variants 
    WHERE product_id = prod_id AND is_active = true
  ), 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get expiring batches (within days)
CREATE OR REPLACE FUNCTION get_expiring_batches(days_threshold INTEGER DEFAULT 30)
RETURNS TABLE (
  batch_id UUID,
  product_id UUID,
  batch_number TEXT,
  expiry_date DATE,
  days_until_expiry INTEGER,
  quantity DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pb.id,
    pb.product_id,
    pb.batch_number,
    pb.expiry_date,
    (pb.expiry_date - CURRENT_DATE)::INTEGER,
    pb.quantity
  FROM product_batches pb
  WHERE pb.expiry_date IS NOT NULL
    AND pb.expiry_date > CURRENT_DATE
    AND pb.expiry_date <= CURRENT_DATE + days_threshold
    AND pb.is_active = true
    AND pb.quantity > 0
  ORDER BY pb.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;
