-- ============================================
-- Fix Column Type Mismatches
-- Change UUID columns to TEXT to match user.id type
-- ============================================

-- ============================================
-- 1. FIX USER-RELATED COLUMNS (UUID → TEXT)
-- ============================================

-- custom_roles.created_by
ALTER TABLE custom_roles 
ALTER COLUMN created_by TYPE TEXT;

-- user_activity_logs.user_id
ALTER TABLE user_activity_logs 
ALTER COLUMN user_id TYPE TEXT;

-- impersonation_sessions.admin_id
ALTER TABLE impersonation_sessions 
ALTER COLUMN admin_id TYPE TEXT;

-- impersonation_sessions.target_user_id
ALTER TABLE impersonation_sessions 
ALTER COLUMN target_user_id TYPE TEXT;

-- user_invitations.invited_by
ALTER TABLE user_invitations 
ALTER COLUMN invited_by TYPE TEXT;

-- user_invitations.accepted_by
ALTER TABLE user_invitations 
ALTER COLUMN accepted_by TYPE TEXT;

-- custom_packages.created_by
ALTER TABLE custom_packages 
ALTER COLUMN created_by TYPE TEXT;

-- feature_flag_overrides.created_by
ALTER TABLE feature_flag_overrides 
ALTER COLUMN created_by TYPE TEXT;

-- ============================================
-- 2. ADD FOREIGN KEYS AFTER TYPE FIX
-- ============================================

-- custom_roles.created_by → "user".id
ALTER TABLE custom_roles 
ADD CONSTRAINT custom_roles_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL;

-- user_activity_logs.user_id → "user".id
ALTER TABLE user_activity_logs 
ADD CONSTRAINT user_activity_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- impersonation_sessions.admin_id → "user".id
ALTER TABLE impersonation_sessions 
ADD CONSTRAINT impersonation_sessions_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- impersonation_sessions.target_user_id → "user".id
ALTER TABLE impersonation_sessions 
ADD CONSTRAINT impersonation_sessions_target_user_id_fkey 
FOREIGN KEY (target_user_id) REFERENCES "user"(id) ON DELETE CASCADE;

-- user_invitations.invited_by → "user".id
ALTER TABLE user_invitations 
ADD CONSTRAINT user_invitations_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES "user"(id) ON DELETE CASCADE;

-- user_invitations.accepted_by → "user".id
ALTER TABLE user_invitations 
ADD CONSTRAINT user_invitations_accepted_by_fkey 
FOREIGN KEY (accepted_by) REFERENCES "user"(id) ON DELETE SET NULL;

-- custom_packages.created_by → "user".id
ALTER TABLE custom_packages 
ADD CONSTRAINT custom_packages_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL;

-- feature_flag_overrides.created_by → "user".id
ALTER TABLE feature_flag_overrides 
ADD CONSTRAINT feature_flag_overrides_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL;

-- ============================================
-- 3. ADD BUSINESS FOREIGN KEYS (UUID is fine for businesses.id)
-- ============================================

-- custom_roles.business_id → businesses.id
ALTER TABLE custom_roles 
ADD CONSTRAINT custom_roles_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- user_activity_logs.business_id → businesses.id
ALTER TABLE user_activity_logs 
ADD CONSTRAINT user_activity_logs_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL;

-- impersonation_sessions.business_id → businesses.id
ALTER TABLE impersonation_sessions 
ADD CONSTRAINT impersonation_sessions_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL;

-- user_invitations.business_id → businesses.id
ALTER TABLE user_invitations 
ADD CONSTRAINT user_invitations_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- custom_packages.business_id → businesses.id
ALTER TABLE custom_packages 
ADD CONSTRAINT custom_packages_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;

-- ============================================
-- 4. ADD PERFORMANCE INDEXES
-- ============================================

CREATE INDEX idx_feature_overrides_target_lookup 
ON feature_flag_overrides(target_type, target_id, feature_flag_id);

CREATE INDEX idx_activity_logs_time 
ON user_activity_logs(created_at DESC);

CREATE INDEX idx_impersonation_lookup 
ON impersonation_sessions(admin_id, target_user_id, is_active);

CREATE INDEX idx_invitations_status_lookup 
ON user_invitations(status, expires_at);

-- ============================================
-- 5. ADD UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_roles_updated_at
    BEFORE UPDATE ON custom_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_invitations_updated_at
    BEFORE UPDATE ON user_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_packages_updated_at
    BEFORE UPDATE ON custom_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification
-- ============================================

SELECT 'Column types fixed and foreign keys added' as status;
