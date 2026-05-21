-- ============================================
-- Migration: Add Admin Features (Safe Version)
-- Date: 2026-05-21
-- Simplified version without problematic FK constraints
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Feature Flags Table
-- ============================================
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'boolean',
    default_value JSONB NOT NULL DEFAULT 'false',
    rollout_percentage INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_active ON feature_flags(is_active);

-- ============================================
-- 2. Feature Flag Overrides Table
-- ============================================
CREATE TABLE IF NOT EXISTS feature_flag_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('business', 'user')),
    target_id UUID NOT NULL,
    value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(feature_flag_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_flag_overrides_feature ON feature_flag_overrides(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_target ON feature_flag_overrides(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_flag_overrides_expires ON feature_flag_overrides(expires_at);

-- ============================================
-- 3. Custom Roles Table
-- ============================================
CREATE TABLE IF NOT EXISTS custom_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    restrictions JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_id, name)
);

CREATE INDEX IF NOT EXISTS idx_custom_roles_business ON custom_roles(business_id);
CREATE INDEX IF NOT EXISTS idx_custom_roles_active ON custom_roles(is_active);

-- ============================================
-- 4. User Activity Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    business_id UUID,
    session_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_business ON user_activity_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_session ON user_activity_logs(session_id);

-- ============================================
-- 5. Impersonation Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL,
    target_user_id UUID NOT NULL,
    business_id UUID,
    reason TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    actions_taken JSONB DEFAULT '[]',
    ip_address INET,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_impersonation_admin ON impersonation_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_target ON impersonation_sessions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_active ON impersonation_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_impersonation_started ON impersonation_sessions(started_at);

-- ============================================
-- 6. User Invitations Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    business_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    invited_by UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    custom_message TEXT,
    onboarding_checklist JSONB DEFAULT '[]',
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invitations_business ON user_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON user_invitations(expires_at);

-- ============================================
-- 7. Custom Packages Table (for Enterprise Deals)
-- ============================================
CREATE TABLE IF NOT EXISTS custom_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    base_tier VARCHAR(50) NOT NULL,
    custom_price_pkr INTEGER,
    custom_price_usd INTEGER,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
    features JSONB DEFAULT '{}',
    limits JSONB DEFAULT '{}',
    modules JSONB DEFAULT '[]',
    addons JSONB DEFAULT '[]',
    contract_start DATE,
    contract_end DATE,
    sla_details JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(business_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_packages_business ON custom_packages(business_id);
CREATE INDEX IF NOT EXISTS idx_custom_packages_active ON custom_packages(is_active);

-- ============================================
-- 8. Seed Default Feature Flags
-- ============================================
INSERT INTO feature_flags (key, name, description, type, default_value, rollout_percentage) VALUES
('new_dashboard_ui', 'New Dashboard UI', 'Modern redesigned dashboard interface', 'boolean', 'true', 100),
('beta_ai_features', 'Beta AI Features', 'Experimental AI analytics features', 'percentage', 'false', 0),
('advanced_reporting', 'Advanced Reporting', 'Enhanced reporting capabilities', 'boolean', 'false', 100),
('mobile_app_beta', 'Mobile App Beta', 'Beta access to mobile application', 'boolean', 'false', 0),
('whatsapp_integration', 'WhatsApp Integration', 'WhatsApp Business API features', 'business_list', 'false', 0)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Migration Complete
-- ============================================
