-- ============================================
-- Migration 006: Business Settings & Global Audit
-- Adds flexible settings and audit triggers
-- ============================================

-- 1. ADAPT BUSINESSES TABLE
-- Add settings JSONB column for flexible configuration
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "coa_mapping": {
    "cash": "1001",
    "ar": "1100",
    "ap": "2001",
    "revenue": "4000",
    "inventory": "1200",
    "tax_payable": "2100"
  },
  "domain_defaults": {
    "currency": "PKR",
    "timezone": "Asia/Karachi"
  }
}';

-- 2. CREATE ACTIVITY LOGS TABLE (AUDIT TRAIL)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Action Details
  action TEXT NOT NULL, -- create, update, delete, login, export
  entity_type TEXT NOT NULL, -- products, invoices, customers, settings
  entity_id UUID,
  
  -- Changes (for updates)
  old_data JSONB,
  new_data JSONB,
  
  -- Context
  user_agent TEXT,
  ip_address TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business logs" ON activity_logs
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_logs_business ON activity_logs(business_id);
CREATE INDEX idx_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_logs_created ON activity_logs(created_at);

-- 3. HELPER FUNCTION FOR LOGGING (Optional for triggers)
CREATE OR REPLACE FUNCTION log_business_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (business_id, user_id, action, entity_type, entity_id, new_data)
  VALUES (
    NEW.business_id,
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
