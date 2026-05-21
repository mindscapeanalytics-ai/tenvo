-- ============================================
-- Fix Missing Timestamp Columns
-- Add updated_at to tables that only have created_at
-- ============================================

-- 1. Fix user_activity_logs
-- Add updated_at column (it has created_at but needs updated_at too)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_activity_logs ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at to user_activity_logs';
    ELSE
        RAISE NOTICE 'updated_at already exists in user_activity_logs';
    END IF;
END $$;

-- Add trigger for user_activity_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_activity_logs_updated_at'
    ) THEN
        CREATE TRIGGER update_user_activity_logs_updated_at
            BEFORE UPDATE ON user_activity_logs
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added trigger for user_activity_logs';
    END IF;
END $$;

-- 2. Fix impersonation_sessions
-- Add both created_at and updated_at (it might be missing both)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'impersonation_sessions' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE impersonation_sessions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at to impersonation_sessions';
    ELSE
        RAISE NOTICE 'created_at already exists in impersonation_sessions';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'impersonation_sessions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE impersonation_sessions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at to impersonation_sessions';
    ELSE
        RAISE NOTICE 'updated_at already exists in impersonation_sessions';
    END IF;
END $$;

-- Ensure trigger exists for impersonation_sessions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_impersonation_sessions_updated_at'
    ) THEN
        CREATE TRIGGER update_impersonation_sessions_updated_at
            BEFORE UPDATE ON impersonation_sessions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added trigger for impersonation_sessions';
    END IF;
END $$;

-- 3. Also ensure user_invitations has both timestamps (it should from migration, but double-check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_invitations' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_invitations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at to user_invitations';
    END IF;
END $$;

-- Verify all tables have proper timestamps
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = c.table_name AND column_name IN ('created_at', 'updated_at')) as timestamp_columns
FROM information_schema.tables c
WHERE table_schema = 'public'
AND table_name IN ('user_activity_logs', 'impersonation_sessions', 'user_invitations', 'custom_roles', 'custom_packages')
ORDER BY table_name;

-- Summary
SELECT 'Timestamp fixes complete' as status, NOW() as applied_at;
