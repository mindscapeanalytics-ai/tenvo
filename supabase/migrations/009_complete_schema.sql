-- ============================================
-- Migration 009: Finance Module & Global Permissions Fix
-- ============================================

-- 1. FINANCE: General Ledger Accounts
CREATE TABLE IF NOT EXISTS gl_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- Asset, Liability, Equity, Income, Expense
  description TEXT,
  parent_id UUID REFERENCES gl_accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, code)
);

-- 2. FINANCE: General Ledger Entries
CREATE TABLE IF NOT EXISTS gl_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  account_id UUID REFERENCES gl_accounts(id) ON DELETE RESTRICT NOT NULL,
  debit DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  reference_type TEXT, -- 'invoice', 'bill', 'journal_entry'
  reference_id UUID,   -- Link to invoice.id etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GLOBAL PERMISSIONS (Fixing 404s)
-- Applying GRANT ALL to all roles for all tables to ensure API visibility.
-- This effectively "Publishes" the tables to the PostgREST API.

-- Business & Users
GRANT ALL ON TABLE businesses TO anon, authenticated, service_role;
GRANT ALL ON TABLE users TO anon, authenticated, service_role;
GRANT ALL ON TABLE business_users TO anon, authenticated, service_role;

-- Core Commerce
GRANT ALL ON TABLE products TO anon, authenticated, service_role;
GRANT ALL ON TABLE customers TO anon, authenticated, service_role;
GRANT ALL ON TABLE invoices TO anon, authenticated, service_role;
GRANT ALL ON TABLE invoice_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE vendors TO anon, authenticated, service_role;

-- Warehouse & Manufacturing
GRANT ALL ON TABLE warehouse_locations TO anon, authenticated, service_role;
GRANT ALL ON TABLE product_stock_locations TO anon, authenticated, service_role;
GRANT ALL ON TABLE boms TO anon, authenticated, service_role;
GRANT ALL ON TABLE bom_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE production_orders TO anon, authenticated, service_role;

-- Sales & Orders
GRANT ALL ON TABLE quotations TO anon, authenticated, service_role;
GRANT ALL ON TABLE quotation_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE sales_orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE sales_order_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE delivery_challans TO anon, authenticated, service_role;
GRANT ALL ON TABLE delivery_challan_items TO anon, authenticated, service_role;

-- Finance
GRANT ALL ON TABLE gl_accounts TO anon, authenticated, service_role;
GRANT ALL ON TABLE gl_entries TO anon, authenticated, service_role;

-- 4. RLS (Ensure enabled)
ALTER TABLE gl_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_entries ENABLE ROW LEVEL SECURITY;

-- 5. Finance Policies
CREATE POLICY "Users can manage own gl_accounts" ON gl_accounts FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own gl_entries" ON gl_entries FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- 6. Business Users Policy (Fixing failed to fetch team)
-- Ensure users can read the business_users table if they are part of it or owner
CREATE POLICY "Users can read business_users" ON business_users FOR SELECT USING (
  auth.uid() = user_id OR 
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);
-- Allow owners to insert/update business_users
CREATE POLICY "Owners can manage business_users" ON business_users FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);
