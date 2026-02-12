-- ============================================
-- Migration 027: Add Missing Tables (Simplified)
-- ============================================

-- 1. GENERAL LEDGER
CREATE TABLE IF NOT EXISTS general_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  account_code VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  debit DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  description TEXT,
  reference_type VARCHAR(50),
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  
  CONSTRAINT positive_debit CHECK (debit >= 0),
  CONSTRAINT positive_credit CHECK (credit >= 0)
);

CREATE INDEX IF NOT EXISTS idx_general_ledger_business_id ON general_ledger(business_id);
CREATE INDEX IF NOT EXISTS idx_general_ledger_entry_date ON general_ledger(entry_date);
CREATE INDEX IF NOT EXISTS idx_general_ledger_account_code ON general_ledger(account_code);
CREATE INDEX IF NOT EXISTS idx_general_ledger_reference ON general_ledger(reference_type, reference_id);

-- 2. WORKFLOW RULES (if not exists)
CREATE TABLE IF NOT EXISTS workflow_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  rule_text TEXT NOT NULL,
  rule_logic JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_rules_business_id ON workflow_rules(business_id);

-- 3. WORKFLOW HISTORY (if not exists)
CREATE TABLE IF NOT EXISTS workflow_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES workflow_rules(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_history_business_id ON workflow_history(business_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_rule_id ON workflow_history(rule_id);
