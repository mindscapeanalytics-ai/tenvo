-- Migration: Add multi-level approval support for stock adjustments
-- Requirements: 5.6
-- Created: 2026-04-03

-- ============================================
-- 1. CREATE APPROVAL_CHAIN TABLE
-- Track approval history for multi-level approvals
-- ============================================

CREATE TABLE IF NOT EXISTS approval_chain (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    adjustment_id UUID NOT NULL REFERENCES stock_adjustments(id) ON DELETE CASCADE,
    
    -- Approval Level
    approval_level INTEGER NOT NULL,
    required_role VARCHAR(50) NOT NULL, -- 'staff', 'manager', 'director', 'admin'
    
    -- Approver Details
    approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approver_name VARCHAR(255),
    
    -- Decision
    decision VARCHAR(20) CHECK (decision IN ('pending', 'approved', 'rejected', 'skipped')),
    decision_at TIMESTAMPTZ,
    decision_notes TEXT,
    
    -- Metadata
    notified_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_approval_chain_adjustment ON approval_chain(adjustment_id, approval_level);
CREATE INDEX idx_approval_chain_business ON approval_chain(business_id);
CREATE INDEX idx_approval_chain_approver ON approval_chain(approver_id) WHERE decision = 'pending';
CREATE INDEX idx_approval_chain_pending ON approval_chain(business_id, decision) WHERE decision = 'pending';

-- Add RLS policies
ALTER TABLE approval_chain ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view approval chains for their business
CREATE POLICY "Users can view approval chains for their business"
    ON approval_chain
    FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: System can insert approval chains
CREATE POLICY "System can insert approval chains"
    ON approval_chain
    FOR INSERT
    WITH CHECK (true);

-- Policy: Approvers can update their own approval decisions
CREATE POLICY "Approvers can update their own approval decisions"
    ON approval_chain
    FOR UPDATE
    USING (approver_id = auth.uid() AND decision = 'pending');

-- Add comment to table
COMMENT ON TABLE approval_chain IS 'Tracks multi-level approval workflow for stock adjustments';
COMMENT ON COLUMN approval_chain.approval_level IS 'Approval level: 1=Manager, 2=Director, 3=Admin';
COMMENT ON COLUMN approval_chain.required_role IS 'Role required to approve at this level';
COMMENT ON COLUMN approval_chain.decision IS 'Approval decision: pending, approved, rejected, skipped';

-- ============================================
-- 2. CREATE APPROVAL_RULES TABLE
-- Define approval rules based on adjustment value
-- ============================================

CREATE TABLE IF NOT EXISTS approval_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Rule Configuration
    rule_name VARCHAR(255) NOT NULL,
    min_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    max_value DECIMAL(15,2), -- NULL means no upper limit
    
    -- Approval Levels Required
    approval_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example: [
    --   {"level": 1, "role": "manager", "description": "Department Manager"},
    --   {"level": 2, "role": "director", "description": "Operations Director"}
    -- ]
    
    -- Rule Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0, -- Higher priority rules checked first
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_approval_rules_business ON approval_rules(business_id);
CREATE INDEX idx_approval_rules_active ON approval_rules(business_id, is_active) WHERE is_active = true;
CREATE INDEX idx_approval_rules_value_range ON approval_rules(business_id, min_value, max_value) WHERE is_active = true;

-- Add RLS policies
ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view approval rules for their business
CREATE POLICY "Users can view approval rules for their business"
    ON approval_rules
    FOR SELECT
    USING (
        business_id IN (
            SELECT business_id FROM users WHERE id = auth.uid()
        )
    );

-- Policy: Admins can manage approval rules
CREATE POLICY "Admins can manage approval rules"
    ON approval_rules
    FOR ALL
    USING (
        business_id IN (
            SELECT business_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Add comment to table
COMMENT ON TABLE approval_rules IS 'Defines multi-level approval rules based on adjustment value';
COMMENT ON COLUMN approval_rules.approval_levels IS 'Array of approval levels with role requirements';

-- ============================================
-- 3. INSERT DEFAULT APPROVAL RULES
-- Create default 3-tier approval structure
-- ============================================

-- Note: This will be inserted per business during setup
-- Example default rules:
-- 
-- Rule 1: 0 - 10,000 PKR → Manager only (Level 1)
-- Rule 2: 10,001 - 50,000 PKR → Manager + Director (Levels 1-2)
-- Rule 3: 50,001+ PKR → Manager + Director + Admin (Levels 1-3)

-- ============================================
-- 4. CREATE FUNCTION TO GET REQUIRED APPROVAL LEVELS
-- Determine approval levels needed for an adjustment
-- ============================================

CREATE OR REPLACE FUNCTION get_required_approval_levels(
    p_business_id UUID,
    p_adjustment_value DECIMAL
)
RETURNS JSONB AS $$
DECLARE
    v_rule RECORD;
    v_approval_levels JSONB;
BEGIN
    -- Find matching approval rule (highest priority first)
    SELECT approval_levels INTO v_approval_levels
    FROM approval_rules
    WHERE business_id = p_business_id
      AND is_active = true
      AND min_value <= p_adjustment_value
      AND (max_value IS NULL OR max_value >= p_adjustment_value)
    ORDER BY priority DESC, min_value DESC
    LIMIT 1;
    
    -- If no rule found, return default single-level approval
    IF v_approval_levels IS NULL THEN
        v_approval_levels := '[{"level": 1, "role": "manager", "description": "Manager Approval"}]'::jsonb;
    END IF;
    
    RETURN v_approval_levels;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_required_approval_levels IS 'Returns required approval levels for given adjustment value';

-- ============================================
-- 5. CREATE FUNCTION TO INITIALIZE APPROVAL CHAIN
-- Create approval chain entries when adjustment is created
-- ============================================

CREATE OR REPLACE FUNCTION initialize_approval_chain(
    p_adjustment_id UUID,
    p_business_id UUID,
    p_adjustment_value DECIMAL
)
RETURNS VOID AS $$
DECLARE
    v_approval_levels JSONB;
    v_level JSONB;
BEGIN
    -- Get required approval levels
    v_approval_levels := get_required_approval_levels(p_business_id, p_adjustment_value);
    
    -- Create approval chain entry for each level
    FOR v_level IN SELECT * FROM jsonb_array_elements(v_approval_levels)
    LOOP
        INSERT INTO approval_chain (
            business_id,
            adjustment_id,
            approval_level,
            required_role,
            decision,
            created_at
        ) VALUES (
            p_business_id,
            p_adjustment_id,
            (v_level->>'level')::INTEGER,
            v_level->>'role',
            'pending',
            NOW()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION initialize_approval_chain IS 'Creates approval chain entries for a stock adjustment';

-- ============================================
-- 6. CREATE FUNCTION TO GET CURRENT APPROVAL LEVEL
-- Determine which approval level is currently active
-- ============================================

CREATE OR REPLACE FUNCTION get_current_approval_level(p_adjustment_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_current_level INTEGER;
BEGIN
    -- Get the lowest pending approval level
    SELECT MIN(approval_level) INTO v_current_level
    FROM approval_chain
    WHERE adjustment_id = p_adjustment_id
      AND decision = 'pending';
    
    -- If no pending levels, return 0 (all approved)
    RETURN COALESCE(v_current_level, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_current_approval_level IS 'Returns current pending approval level (0 if all approved)';

-- ============================================
-- 7. CREATE FUNCTION TO CHECK IF FULLY APPROVED
-- Check if all approval levels have been approved
-- ============================================

CREATE OR REPLACE FUNCTION is_fully_approved(p_adjustment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_pending_count INTEGER;
    v_rejected_count INTEGER;
BEGIN
    -- Count pending approvals
    SELECT COUNT(*) INTO v_pending_count
    FROM approval_chain
    WHERE adjustment_id = p_adjustment_id
      AND decision = 'pending';
    
    -- Count rejected approvals
    SELECT COUNT(*) INTO v_rejected_count
    FROM approval_chain
    WHERE adjustment_id = p_adjustment_id
      AND decision = 'rejected';
    
    -- Fully approved if no pending and no rejected
    RETURN (v_pending_count = 0 AND v_rejected_count = 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_fully_approved IS 'Returns true if all approval levels have been approved';

-- ============================================
-- 8. CREATE TRIGGER TO UPDATE ADJUSTMENT STATUS
-- Automatically update stock_adjustments when approval chain changes
-- ============================================

CREATE OR REPLACE FUNCTION update_adjustment_approval_status()
RETURNS TRIGGER AS $$
DECLARE
    v_is_approved BOOLEAN;
    v_is_rejected BOOLEAN;
    v_current_level INTEGER;
BEGIN
    -- Check if any level is rejected
    SELECT EXISTS(
        SELECT 1 FROM approval_chain
        WHERE adjustment_id = NEW.adjustment_id
          AND decision = 'rejected'
    ) INTO v_is_rejected;
    
    -- If rejected, update adjustment status
    IF v_is_rejected THEN
        UPDATE stock_adjustments
        SET approval_status = 'rejected',
            approved_by = NEW.approver_id,
            approved_at = NEW.decision_at,
            approval_notes = NEW.decision_notes,
            updated_at = NOW()
        WHERE id = NEW.adjustment_id;
        
        RETURN NEW;
    END IF;
    
    -- Check if fully approved
    v_is_approved := is_fully_approved(NEW.adjustment_id);
    
    -- If fully approved, update adjustment status
    IF v_is_approved THEN
        UPDATE stock_adjustments
        SET approval_status = 'approved',
            approved_by = NEW.approver_id,
            approved_at = NEW.decision_at,
            approval_notes = 'Approved through multi-level workflow',
            updated_at = NOW()
        WHERE id = NEW.adjustment_id;
    ELSE
        -- Update current approval level
        v_current_level := get_current_approval_level(NEW.adjustment_id);
        
        UPDATE stock_adjustments
        SET approval_level = v_current_level,
            updated_at = NOW()
        WHERE id = NEW.adjustment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_adjustment_approval_status ON approval_chain;
CREATE TRIGGER trigger_update_adjustment_approval_status
    AFTER UPDATE OF decision ON approval_chain
    FOR EACH ROW
    WHEN (NEW.decision IS DISTINCT FROM OLD.decision)
    EXECUTE FUNCTION update_adjustment_approval_status();

COMMENT ON FUNCTION update_adjustment_approval_status IS 'Automatically updates stock_adjustments approval status when approval chain changes';

-- ============================================
-- 9. CREATE FUNCTION TO GET APPROVAL CHAIN SUMMARY
-- Get approval chain status for an adjustment
-- ============================================

CREATE OR REPLACE FUNCTION get_approval_chain_summary(p_adjustment_id UUID)
RETURNS TABLE (
    level INTEGER,
    required_role VARCHAR,
    approver_name VARCHAR,
    decision VARCHAR,
    decision_at TIMESTAMPTZ,
    decision_notes TEXT,
    is_current BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.approval_level,
        ac.required_role,
        ac.approver_name,
        ac.decision,
        ac.decision_at,
        ac.decision_notes,
        (ac.approval_level = get_current_approval_level(p_adjustment_id)) as is_current
    FROM approval_chain ac
    WHERE ac.adjustment_id = p_adjustment_id
    ORDER BY ac.approval_level;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_approval_chain_summary IS 'Returns approval chain status with current level indicator';

-- ============================================
-- 10. CREATE UPDATED_AT TRIGGER FOR APPROVAL_CHAIN
-- ============================================

CREATE OR REPLACE FUNCTION update_approval_chain_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approval_chain_updated_at
    BEFORE UPDATE ON approval_chain
    FOR EACH ROW
    EXECUTE FUNCTION update_approval_chain_updated_at();

-- ============================================
-- 11. CREATE UPDATED_AT TRIGGER FOR APPROVAL_RULES
-- ============================================

CREATE OR REPLACE FUNCTION update_approval_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approval_rules_updated_at
    BEFORE UPDATE ON approval_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_approval_rules_updated_at();
