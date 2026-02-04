-- ============================================
-- Migration 017: Consolidate Missing Tables
-- Applies all tables that should exist but don't
-- ============================================

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- QUOTATIONS & ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  quotation_number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT DEFAULT 'draft',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_quotation_number UNIQUE (business_id, quotation_number)
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  description TEXT,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0
);

-- ============================================
-- SALES ORDERS & ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_order_number UNIQUE (business_id, order_number)
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  description TEXT,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0
);

-- ============================================
-- DELIVERY CHALLANS & ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_challans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  challan_number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'issued',
  driver_name TEXT,
  vehicle_number TEXT,
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_challan_number UNIQUE (business_id, challan_number)
);

CREATE TABLE IF NOT EXISTS delivery_challan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_challan_id UUID REFERENCES delivery_challans(id) ON DELETE CASCADE NOT NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  description TEXT,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1
);

-- ============================================
-- BATCH & SERIAL TRACKING TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS product_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  batch_number TEXT NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  quantity DECIMAL(12,2) DEFAULT 0,
  cost_price DECIMAL(12,2),
  mrp DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_batch_number UNIQUE (business_id, product_id, batch_number)
);

CREATE TABLE IF NOT EXISTS product_serials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  serial_number TEXT NOT NULL,
  status TEXT DEFAULT 'in_stock', -- in_stock, sold, returned, defective
  purchase_date DATE,
  warranty_expiry DATE,
  sold_to_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  sold_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_serial_number UNIQUE (business_id, serial_number)
);

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  variant_name TEXT NOT NULL, -- e.g., "Red-Large", "Blue-Medium"
  sku TEXT,
  barcode TEXT,
  price DECIMAL(12,2),
  cost_price DECIMAL(12,2),
  stock INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}', -- {"color": "Red", "size": "Large"}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quotations_business_id ON quotations(business_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);

CREATE INDEX IF NOT EXISTS idx_sales_orders_business_id ON sales_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);

CREATE INDEX IF NOT EXISTS idx_delivery_challans_business_id ON delivery_challans(business_id);
CREATE INDEX IF NOT EXISTS idx_delivery_challans_customer_id ON delivery_challans(customer_id);

CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiry_date ON product_batches(expiry_date);

CREATE INDEX IF NOT EXISTS idx_product_serials_product_id ON product_serials(product_id);
CREATE INDEX IF NOT EXISTS idx_product_serials_status ON product_serials(status);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_challan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Users can manage own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can manage own quotation_items" ON quotation_items;
DROP POLICY IF EXISTS "Users can manage own sales_orders" ON sales_orders;
DROP POLICY IF EXISTS "Users can manage own sales_order_items" ON sales_order_items;
DROP POLICY IF EXISTS "Users can manage own delivery_challans" ON delivery_challans;
DROP POLICY IF EXISTS "Users can manage own delivery_challan_items" ON delivery_challan_items;
DROP POLICY IF EXISTS "Users can manage own product_batches" ON product_batches;
DROP POLICY IF EXISTS "Users can manage own product_serials" ON product_serials;
DROP POLICY IF EXISTS "Users can manage own product_variants" ON product_variants;

-- Quotations
CREATE POLICY "Users can manage own quotations" ON quotations 
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can manage own quotation_items" ON quotation_items 
  FOR ALL USING (quotation_id IN (SELECT id FROM quotations WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()::text)));

-- Sales Orders
CREATE POLICY "Users can manage own sales_orders" ON sales_orders 
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can manage own sales_order_items" ON sales_order_items 
  FOR ALL USING (sales_order_id IN (SELECT id FROM sales_orders WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()::text)));

-- Delivery Challans
CREATE POLICY "Users can manage own delivery_challans" ON delivery_challans 
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()::text));

CREATE POLICY "Users can manage own delivery_challan_items" ON delivery_challan_items 
  FOR ALL USING (delivery_challan_id IN (SELECT id FROM delivery_challans WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()::text)));

-- Product Batches
CREATE POLICY "Users can manage own product_batches" ON product_batches 
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()::text));

-- Product Serials
CREATE POLICY "Users can manage own product_serials" ON product_serials 
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()::text));

-- Product Variants
CREATE POLICY "Users can manage own product_variants" ON product_variants 
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()::text));

-- ============================================
-- GRANT PERMISSIONS (PostgREST API Access)
-- ============================================
GRANT ALL ON TABLE quotations TO anon, authenticated, service_role;
GRANT ALL ON TABLE quotation_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE sales_orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE sales_order_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE delivery_challans TO anon, authenticated, service_role;
GRANT ALL ON TABLE delivery_challan_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE product_batches TO anon, authenticated, service_role;
GRANT ALL ON TABLE product_serials TO anon, authenticated, service_role;
GRANT ALL ON TABLE product_variants TO anon, authenticated, service_role;

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
-- Drop triggers first to avoid "trigger already exists" error
DROP TRIGGER IF EXISTS update_quotations_updated_at ON quotations;
DROP TRIGGER IF EXISTS update_sales_orders_updated_at ON sales_orders;
DROP TRIGGER IF EXISTS update_delivery_challans_updated_at ON delivery_challans;
DROP TRIGGER IF EXISTS update_product_batches_updated_at ON product_batches;
DROP TRIGGER IF EXISTS update_product_serials_updated_at ON product_serials;
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_challans_updated_at BEFORE UPDATE ON delivery_challans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_batches_updated_at BEFORE UPDATE ON product_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_serials_updated_at BEFORE UPDATE ON product_serials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
