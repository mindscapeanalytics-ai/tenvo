-- ============================================
-- Migration 007: Manufacturing & Stock Locations
-- ============================================

-- 1. BILL OF MATERIALS (BOM)
CREATE TABLE IF NOT EXISTS boms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL, -- The finished good
  output_quantity DECIMAL(12,2) DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bom_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bom_id UUID REFERENCES boms(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL, -- Raw material
  quantity DECIMAL(12,2) NOT NULL,
  unit TEXT
);

-- 2. PRODUCTION ORDERS
CREATE TABLE IF NOT EXISTS production_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  bom_id UUID REFERENCES boms(id) ON DELETE SET NULL,
  quantity DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'planned', -- planned, in-progress, completed, cancelled
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCT STOCK LOCATIONS
CREATE TABLE IF NOT EXISTS product_stock_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  location_id UUID REFERENCES warehouse_locations(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_product_location UNIQUE (location_id, product_id)
);

-- RLS POLICIES
ALTER TABLE boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stock_locations ENABLE ROW LEVEL SECURITY;

-- Policies (Standard Owner Access)
CREATE POLICY "Users can manage own boms" ON boms FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own bom_items" ON bom_items FOR ALL USING (bom_id IN (SELECT id FROM boms WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));
CREATE POLICY "Users can manage own production_orders" ON production_orders FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own product_stock_locations" ON product_stock_locations FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
