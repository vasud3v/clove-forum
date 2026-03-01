-- Minimal Database Performance Optimization
-- Run this in Supabase SQL Editor if the full script has issues

-- First, drop any old duplicate indexes
DROP INDEX IF EXISTS idx_posts_author_id;
DROP INDEX IF EXISTS idx_posts_thread_id_created_at;
DROP INDEX IF EXISTS idx_threads_last_reply_by_id;

-- Create indexes (safe - will skip if exists)
CREATE INDEX IF NOT EXISTS idx_forum_users_online ON forum_users(is_online, reputation DESC) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_forum_users_reputation ON forum_users(reputation DESC);
CREATE INDEX IF NOT EXISTS idx_threads_category_pinned_reply ON threads(category_id, is_pinned DESC, last_reply_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_customizations_user ON profile_customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_author ON threads(author_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_reply ON threads(last_reply_by_id);
CREATE INDEX IF NOT EXISTS idx_posts_thread_created ON posts(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);

-- Analyze tables
ANALYZE forum_users;
ANALYZE threads;
ANALYZE posts;
ANALYZE profile_customizations;

-- Done! The indexes are now active and will improve query performance.
-- The application code already has caching implemented.
