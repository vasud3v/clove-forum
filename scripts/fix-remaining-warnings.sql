-- Fix Remaining Linter Warnings
-- This addresses the materialized view API access warning

-- ============================================
-- FIX: Materialized View in API
-- ============================================

-- Revoke direct access to materialized view
REVOKE SELECT ON leaderboard_cache FROM anon, authenticated;

-- Create a secure function to access the leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS SETOF leaderboard_cache
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public, pg_temp
STABLE
AS $$
  SELECT * FROM leaderboard_cache 
  ORDER BY reputation DESC
  LIMIT limit_count;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER) TO anon, authenticated;

-- Create a similar function for online users cache
CREATE OR REPLACE FUNCTION get_online_users()
RETURNS SETOF online_users_cache
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public, pg_temp
STABLE
AS $$
  SELECT * FROM online_users_cache WHERE id = 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_online_users() TO anon, authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check permissions on materialized view (should show no anon/authenticated)
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'leaderboard_cache';

-- Check function permissions (should show anon/authenticated can EXECUTE)
SELECT 
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN ('get_leaderboard', 'get_online_users')
ORDER BY routine_name, grantee;

-- Test the functions
SELECT * FROM get_leaderboard(5);
SELECT * FROM get_online_users();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MATERIALIZED VIEW WARNING FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Direct access to leaderboard_cache revoked';
  RAISE NOTICE '✓ Secure function get_leaderboard() created';
  RAISE NOTICE '✓ Secure function get_online_users() created';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Usage in application:';
  RAISE NOTICE '  SELECT * FROM get_leaderboard(10);';
  RAISE NOTICE '  SELECT * FROM get_online_users();';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Remaining warning:';
  RAISE NOTICE '  - Auth password protection: Enable in Dashboard';
  RAISE NOTICE '========================================';
END $$;
