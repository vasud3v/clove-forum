-- ============================================================================
-- Query Performance Optimization
-- ============================================================================
-- Addresses top slow queries from pg_stat_statements:
-- 1. forum_users WHERE is_online queries (335ms avg)
-- 2. forum_users ORDER BY reputation queries  
-- 3. profile_customizations lookups (already PK-indexed, analyze needed)
-- 4. Composite index for common forum_users query patterns
-- ============================================================================


-- ============================================================================
-- 1. forum_users indexes for is_online and reputation
-- These are the top slow queries (queries #3, #4, #14, #15, #17 in stats)
-- ============================================================================

-- Partial index: only index online users (most queries filter is_online = true)
-- This is more efficient than a full boolean index
CREATE INDEX IF NOT EXISTS idx_forum_users_online_true
ON public.forum_users(is_online)
WHERE is_online = true;

-- Full index for is_online (covers is_online = false queries too)
CREATE INDEX IF NOT EXISTS idx_forum_users_is_online
ON public.forum_users(is_online);

-- Reputation ordering index (queries #4, #10 sort by reputation DESC)
CREATE INDEX IF NOT EXISTS idx_forum_users_reputation
ON public.forum_users(reputation DESC);

-- Composite: is_online + reputation (query #4: WHERE is_online = $1 ORDER BY reputation DESC)
CREATE INDEX IF NOT EXISTS idx_forum_users_online_reputation
ON public.forum_users(is_online, reputation DESC);


-- ============================================================================
-- 2. Threads composite index for category listing with joins
-- Query #11 is a complex threads query with author/last_reply_by joins
-- ============================================================================

-- Already have idx_threads_category_pinned_reply, but add one covering last_reply_at
CREATE INDEX IF NOT EXISTS idx_threads_category_last_reply
ON public.threads(category_id, last_reply_at DESC);

-- Drop duplicate author index (idx_threads_author already exists)
DROP INDEX IF EXISTS idx_threads_author_id;


-- ============================================================================
-- 3. Posts with author join optimization
-- Query #19 is posts for a thread with author lateral join
-- ============================================================================

-- Composite index for posts ordered by created_at within a thread
-- (idx_posts_thread_id_created_at may already exist, IF NOT EXISTS handles it)
CREATE INDEX IF NOT EXISTS idx_posts_thread_created
ON public.posts(thread_id, created_at ASC);


-- ============================================================================
-- 4. Analyze all affected tables to update query planner statistics
-- This helps PostgreSQL choose the correct indexes
-- ============================================================================

ANALYZE public.forum_users;
ANALYZE public.profile_customizations;
ANALYZE public.threads;
ANALYZE public.posts;
ANALYZE public.categories;
ANALYZE public.topics;
ANALYZE public.notifications;
