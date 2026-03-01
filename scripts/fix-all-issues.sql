-- Complete Fix: Remove Duplicates + Fix Security Issues
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: DROP DUPLICATE INDEXES
-- ============================================

-- Drop the old duplicate indexes (keeping our new optimized ones)
DROP INDEX IF EXISTS idx_posts_author_id;
DROP INDEX IF EXISTS idx_posts_thread_id_created_at;
DROP INDEX IF EXISTS idx_threads_last_reply_by_id;

-- ============================================
-- STEP 2: FIX FUNCTION SECURITY (search_path)
-- ============================================

-- Recreate refresh_leaderboard_cache with fixed search_path
CREATE OR REPLACE FUNCTION refresh_leaderboard_cache()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to refresh leaderboard cache: %', SQLERRM;
END;
$$;

-- Recreate update_online_users_cache with fixed search_path
CREATE OR REPLACE FUNCTION update_online_users_cache()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
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

-- Recreate trigger function with fixed search_path
CREATE OR REPLACE FUNCTION trigger_update_online_cache()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
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

-- ============================================
-- STEP 3: VERIFY FIXES
-- ============================================

-- Check for duplicate indexes (should return 0 rows)
SELECT 
  tablename,
  array_agg(indexname) as duplicate_indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('posts', 'threads')
GROUP BY tablename, indexdef
HAVING COUNT(*) > 1;

-- Check functions have search_path set (should show 'public' for all)
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.proconfig IS NULL THEN 'NOT SET'
    ELSE array_to_string(p.proconfig, ', ')
  END as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('refresh_leaderboard_cache', 'update_online_users_cache', 'trigger_update_online_cache')
ORDER BY p.proname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL ISSUES FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Duplicate indexes removed';
  RAISE NOTICE '✓ Function security fixed (search_path set)';
  RAISE NOTICE '✓ Database optimizations active';
  RAISE NOTICE '========================================';
END $$;
