-- ============================================
-- Migration 011: Comprehensive Security Hardening
-- Extending Team Access RLS to all commerce and child tables
-- ============================================

-- 1. IDENTIFY ALL TABLES MISSING UNIFIED POLICIES
-- This includes item-level tables, specialized modules, and logs.

DO $$ 
DECLARE 
    t TEXT;
    all_erp_tables TEXT[] := ARRAY[
        -- Core Commerce
        'products', 'customers', 'invoices', 'invoice_items', 'vendors', 
        -- Warehouse & Manufacturing
        'warehouses', 'warehouse_locations', 'inventory_ledger', 
        'product_batches', 'product_serials', 'product_variants', 
        'product_stock_locations', 'stock_valuation_log', 'stock_transfers',
        'boms', 'bom_items', 'production_orders',
        -- Sales & Supply Chain
        'quotations', 'quotation_items', 'sales_orders', 'sales_order_items', 
        'delivery_challans', 'delivery_challan_items', 'purchase_orders', 
        'po_items', 'bills',
        -- Finance & Business
        'gl_accounts', 'gl_entries', 'tax_configurations', 'e_invoices',
        'activity_logs'
    ];
BEGIN
    FOREACH t IN ARRAY all_erp_tables LOOP
        -- 2. ENABLE RLS ON ALL TABLES
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

        -- 3. DROP ALL EXISTING POLICIES TO PREVENT OVERLAPS
        -- We want a single, clean "Team Access" policy per table.
        -- PostgREST will use the first policy that matches.
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Team access for %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Owners can manage own %I" ON %I', t, t);
        
        -- 4. APPLY UNIFIED TEAM ACCESS POLICY
        -- Uses the helper function public.current_user_has_business_access(business_id)
        -- which checks both ownership (businesses.user_id) and team membership (business_users).
        EXECUTE format('CREATE POLICY "Team access for %I" ON %I FOR ALL USING (public.current_user_has_business_access(business_id))', t, t);
    END LOOP;
END $$;

-- 5. VERIFY RE-GRANTS
-- Ensure authenticated role has full access to the API surface
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 6. AUDIT: REVOKE ANON FROM SENSITIVE TABLES (REDUNDANT BUT SAFE)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'REVOKE ALL ON TABLE ' || quote_ident(r.tablename) || ' FROM anon';
    END LOOP;
END $$;
