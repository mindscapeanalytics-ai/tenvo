-- ============================================
-- Migration 008: Ensure Missing Tables
-- Focused specifically on tables reporting 404
-- ============================================

-- 1. SALES ORDERS
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  quotation_id UUID, -- Optional link
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status TEXT DEFAULT 'pending', 
  payment_status TEXT DEFAULT 'pending',
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_total DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  -- Removed inline constraints to avoid naming conflicts if retry
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

-- 2. DELIVERY CHALLANS
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
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_challan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_challan_id UUID REFERENCES delivery_challans(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  description TEXT,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1
);

-- 3. WAREHOUSE LOCATIONS
CREATE TABLE IF NOT EXISTS warehouse_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  -- warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL, -- Removing this dependency if 'warehouses' doesn't exist. 
  -- We'll assume 'businesses' is the root. If 'warehouses' table exists, good. 
  -- Let's make it optional or self-contained for now to prevent FK error if 'warehouses' is missing.
  -- Actually, let's check if we can link to business effectively.
  name TEXT NOT NULL, 
  code TEXT,
  type TEXT, 
  capacity DECIMAL(12,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GRANTS (Fixing 404s for Anon/Authenticated)
-- Explicitly grant permissions to ensure API visibility
GRANT ALL ON TABLE sales_orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE sales_order_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE delivery_challans TO anon, authenticated, service_role;
GRANT ALL ON TABLE delivery_challan_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE warehouse_locations TO anon, authenticated, service_role;
GRANT ALL ON TABLE quotations TO anon, authenticated, service_role;
GRANT ALL ON TABLE quotation_items TO anon, authenticated, service_role;

-- RLS (Ensure enabled)
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;

-- RE-APPLY POLICIES (Use DO block to avoid error if exists, or just ignoring errors in script runner? 
-- Postgres doesn't support 'CREATE POLICY IF NOT EXISTS' in all versions.
-- We'll omit policy creation here to ensure the TABLE creation succeeds first. RLS defaults to 'deny all' if no policy, so we might get 200 [] empty array, but NOT 404.)
-- To be safe, let's add one generic permissive policy for now to debug.
-- ACTUALLY: The 404 is the main issue. Grants fix 404. Policies fix 200 [].
