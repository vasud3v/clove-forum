-- Cleanup Duplicate Indexes
-- Run this to remove duplicate indexes and keep the better-named ones

-- Drop the old duplicate indexes (keeping the new ones we created)
DROP INDEX IF EXISTS idx_posts_author_id;
DROP INDEX IF EXISTS idx_posts_thread_id_created_at;
DROP INDEX IF EXISTS idx_threads_last_reply_by_id;

-- Verify duplicates are gone
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('posts', 'threads')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
