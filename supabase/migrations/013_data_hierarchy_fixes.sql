-- ============================================
-- Migration 013: Data Hierarchy & RLS Optimization
-- Adding business_id to child tables for direct RLS enforcement
-- ============================================

DO $$ 
DECLARE 
    t TEXT;
    child_tables TEXT[] := ARRAY[
        'invoice_items', 'quotation_items', 'sales_order_items', 
        'delivery_challan_items', 'po_items', 'bom_items'
    ];
BEGIN
    FOREACH t IN ARRAY child_tables LOOP
        -- 1. ADD COLUMN
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE', t);
        
        -- 2. ENABLE RLS (Ensure it is on)
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

        -- 3. DROP OVERLAPPING POLICIES
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage own %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can view own %I" ON %I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Team access for %I" ON %I', t, t);
        
        -- 4. CREATE DIRECT RLS POLICY
        -- Directly check business_id for high performance instead of JOINs
        EXECUTE format('CREATE POLICY "Team access for %I" ON %I FOR ALL USING (public.current_user_has_business_access(business_id))', t, t);
    END LOOP;
END $$;

-- 5. RE-GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
