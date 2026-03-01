-- Verification Script for Database Optimizations
-- Run this after executing optimize-database-performance.sql

-- ============================================
-- 1. CHECK INDEXES
-- ============================================
SELECT 
  '✓ Indexes Created' as status,
  COUNT(*) as index_count
FROM pg_indexes 
WHERE indexname IN (
  'idx_forum_users_online',
  'idx_forum_users_reputation',
  'idx_threads_category_pinned_reply',
  'idx_profile_customizations_user',
  'idx_threads_author',
  'idx_threads_last_reply',
  'idx_posts_thread_created',
  'idx_posts_author'
);

-- Detailed index list
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 2. CHECK MATERIALIZED VIEW
-- ============================================
SELECT 
  '✓ Leaderboard Cache' as status,
  COUNT(*) as cached_users,
  (SELECT username FROM leaderboard_cache ORDER BY reputation DESC LIMIT 1) as top_user
FROM leaderboard_cache;

-- ============================================
-- 3. CHECK ONLINE USERS CACHE
-- ============================================
SELECT 
  '✓ Online Users Cache' as status,
  count as online_count,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
FROM online_users_cache;

-- ============================================
-- 4. CHECK FUNCTIONS
-- ============================================
SELECT 
  '✓ Functions Created' as status,
  COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'refresh_leaderboard_cache',
    'update_online_users_cache',
    'trigger_update_online_cache'
  );

-- ============================================
-- 5. CHECK TRIGGERS
-- ============================================
SELECT 
  '✓ Triggers' as status,
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'update_online_cache_trigger';

-- ============================================
-- 6. TEST INDEX USAGE
-- ============================================
-- Explain plan for online users query (should use idx_forum_users_online)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM forum_users 
WHERE is_online = true 
ORDER BY reputation DESC 
LIMIT 20;

-- Explain plan for leaderboard query (should use idx_forum_users_reputation)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM forum_users 
ORDER BY reputation DESC 
LIMIT 10;

-- Explain plan for thread listing (should use idx_threads_category_pinned_reply)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM threads 
WHERE category_id = (SELECT id FROM categories LIMIT 1)
ORDER BY is_pinned DESC, last_reply_at DESC 
LIMIT 20;

-- ============================================
-- 7. CHECK TABLE STATISTICS
-- ============================================
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename IN ('forum_users', 'threads', 'posts', 'profile_customizations')
ORDER BY tablename;

-- ============================================
-- 8. CHECK INDEX USAGE STATISTICS
-- ============================================
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- ============================================
-- 9. CHECK CACHE HIT RATIO
-- ============================================
SELECT 
  'Cache Hit Ratio' as metric,
  ROUND(
    100.0 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0),
    2
  ) as percentage
FROM pg_statio_user_tables
WHERE schemaname = 'public';

-- ============================================
-- 10. PERFORMANCE COMPARISON
-- ============================================
-- Run these queries and compare timing

-- Before optimization (simulated without index)
SET enable_indexscan = off;
EXPLAIN ANALYZE SELECT * FROM forum_users WHERE is_online = true LIMIT 20;
SET enable_indexscan = on;

-- After optimization (with index)
EXPLAIN ANALYZE SELECT * FROM forum_users WHERE is_online = true LIMIT 20;

-- ============================================
-- 11. SUMMARY REPORT
-- ============================================
SELECT 
  'OPTIMIZATION SUMMARY' as report,
  (SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_%' AND schemaname = 'public') as indexes_created,
  (SELECT COUNT(*) FROM leaderboard_cache) as leaderboard_cached,
  (SELECT count FROM online_users_cache) as online_users_cached,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
   WHERE n.nspname = 'public' AND p.proname LIKE '%cache%') as cache_functions,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE '%cache%') as cache_triggers;

-- ============================================
-- 12. RECOMMENDATIONS
-- ============================================
-- Check for missing indexes on foreign keys
SELECT 
  'Missing FK Index?' as warning,
  conrelid::regclass as table_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace
  AND NOT EXISTS (
    SELECT 1 FROM pg_index
    WHERE indrelid = conrelid
    AND indkey::text = conkey::text
  );

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 
  '✅ VERIFICATION COMPLETE' as status,
  'All optimizations have been verified. Check the results above.' as message;
