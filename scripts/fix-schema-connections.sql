-- ============================================
-- Schema Fix: Add Missing Foreign Keys & Connections
-- Fixes all gaps identified in schema analysis
-- ============================================

-- ============================================
-- 1. ADD MISSING FOREIGN KEYS TO BUSINESSES
-- ============================================

-- custom_roles.business_id → businesses.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'custom_roles_business_id_fkey'
    ) THEN
        ALTER TABLE custom_roles 
        ADD CONSTRAINT custom_roles_business_id_fkey 
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: custom_roles.business_id → businesses.id';
    ELSE
        RAISE NOTICE 'FK already exists: custom_roles_business_id_fkey';
    END IF;
END $$;

-- user_activity_logs.business_id → businesses.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_activity_logs_business_id_fkey'
    ) THEN
        ALTER TABLE user_activity_logs 
        ADD CONSTRAINT user_activity_logs_business_id_fkey 
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: user_activity_logs.business_id → businesses.id';
    ELSE
        RAISE NOTICE 'FK already exists: user_activity_logs_business_id_fkey';
    END IF;
END $$;

-- impersonation_sessions.business_id → businesses.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'impersonation_sessions_business_id_fkey'
    ) THEN
        ALTER TABLE impersonation_sessions 
        ADD CONSTRAINT impersonation_sessions_business_id_fkey 
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: impersonation_sessions.business_id → businesses.id';
    ELSE
        RAISE NOTICE 'FK already exists: impersonation_sessions_business_id_fkey';
    END IF;
END $$;

-- user_invitations.business_id → businesses.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_invitations_business_id_fkey'
    ) THEN
        ALTER TABLE user_invitations 
        ADD CONSTRAINT user_invitations_business_id_fkey 
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: user_invitations.business_id → businesses.id';
    ELSE
        RAISE NOTICE 'FK already exists: user_invitations_business_id_fkey';
    END IF;
END $$;

-- custom_packages.business_id → businesses.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'custom_packages_business_id_fkey'
    ) THEN
        ALTER TABLE custom_packages 
        ADD CONSTRAINT custom_packages_business_id_fkey 
        FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: custom_packages.business_id → businesses.id';
    ELSE
        RAISE NOTICE 'FK already exists: custom_packages_business_id_fkey';
    END IF;
END $$;

-- ============================================
-- 2. ADD MISSING FOREIGN KEYS TO "user" TABLE
-- ============================================

-- custom_roles.created_by → "user".id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'custom_roles_created_by_fkey'
    ) THEN
        ALTER TABLE custom_roles 
        ADD CONSTRAINT custom_roles_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: custom_roles.created_by → "user".id';
    ELSE
        RAISE NOTICE 'FK already exists: custom_roles_created_by_fkey';
    END IF;
END $$;

-- user_activity_logs.user_id → "user".id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_activity_logs_user_id_fkey'
    ) THEN
        ALTER TABLE user_activity_logs 
        ADD CONSTRAINT user_activity_logs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: user_activity_logs.user_id → "user".id';
    ELSE
        RAISE NOTICE 'FK already exists: user_activity_logs_user_id_fkey';
    END IF;
END $$;

-- impersonation_sessions.admin_id → "user".id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'impersonation_sessions_admin_id_fkey'
    ) THEN
        ALTER TABLE impersonation_sessions 
        ADD CONSTRAINT impersonation_sessions_admin_id_fkey 
        FOREIGN KEY (admin_id) REFERENCES "user"(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: impersonation_sessions.admin_id → "user".id';
    ELSE
        RAISE NOTICE 'FK already exists: impersonation_sessions_admin_id_fkey';
    END IF;
END $$;

-- impersonation_sessions.target_user_id → "user".id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'impersonation_sessions_target_user_id_fkey'
    ) THEN
        ALTER TABLE impersonation_sessions 
        ADD CONSTRAINT impersonation_sessions_target_user_id_fkey 
        FOREIGN KEY (target_user_id) REFERENCES "user"(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: impersonation_sessions.target_user_id → "user".id';
    ELSE
        RAISE NOTICE 'FK already exists: impersonation_sessions_target_user_id_fkey';
    END IF;
END $$;

-- user_invitations.invited_by → "user".id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_invitations_invited_by_fkey'
    ) THEN
        ALTER TABLE user_invitations 
        ADD CONSTRAINT user_invitations_invited_by_fkey 
        FOREIGN KEY (invited_by) REFERENCES "user"(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added FK: user_invitations.invited_by → "user".id';
    ELSE
        RAISE NOTICE 'FK already exists: user_invitations_invited_by_fkey';
    END IF;
END $$;

-- user_invitations.accepted_by → "user".id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_invitations_accepted_by_fkey'
    ) THEN
        ALTER TABLE user_invitations 
        ADD CONSTRAINT user_invitations_accepted_by_fkey 
        FOREIGN KEY (accepted_by) REFERENCES "user"(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: user_invitations.accepted_by → "user".id';
    ELSE
        RAISE NOTICE 'FK already exists: user_invitations_accepted_by_fkey';
    END IF;
END $$;

-- custom_packages.created_by → "user".id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'custom_packages_created_by_fkey'
    ) THEN
        ALTER TABLE custom_packages 
        ADD CONSTRAINT custom_packages_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: custom_packages.created_by → "user".id';
    ELSE
        RAISE NOTICE 'FK already exists: custom_packages_created_by_fkey';
    END IF;
END $$;

-- feature_flag_overrides.created_by → "user".id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'feature_flag_overrides_created_by_fkey'
    ) THEN
        ALTER TABLE feature_flag_overrides 
        ADD CONSTRAINT feature_flag_overrides_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added FK: feature_flag_overrides.created_by → "user".id';
    ELSE
        RAISE NOTICE 'FK already exists: feature_flag_overrides_created_by_fkey';
    END IF;
END $$;

-- ============================================
-- 3. ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================

-- Index on feature_flag_overrides for target lookups
CREATE INDEX IF NOT EXISTS idx_feature_overrides_target_lookup 
ON feature_flag_overrides(target_type, target_id, feature_flag_id);

-- Index on user_activity_logs for time-based queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_time 
ON user_activity_logs(created_at DESC);

-- Composite index on impersonation_sessions
CREATE INDEX IF NOT EXISTS idx_impersonation_lookup 
ON impersonation_sessions(admin_id, target_user_id, is_active);

-- Index on user_invitations for status filtering
CREATE INDEX IF NOT EXISTS idx_invitations_status_lookup 
ON user_invitations(status, expires_at);

-- ============================================
-- 4. ADD TRIGGERS FOR UPDATED_AT (if missing)
-- ============================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to custom_roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_custom_roles_updated_at'
    ) THEN
        CREATE TRIGGER update_custom_roles_updated_at
            BEFORE UPDATE ON custom_roles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added trigger: update_custom_roles_updated_at';
    END IF;
END $$;

-- Apply to user_invitations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_invitations_updated_at'
    ) THEN
        CREATE TRIGGER update_user_invitations_updated_at
            BEFORE UPDATE ON user_invitations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added trigger: update_user_invitations_updated_at';
    END IF;
END $$;

-- Apply to custom_packages
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_custom_packages_updated_at'
    ) THEN
        CREATE TRIGGER update_custom_packages_updated_at
            BEFORE UPDATE ON custom_packages
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added trigger: update_custom_packages_updated_at';
    END IF;
END $$;

-- ============================================
-- 5. VERIFY ALL FIXES APPLIED
-- ============================================

DO $$
DECLARE
    fk_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count foreign keys on new tables
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE table_name IN ('custom_roles', 'user_activity_logs', 'impersonation_sessions', 
                         'user_invitations', 'custom_packages', 'feature_flag_overrides')
    AND constraint_type = 'FOREIGN KEY';
    
    -- Count indexes on new tables
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename IN ('custom_roles', 'user_activity_logs', 'impersonation_sessions', 
                        'user_invitations', 'custom_packages', 'feature_flag_overrides', 'feature_flags');
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SCHEMA FIX COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Foreign Keys Added: %', fk_count;
    RAISE NOTICE 'Indexes Present: %', index_count;
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- Summary View
-- ============================================

SELECT 
    'SCHEMA FIXES APPLIED' as status,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE table_name IN ('custom_roles', 'user_activity_logs', 'impersonation_sessions', 
                          'user_invitations', 'custom_packages', 'feature_flag_overrides')
     AND constraint_type = 'FOREIGN KEY') as foreign_keys_added,
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE tablename IN ('custom_roles', 'user_activity_logs', 'impersonation_sessions', 
                         'user_invitations', 'custom_packages', 'feature_flag_overrides', 'feature_flags')) as indexes_present,
    NOW() as applied_at;
