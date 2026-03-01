-- Remove Unused Leaderboard Cache
-- Since the leaderboard component is not used in the application

-- Drop the materialized view
DROP MATERIALIZED VIEW IF EXISTS leaderboard_cache CASCADE;

-- Drop the refresh function
DROP FUNCTION IF EXISTS refresh_leaderboard_cache();

-- Unschedule cron job (if it exists)
DO $$
BEGIN
  PERFORM cron.unschedule('refresh-leaderboard-cache');
EXCEPTION
  WHEN undefined_table THEN
    -- pg_cron not installed, skip
    NULL;
  WHEN undefined_object THEN
    -- Job doesn't exist, skip
    NULL;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LEADERBOARD CACHE REMOVED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Materialized view dropped';
  RAISE NOTICE '✓ Refresh function dropped';
  RAISE NOTICE '✓ Cron job unscheduled';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Leaderboard caching removed since component is not used';
  RAISE NOTICE '========================================';
END $$;
