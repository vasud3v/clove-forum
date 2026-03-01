-- Fix CASCADE deletes for proper hierarchy cleanup
-- Category → Topic → Thread → Post

-- Drop existing foreign key constraint on threads.topic_id
ALTER TABLE public.threads 
  DROP CONSTRAINT IF EXISTS threads_topic_id_fkey;

-- Re-add with CASCADE delete
ALTER TABLE public.threads
  ADD CONSTRAINT threads_topic_id_fkey 
  FOREIGN KEY (topic_id) 
  REFERENCES public.topics(id) 
  ON DELETE CASCADE;

-- Ensure threads cascade from categories (should already exist, but let's be sure)
ALTER TABLE public.threads 
  DROP CONSTRAINT IF EXISTS threads_category_id_fkey;

ALTER TABLE public.threads
  ADD CONSTRAINT threads_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES public.categories(id) 
  ON DELETE CASCADE;

-- Ensure posts cascade from threads (should already exist)
ALTER TABLE public.posts 
  DROP CONSTRAINT IF EXISTS posts_thread_id_fkey;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_thread_id_fkey 
  FOREIGN KEY (thread_id) 
  REFERENCES public.threads(id) 
  ON DELETE CASCADE;

-- Ensure topics cascade from categories (should already exist)
ALTER TABLE public.topics 
  DROP CONSTRAINT IF EXISTS topics_category_id_fkey;

ALTER TABLE public.topics
  ADD CONSTRAINT topics_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES public.categories(id) 
  ON DELETE CASCADE;

-- Also ensure other related tables cascade properly

-- Post reactions should cascade when post is deleted
ALTER TABLE public.post_reactions 
  DROP CONSTRAINT IF EXISTS post_reactions_post_id_fkey;

ALTER TABLE public.post_reactions
  ADD CONSTRAINT post_reactions_post_id_fkey 
  FOREIGN KEY (post_id) 
  REFERENCES public.posts(id) 
  ON DELETE CASCADE;

-- Thread bookmarks should cascade when thread is deleted
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'thread_bookmarks') THEN
    ALTER TABLE public.thread_bookmarks 
      DROP CONSTRAINT IF EXISTS thread_bookmarks_thread_id_fkey;
    
    ALTER TABLE public.thread_bookmarks
      ADD CONSTRAINT thread_bookmarks_thread_id_fkey 
      FOREIGN KEY (thread_id) 
      REFERENCES public.threads(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Thread views should cascade when thread is deleted
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'thread_views') THEN
    ALTER TABLE public.thread_views 
      DROP CONSTRAINT IF EXISTS thread_views_thread_id_fkey;
    
    ALTER TABLE public.thread_views
      ADD CONSTRAINT thread_views_thread_id_fkey 
      FOREIGN KEY (thread_id) 
      REFERENCES public.threads(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Content reports should cascade when target is deleted
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_reports') THEN
    -- Note: We can't add CASCADE here because target_id is a TEXT field that could reference
    -- either threads or posts. This would need to be handled in application logic or triggers.
    -- For now, we'll leave it as is and handle cleanup in the application.
    NULL;
  END IF;
END $$;

-- Add a trigger to clean up orphaned content reports when threads/posts are deleted
CREATE OR REPLACE FUNCTION cleanup_orphaned_reports()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up reports for deleted threads
  IF TG_TABLE_NAME = 'threads' THEN
    DELETE FROM content_reports 
    WHERE target_type = 'thread' AND target_id = OLD.id;
  END IF;
  
  -- Clean up reports for deleted posts
  IF TG_TABLE_NAME = 'posts' THEN
    DELETE FROM content_reports 
    WHERE target_type = 'post' AND target_id = OLD.id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS cleanup_thread_reports ON public.threads;
DROP TRIGGER IF EXISTS cleanup_post_reports ON public.posts;

-- Create triggers for cleanup
CREATE TRIGGER cleanup_thread_reports
  BEFORE DELETE ON public.threads
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_reports();

CREATE TRIGGER cleanup_post_reports
  BEFORE DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_reports();

-- Summary comment
COMMENT ON CONSTRAINT threads_topic_id_fkey ON public.threads IS 
  'Cascade delete: When a topic is deleted, all its threads are deleted';

COMMENT ON CONSTRAINT threads_category_id_fkey ON public.threads IS 
  'Cascade delete: When a category is deleted, all its threads are deleted';

COMMENT ON CONSTRAINT posts_thread_id_fkey ON public.posts IS 
  'Cascade delete: When a thread is deleted, all its posts are deleted';

COMMENT ON CONSTRAINT topics_category_id_fkey ON public.topics IS 
  'Cascade delete: When a category is deleted, all its topics are deleted';
