-- 016_secure_rls_for_better_auth.sql

-- 1. DROP DEPENDENT POLICIES FIRST to allow column alteration
-- 1. DROP DEPENDENT POLICIES FIRST to allow column alteration (ALL detected policies)
DROP POLICY IF EXISTS "Users can view own business" ON businesses;
DROP POLICY IF EXISTS "Users can insert own business" ON businesses;
DROP POLICY IF EXISTS "Users can update own business" ON businesses;
DROP POLICY IF EXISTS "Detailed Access Policy" ON businesses;
DROP POLICY IF EXISTS "Allow Insert" ON businesses;

DROP POLICY IF EXISTS "Public access business_users" ON business_users;
DROP POLICY IF EXISTS "Public dev access" ON business_users;

-- Linked tables relying on business user_id
DROP POLICY IF EXISTS "Users can manage their own vendors" ON vendors;
DROP POLICY IF EXISTS "Owner Access Vendors" ON vendors;

DROP POLICY IF EXISTS "Users can manage their own purchases" ON purchases;

DROP POLICY IF EXISTS "Users can manage their own batches" ON product_batches;

DROP POLICY IF EXISTS "Users can view purchase items" ON purchase_items;

DROP POLICY IF EXISTS "Users can view their inventory ledger" ON inventory_ledger;

DROP POLICY IF EXISTS "Users can manage own gl_accounts" ON gl_accounts;
DROP POLICY IF EXISTS "Public dev access" ON gl_accounts;
DROP POLICY IF EXISTS "Users manage own gl_accounts" ON gl_accounts;

DROP POLICY IF EXISTS "Users can manage own gl_entries" ON gl_entries;

DROP POLICY IF EXISTS "Public dev access" ON boms;
DROP POLICY IF EXISTS "Users manage own boms" ON boms;

DROP POLICY IF EXISTS "Users manage own production" ON production_orders;

DROP POLICY IF EXISTS "Owner Access Products" ON products;
DROP POLICY IF EXISTS "Users can view products for their business" ON products; -- from previous attempts

DROP POLICY IF EXISTS "Owner Access Customers" ON customers;

-- 2. Standardize Table Names (Legacy migration)
ALTER TABLE IF EXISTS inventory_ledger RENAME TO stock_movements;

-- 3. ALTER COLUMNS to TEXT
ALTER TABLE businesses ALTER COLUMN user_id TYPE text USING user_id::text;
DROP POLICY IF EXISTS "Users can create their own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update their own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can view their business memberships" ON business_users;

-- Also drop dependent function if it uses the column in a way that blocks (though function usually binds late, but better safe)
DROP FUNCTION IF EXISTS get_my_business_ids();

-- 2. ALTER COLUMNS to TEXT
ALTER TABLE businesses ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE business_users ALTER COLUMN user_id TYPE text USING user_id::text;

-- 3. RECREATE POLICIES on 'businesses' (Enable RLS just in case)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own businesses" ON businesses
    FOR SELECT
    USING (
        user_id = auth.uid()::text 
    );

CREATE POLICY "Users can create their own businesses" ON businesses
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()::text
    );

CREATE POLICY "Users can update their own businesses" ON businesses
    FOR UPDATE
    USING (
        user_id = auth.uid()::text
    );

-- 4. RECREATE POLICIES on 'business_users'
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business memberships" ON business_users
    FOR SELECT
    USING (
        user_id = auth.uid()::text
    );

-- 5. RECREATE Helper Function
CREATE OR REPLACE FUNCTION get_my_business_ids()
RETURNS TABLE (business_id UUID) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
    SELECT bu.business_id 
    FROM business_users bu 
    WHERE bu.user_id = auth.uid()::text;
END;
$$ LANGUAGE plpgsql;

-- 6. Apply Policies to Linked Tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view products for their business" ON products;
CREATE POLICY "Users can view products for their business" ON products
    FOR ALL
    USING (
        business_id IN (SELECT get_my_business_ids())
    );

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access own business invoices" ON invoices;
CREATE POLICY "Access own business invoices" ON invoices
    FOR ALL
    USING (
        business_id IN (SELECT get_my_business_ids())
    );

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access own business stock movements" ON stock_movements;
CREATE POLICY "Access own business stock movements" ON stock_movements
    FOR ALL
    USING (
        business_id IN (SELECT get_my_business_ids())
    );
