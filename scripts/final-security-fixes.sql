-- Final Security Fixes
-- This addresses the remaining linter warnings

-- ============================================
-- FIX 1: Function search_path (Alternative Approach)
-- ============================================

-- Drop trigger first (it depends on the function)
DROP TRIGGER IF EXISTS update_online_cache_trigger ON forum_users;

-- Now drop and recreate functions with proper security settings
DROP FUNCTION IF EXISTS refresh_leaderboard_cache();
DROP FUNCTION IF EXISTS update_online_users_cache();
DROP FUNCTION IF EXISTS trigger_update_online_cache();

-- Recreate with explicit search_path in function definition
CREATE FUNCTION refresh_leaderboard_cache()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to refresh leaderboard cache: %', SQLERRM;
END;
$$;

CREATE FUNCTION update_online_users_cache()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  online_count INTEGER;
  online_users_json JSONB;
BEGIN
  SELECT COUNT(*), COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'username', username,
      'avatar', avatar,
      'custom_avatar', custom_avatar,
      'reputation', reputation,
      'rank', rank,
      'role', role
    )
  ), '[]'::jsonb)
  INTO online_count, online_users_json
  FROM forum_users
  WHERE is_online = true;
  
  UPDATE online_users_cache
  SET count = online_count,
      users = online_users_json,
      updated_at = NOW()
  WHERE id = 1;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update online users cache: %', SQLERRM;
END;
$$;

CREATE FUNCTION trigger_update_online_cache()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.is_online IS DISTINCT FROM NEW.is_online) 
     OR TG_OP = 'INSERT' 
     OR TG_OP = 'DELETE' THEN
    PERFORM update_online_users_cache();
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS update_online_cache_trigger ON forum_users;
CREATE TRIGGER update_online_cache_trigger
AFTER INSERT OR UPDATE OR DELETE ON forum_users
FOR EACH ROW
EXECUTE FUNCTION trigger_update_online_cache();

-- ============================================
-- FIX 2: Materialized View API Access (Optional)
-- ============================================

-- Note: The materialized view warning is informational.
-- The view IS meant to be accessible via API for performance.
-- If you want to hide it from direct API access, uncomment below:

-- REVOKE SELECT ON leaderboard_cache FROM anon, authenticated;

-- Then you'd need to create a function to access it:
-- CREATE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
-- RETURNS SETOF leaderboard_cache
-- LANGUAGE sql
-- SECURITY DEFINER
-- SET search_path TO public, pg_temp
-- AS $$
--   SELECT * FROM leaderboard_cache LIMIT limit_count;
-- $$;
-- GRANT EXECUTE ON FUNCTION get_leaderboard TO anon, authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check function configurations
SELECT 
  p.proname as function_name,
  COALESCE(array_to_string(p.proconfig, ', '), 'NOT SET') as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('refresh_leaderboard_cache', 'update_online_users_cache', 'trigger_update_online_cache')
ORDER BY p.proname;

-- Success
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SECURITY FIXES APPLIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Functions have search_path set';
  RAISE NOTICE '✓ Materialized view accessible (by design)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Remaining warnings:';
  RAISE NOTICE '- Materialized view in API: SAFE (intentional)';
  RAISE NOTICE '- Auth password protection: Enable in Supabase Dashboard';
  RAISE NOTICE '========================================';
END $$;
