-- ============================================
-- Database Verification Script
-- Run this after migration to verify everything is set up correctly
-- ============================================

-- Check if all tables exist
SELECT 
    'feature_flags' as table_name, 
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feature_flags') as exists
UNION ALL SELECT 'feature_flag_overrides', EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feature_flag_overrides')
UNION ALL SELECT 'custom_roles', EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'custom_roles')
UNION ALL SELECT 'user_activity_logs', EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_activity_logs')
UNION ALL SELECT 'impersonation_sessions', EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'impersonation_sessions')
UNION ALL SELECT 'user_invitations', EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_invitations')
UNION ALL SELECT 'custom_packages', EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'custom_packages');

-- Check feature flags (should have 5 seed records)
SELECT 'Feature Flags Count' as check_name, COUNT(*) as count FROM feature_flags;

-- Show feature flags
SELECT key, name, is_active, rollout_percentage FROM feature_flags;

-- Check indexes
SELECT 
    indexname, 
    tablename 
FROM pg_indexes 
WHERE tablename IN (
    'feature_flags', 
    'feature_flag_overrides', 
    'custom_roles', 
    'user_activity_logs', 
    'impersonation_sessions', 
    'user_invitations', 
    'custom_packages'
)
ORDER BY tablename, indexname;

-- Check triggers
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgrelid::regclass::text IN (
    'feature_flags', 
    'feature_flag_overrides', 
    'custom_roles', 
    'user_invitations', 
    'custom_packages'
)
AND NOT tgisinternal
ORDER BY tgrelid::regclass::text, tgname;

-- Summary
SELECT 'Migration Verification Complete' as status;
