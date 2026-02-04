-- ============================================
-- Migration 007: RBAC & Audit Trail System
-- Implements business-user roles and updates RLS
-- ============================================

-- 1. CREATE BUSINESS_USERS TABLE
CREATE TABLE IF NOT EXISTS business_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Role Management
  role TEXT NOT NULL DEFAULT 'salesperson', -- owner, admin, accountant, salesperson, manager
  status TEXT DEFAULT 'active', -- active, inactive, suspended
  
  -- Permissions (Optional JSONB for overrides)
  permissions JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'accountant', 'salesperson', 'manager')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended')),
  CONSTRAINT unique_user_per_business UNIQUE (business_id, user_id)
);

-- 2. SEED EXISTING OWNERS
-- Migrate data from businesses.user_id to business_users
INSERT INTO business_users (business_id, user_id, role, status)
SELECT id, user_id, 'owner', 'active' FROM businesses
ON CONFLICT (business_id, user_id) DO NOTHING;

-- 3. HELPER FUNCTION FOR RLS
-- This function centralizes access checks
CREATE OR REPLACE FUNCTION check_business_access(input_business_id UUID, required_roles TEXT[] DEFAULT ARRAY['owner', 'admin', 'accountant', 'salesperson', 'manager'])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM business_users
    WHERE business_id = input_business_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND (role = ANY(required_roles) OR role = 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. UPDATE RLS POLICIES
-- We need to drop and recreate policies to use the new check_business_access function

-- Drop old policies (Example for product_batches)
-- We will do this for ALL tables in a separate step if needed, but for now we focus on new tables and CORE tables.

-- Example for activity_logs update
DROP POLICY IF EXISTS "Users can view own business logs" ON activity_logs;
CREATE POLICY "Users can view own business logs" ON activity_logs
  FOR SELECT USING (check_business_access(business_id, ARRAY['owner', 'admin']));

-- Enable RLS on business_users
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage users" ON business_users
  FOR ALL USING (check_business_access(business_id, ARRAY['owner', 'admin']));

CREATE POLICY "Users can view own workspace membership" ON business_users
  FOR SELECT USING (user_id = auth.uid());

-- 5. AUDIT TRIGGERS (Auto-log deletes)
CREATE OR REPLACE FUNCTION log_deletion_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (business_id, user_id, action, entity_type, entity_id, old_data)
  VALUES (
    OLD.business_id,
    auth.uid(),
    'DELETE',
    TG_TABLE_NAME,
    OLD.id,
    row_to_json(OLD)::jsonb
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Apply to products
CREATE TRIGGER trg_log_product_delete
BEFORE DELETE ON products
FOR EACH ROW EXECUTE FUNCTION log_deletion_activity();
