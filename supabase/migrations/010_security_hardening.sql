-- ============================================
-- Migration 010: Security Hardening & Team RLS Fix
-- ============================================

-- 1. REVOKE UNIVERSAL ANONYMOUS ACCESS
-- We must not allow anonymous users to mutate or even read core ERP data.
-- Anon should only be used for public landing pages if any.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'REVOKE ALL ON TABLE ' || quote_ident(r.tablename) || ' FROM anon';
    END LOOP;
END $$;

-- Specifically re-grant SELECT to anon on businesses for domain lookup if needed by the app
-- But let's keep it authenticated only for now per ERP best practices.
-- GRANT SELECT ON businesses TO anon; 

-- 2. RE-GRANT TO AUTHENTICATED USERS
-- PostgREST needs grants to expose tables to the API.

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 3. FIX RLS POLICIES FOR TEAM ACCESS (business_users)
-- Current policies only allowed the 'creator' (user_id = auth.uid()) to access data.
-- We need to allow anyone in the business_users table for that business_id.

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view own boxes" ON businesses;
DROP POLICY IF EXISTS "Users can manage own gl_accounts" ON gl_accounts;
DROP POLICY IF EXISTS "Users can manage own gl_entries" ON gl_entries;
-- (Add other drops if necessary, but we'll focus on the pattern)

-- Define Helper Function for Business Access
CREATE OR REPLACE FUNCTION public.current_user_has_business_access(business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses WHERE id = business_id AND user_id = auth.uid()
    UNION ALL
    SELECT 1 FROM business_users WHERE business_id = business_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Unified Policies for all Commerce Tables
-- Pattern: authenticated users can access if they belong to the business

DO $$ 
DECLARE 
    t TEXT;
    commerce_tables TEXT[] := ARRAY[
        'products', 'customers', 'invoices', 'invoice_items', 'vendors', 
        'warehouses', 'inventory_ledger', 'product_batches', 'product_serials', 
        'product_variants', 'gl_accounts', 'gl_entries', 'quotations', 
        'sales_orders', 'delivery_challans', 'boms', 'production_orders'
    ];
BEGIN
    FOREACH t IN ARRAY commerce_tables LOOP
        -- Remove old policies to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON %I', t, t);
        
        -- Create New Unified Policy
        EXECUTE format('CREATE POLICY "Team access for %I" ON %I FOR ALL USING (public.current_user_has_business_access(business_id))', t, t);
    END LOOP;
END $$;

-- 4. SPECIAL CASE: Businesses Table
-- Users should see businesses they own or are part of.
DROP POLICY IF EXISTS "Users can read own businesses" ON businesses;
CREATE POLICY "Users can read businesses" ON businesses FOR SELECT USING (
  user_id = auth.uid() OR 
  id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid())
);

-- Owners can still update/delete their own businesses
CREATE POLICY "Owners can manage businesses" ON businesses FOR ALL USING (user_id = auth.uid());

-- 5. ENSURE RLS IS ENABLED EVERYWHERE
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;
