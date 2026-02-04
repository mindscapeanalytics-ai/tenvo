-- ============================================
-- Financial Hub Database Schema
-- Supabase PostgreSQL Database
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. BUSINESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Information
  business_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Pakistani Tax Information
  ntn TEXT, -- National Tax Number (1234567-8)
  cnic TEXT, -- National ID (13 digits)
  srn TEXT, -- Sales Tax Registration Number
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Pakistan',
  postal_code TEXT,
  
  -- Business Classification
  domain TEXT NOT NULL, -- retail-shop, pharmacy, etc.
  category TEXT NOT NULL, -- retail, industrial, services, specialized
  
  -- Branding
  logo_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_ntn CHECK (ntn IS NULL OR ntn ~* '^\d{7}-\d$'),
  CONSTRAINT valid_cnic CHECK (cnic IS NULL OR cnic ~* '^\d{13}$|^\d{5}-\d{7}-\d{1}$')
);

-- Indexes
CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_businesses_domain ON businesses(domain);
CREATE INDEX idx_businesses_category ON businesses(category);

-- ============================================
-- 2. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  description TEXT,
  category TEXT,
  brand TEXT,
  
  -- Pricing
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(12,2),
  mrp DECIMAL(12,2), -- Maximum Retail Price
  
  -- Inventory
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  unit TEXT DEFAULT 'pcs',
  
  -- Tax & Compliance
  hsn_code TEXT,
  sac_code TEXT,
  tax_percent DECIMAL(5,2) DEFAULT 17,
  
  -- Media
  image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Domain-specific data (flexible JSONB)
  domain_data JSONB DEFAULT '{}',
  
  -- Batch tracking
  batches JSONB DEFAULT '[]',
  
  -- Serial tracking
  serial_numbers JSONB DEFAULT '[]',
  
  -- Variants (size/color matrix)
  variants JSONB DEFAULT '[]',
  
  -- Dates
  expiry_date DATE,
  manufacturing_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_price CHECK (price >= 0),
  CONSTRAINT positive_cost CHECK (cost_price IS NULL OR cost_price >= 0),
  CONSTRAINT valid_mrp CHECK (mrp IS NULL OR mrp >= price),
  CONSTRAINT positive_stock CHECK (stock >= 0),
  CONSTRAINT valid_expiry CHECK (expiry_date IS NULL OR manufacturing_date IS NULL OR expiry_date > manufacturing_date)
);

-- Indexes
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock);

-- ============================================
-- 3. CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Pakistani Information
  ntn TEXT,
  cnic TEXT,
  srn TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'Pakistan',
  
  -- Financial
  credit_limit DECIMAL(12,2) DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_customer_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================
-- 4. VENDORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Pakistani Information
  ntn TEXT,
  srn TEXT,
  
  -- Address
  address TEXT,
  city TEXT,
  state TEXT,
  
  -- Terms
  payment_terms TEXT,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vendors_business_id ON vendors(business_id);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for BUSINESSES
-- ============================================
CREATE POLICY "Users can view own businesses" ON businesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own businesses" ON businesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses" ON businesses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own businesses" ON businesses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for PRODUCTS
-- ============================================
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies for CUSTOMERS
-- ============================================
CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own customers" ON customers
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own customers" ON customers
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own customers" ON customers
  FOR DELETE USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies for VENDORS
-- ============================================
CREATE POLICY "Users can view own vendors" ON vendors
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own vendors" ON vendors
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own vendors" ON vendors
  FOR UPDATE USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own vendors" ON vendors
  FOR DELETE USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Functions for updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
