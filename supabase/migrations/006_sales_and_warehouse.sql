-- ============================================
-- Migration 006: Sales & Warehouse Operations
-- Adds tables for Quotations, Sales Orders, Challans
-- ============================================

-- 1. QUOTATIONS
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  quotation_number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected, expired, converted
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_quotation_number UNIQUE (business_id, quotation_number)
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  description TEXT,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0
);

-- 2. SALES ORDERS
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status TEXT DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
  payment_status TEXT DEFAULT 'pending', -- pending, partial, paid
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_order_number UNIQUE (business_id, order_number)
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  description TEXT,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0
);

-- 3. DELIVERY CHALLANS
CREATE TABLE IF NOT EXISTS delivery_challans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  challan_number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'issued', -- issued, delivered, returned
  driver_name TEXT,
  vehicle_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_challan_number UNIQUE (business_id, challan_number)
);

CREATE TABLE IF NOT EXISTS delivery_challan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_challan_id UUID REFERENCES delivery_challans(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  description TEXT,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1
);

-- 4. WAREHOUSE LOCATIONS (If not already present, adding explicitly)
-- Assuming 'warehouses' exists, adding 'warehouse_locations' for sub-locations (Aisle/Bin)
CREATE TABLE IF NOT EXISTS warehouse_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g. "Aisle 1", "Bin A"
  code TEXT,
  type TEXT, -- shelf, bin, rack, zone
  capacity DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_location_code UNIQUE (business_id, warehouse_id, code)
);


-- RLS POLICIES
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_challan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;

-- Quotations Policy
CREATE POLICY "Users can manage own quotations" ON quotations FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own quotation_items" ON quotation_items FOR ALL USING (quotation_id IN (SELECT id FROM quotations WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));

-- Sales Orders Policy
CREATE POLICY "Users can manage own sales_orders" ON sales_orders FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own sales_order_items" ON sales_order_items FOR ALL USING (sales_order_id IN (SELECT id FROM sales_orders WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));

-- Challans Policy
CREATE POLICY "Users can manage own delivery_challans" ON delivery_challans FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own delivery_challan_items" ON delivery_challan_items FOR ALL USING (delivery_challan_id IN (SELECT id FROM delivery_challans WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));

-- Locations Policy
CREATE POLICY "Users can manage own warehouse_locations" ON warehouse_locations FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

