-- Database Performance Optimization Script v2
-- Run this in your Supabase SQL Editor
-- This version has better error handling

-- ============================================
-- PART 1: CREATE INDEXES
-- ============================================

-- 1. Online users filter (partial index for better performance)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_forum_users_online') THEN
    CREATE INDEX idx_forum_users_online ON forum_users(is_online, reputation DESC) WHERE is_online = true;
    RAISE NOTICE '✓ Created idx_forum_users_online';
  ELSE
    RAISE NOTICE '✓ idx_forum_users_online already exists';
  END IF;
END $$;

-- 2. Leaderboard sorting
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_forum_users_reputation') THEN
    CREATE INDEX idx_forum_users_reputation ON forum_users(reputation DESC);
    RAISE NOTICE '✓ Created idx_forum_users_reputation';
  ELSE
    RAISE NOTICE '✓ idx_forum_users_reputation already exists';
  END IF;
END $$;

-- 3. Thread listing optimization
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_threads_category_pinned_reply') THEN
    CREATE INDEX idx_threads_category_pinned_reply ON threads(category_id, is_pinned DESC, last_reply_at DESC);
    RAISE NOTICE '✓ Created idx_threads_category_pinned_reply';
  ELSE
    RAISE NOTICE '✓ idx_threads_category_pinned_reply already exists';
  END IF;
END $$;

-- 4. Profile customizations lookup
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profile_customizations_user') THEN
    CREATE INDEX idx_profile_customizations_user ON profile_customizations(user_id);
    RAISE NOTICE '✓ Created idx_profile_customizations_user';
  ELSE
    RAISE NOTICE '✓ idx_profile_customizations_user already exists';
  END IF;
END $$;

-- 5. Thread author lookup
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_threads_author') THEN
    CREATE INDEX idx_threads_author ON threads(author_id);
    RAISE NOTICE '✓ Created idx_threads_author';
  ELSE
    RAISE NOTICE '✓ idx_threads_author already exists';
  END IF;
END $$;

-- 6. Thread last reply lookup
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_threads_last_reply') THEN
    CREATE INDEX idx_threads_last_reply ON threads(last_reply_by_id);
    RAISE NOTICE '✓ Created idx_threads_last_reply';
  ELSE
    RAISE NOTICE '✓ idx_threads_last_reply already exists';
  END IF;
END $$;

-- 7. Posts thread lookup with ordering
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_thread_created') THEN
    CREATE INDEX idx_posts_thread_created ON posts(thread_id, created_at ASC);
    RAISE NOTICE '✓ Created idx_posts_thread_created';
  ELSE
    RAISE NOTICE '✓ idx_posts_thread_created already exists';
  END IF;
END $$;

-- 8. Posts author lookup
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_author') THEN
    CREATE INDEX idx_posts_author ON posts(author_id);
    RAISE NOTICE '✓ Created idx_posts_author';
  ELSE
    RAISE NOTICE '✓ idx_posts_author already exists';
  END IF;
END $$;

-- ============================================
-- PART 2: ANALYZE TABLES
-- ============================================

DO $$
BEGIN
  ANALYZE forum_users;
  ANALYZE threads;
  ANALYZE posts;
  ANALYZE profile_customizations;
  RAISE NOTICE '✓ Tables analyzed';
END $$;

-- ============================================
-- PART 3: CREATE MATERIALIZED VIEW
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'leaderboard_cache') THEN
    CREATE MATERIALIZED VIEW leaderboard_cache AS
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
    
    CREATE UNIQUE INDEX idx_leaderboard_cache_id ON leaderboard_cache(id);
    RAISE NOTICE '✓ Created leaderboard_cache materialized view';
  ELSE
    RAISE NOTICE '✓ leaderboard_cache already exists';
  END IF;
END $$;

-- ============================================
-- PART 4: CREATE CACHE TABLE
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'online_users_cache') THEN
    CREATE TABLE online_users_cache (
      id INTEGER PRIMARY KEY DEFAULT 1,
      count INTEGER NOT NULL DEFAULT 0,
      users JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT single_row CHECK (id = 1)
    );
    
    INSERT INTO online_users_cache (id, count, users, updated_at)
    VALUES (1, 0, '[]'::jsonb, NOW());
    
    RAISE NOTICE '✓ Created online_users_cache table';
  ELSE
    RAISE NOTICE '✓ online_users_cache already exists';
  END IF;
END $$;

-- ============================================
-- PART 5: CREATE FUNCTIONS
-- ============================================

-- Function to refresh leaderboard cache
CREATE OR REPLACE FUNCTION refresh_leaderboard_cache()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_cache;
  RAISE NOTICE '✓ Leaderboard cache refreshed';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to refresh leaderboard cache: %', SQLERRM;
END;
$$;

-- Function to update online users cache
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
  
  RAISE NOTICE '✓ Online users cache updated: % users', online_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update online users cache: %', SQLERRM;
END;
$$;

-- ============================================
-- PART 6: CREATE TRIGGER
-- ============================================

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

DROP TRIGGER IF EXISTS update_online_cache_trigger ON forum_users;
CREATE TRIGGER update_online_cache_trigger
AFTER INSERT OR UPDATE OR DELETE ON forum_users
FOR EACH ROW
EXECUTE FUNCTION trigger_update_online_cache();

-- ============================================
-- PART 7: GRANT PERMISSIONS
-- ============================================

DO $$
BEGIN
  GRANT SELECT ON leaderboard_cache TO authenticated, anon;
  GRANT SELECT ON online_users_cache TO authenticated, anon;
  RAISE NOTICE '✓ Permissions granted';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to grant permissions: %', SQLERRM;
END $$;

-- ============================================
-- PART 8: INITIAL CACHE POPULATION
-- ============================================

DO $$
BEGIN
  PERFORM update_online_users_cache();
  PERFORM refresh_leaderboard_cache();
  RAISE NOTICE '✓ Initial cache population complete';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to populate caches: %', SQLERRM;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  index_count INTEGER;
  leaderboard_count INTEGER;
  online_count INTEGER;
BEGIN
  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE indexname LIKE 'idx_%'
    AND schemaname = 'public'
    AND tablename IN ('forum_users', 'threads', 'posts', 'profile_customizations');
  
  -- Count leaderboard entries
  SELECT COUNT(*) INTO leaderboard_count FROM leaderboard_cache;
  
  -- Get online users count
  SELECT count INTO online_count FROM online_users_cache;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ OPTIMIZATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Indexes created: %', index_count;
  RAISE NOTICE 'Leaderboard cached: % users', leaderboard_count;
  RAISE NOTICE 'Online users: %', online_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy your application code';
  RAISE NOTICE '2. Monitor query performance';
  RAISE NOTICE '3. Optional: Run setup-cron-jobs.sql';
  RAISE NOTICE '========================================';
END $$;
