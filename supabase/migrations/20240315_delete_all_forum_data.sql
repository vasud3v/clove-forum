-- Delete all forum data
-- WARNING: This will permanently delete all categories, topics, threads, and posts!

-- Disable RLS temporarily for deletion
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Delete all data (in order due to foreign keys)
DELETE FROM public.post_reactions;
DELETE FROM public.post_votes;
DELETE FROM public.thread_votes;
DELETE FROM public.posts;
DELETE FROM public.threads;
DELETE FROM public.topics;
DELETE FROM public.categories;

-- Re-enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Reset sequences if needed
-- (Optional: uncomment if you want IDs to start from 1 again)
-- ALTER SEQUENCE IF EXISTS categories_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS topics_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS threads_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS posts_id_seq RESTART WITH 1;
