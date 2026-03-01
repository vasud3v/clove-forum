-- Database Performance Optimization Script
-- Run this in your Supabase SQL Editor

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- 1. Online users filter (partial index for better performance)
CREATE INDEX IF NOT EXISTS idx_forum_users_online 
ON forum_users(is_online, reputation DESC) 
WHERE is_online = true;

-- 2. Leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_forum_users_reputation 
ON forum_users(reputation DESC);

-- 3. Thread listing optimization
CREATE INDEX IF NOT EXISTS idx_threads_category_pinned_reply 
ON threads(category_id, is_pinned DESC, last_reply_at DESC);

-- 4. Profile customizations lookup
CREATE INDEX IF NOT EXISTS idx_profile_customizations_user 
ON profile_customizations(user_id);

-- 5. Thread author lookup
CREATE INDEX IF NOT EXISTS idx_threads_author 
ON threads(author_id);

-- 6. Thread last reply lookup
CREATE INDEX IF NOT EXISTS idx_threads_last_reply 
ON threads(last_reply_by_id);

-- 7. Posts thread lookup with ordering
CREATE INDEX IF NOT EXISTS idx_posts_thread_created 
ON posts(thread_id, created_at ASC);

-- 8. Posts author lookup
CREATE INDEX IF NOT EXISTS idx_posts_author 
ON posts(author_id);

-- ============================================
-- MATERIALIZED VIEW FOR LEADERBOARD
-- ============================================

-- Create materialized view for top users (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS leaderboard_cache AS
SELECT 
  id,
  username,
  avatar,
  custom_avatar,
  banner,
  custom_banner,
  post_count,
  reputation,
  join_date,
  is_online,
  rank,
  role
FROM forum_users
ORDER BY reputation DESC
LIMIT 100;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_cache_id 
ON leaderboard_cache(id);

-- Function to refresh leaderboard cache
CREATE OR REPLACE FUNCTION refresh_leaderboard_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ONLINE USERS CACHE TABLE
-- ============================================

-- Create a cache table for online users count
CREATE TABLE IF NOT EXISTS online_users_cache (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count INTEGER NOT NULL DEFAULT 0,
  users JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Initialize cache
INSERT INTO online_users_cache (id, count, users, updated_at)
VALUES (1, 0, '[]'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- Function to update online users cache
CREATE OR REPLACE FUNCTION update_online_users_cache()
RETURNS void AS $$
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER TO AUTO-UPDATE ONLINE CACHE
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_online_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if is_online changed
  IF (TG_OP = 'UPDATE' AND OLD.is_online IS DISTINCT FROM NEW.is_online) 
     OR TG_OP = 'INSERT' 
     OR TG_OP = 'DELETE' THEN
    PERFORM update_online_users_cache();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_online_cache_trigger ON forum_users;
CREATE TRIGGER update_online_cache_trigger
AFTER INSERT OR UPDATE OR DELETE ON forum_users
FOR EACH ROW
EXECUTE FUNCTION trigger_update_online_cache();

-- ============================================
-- SCHEDULED JOBS (Configure in Supabase Dashboard)
-- ============================================

-- Note: Set up these cron jobs in Supabase Dashboard > Database > Cron Jobs:
-- 
-- 1. Refresh leaderboard every 5 minutes:
--    SELECT cron.schedule('refresh-leaderboard', '*/5 * * * *', 'SELECT refresh_leaderboard_cache()');
--
-- 2. Update online users cache every minute (backup to trigger):
--    SELECT cron.schedule('update-online-cache', '* * * * *', 'SELECT update_online_users_cache()');

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

ANALYZE forum_users;
ANALYZE threads;
ANALYZE posts;
ANALYZE profile_customizations;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON leaderboard_cache TO authenticated, anon;
GRANT SELECT ON online_users_cache TO authenticated, anon;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check indexes created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('forum_users', 'threads', 'posts', 'profile_customizations')
ORDER BY tablename, indexname;

-- Check materialized view
SELECT COUNT(*) as leaderboard_entries FROM leaderboard_cache;

-- Check online users cache
SELECT count, updated_at FROM online_users_cache;

-- Initial cache population
SELECT update_online_users_cache();
SELECT refresh_leaderboard_cache();
