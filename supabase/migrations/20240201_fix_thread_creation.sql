-- ============================================================================
-- FIX THREAD CREATION ISSUES
-- ============================================================================
-- This migration fixes all known issues with thread creation
-- ============================================================================

-- 1. Ensure banner column exists with proper configuration
DO $$ 
BEGIN
  -- Add banner column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'threads' 
    AND column_name = 'banner'
  ) THEN
    ALTER TABLE public.threads ADD COLUMN banner TEXT;
    RAISE NOTICE 'Added banner column to threads table';
  END IF;
  
  -- Ensure it allows NULL and has default
  ALTER TABLE public.threads ALTER COLUMN banner SET DEFAULT NULL;
  ALTER TABLE public.threads ALTER COLUMN banner DROP NOT NULL;
END $$;

-- 2. Add constraints for data integrity
DO $$
BEGIN
  -- Title length constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'threads_title_length_check'
  ) THEN
    ALTER TABLE public.threads 
    ADD CONSTRAINT threads_title_length_check 
    CHECK (char_length(title) >= 5 AND char_length(title) <= 200);
    RAISE NOTICE 'Added title length constraint';
  END IF;

  -- Excerpt length constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'threads_excerpt_length_check'
  ) THEN
    ALTER TABLE public.threads 
    ADD CONSTRAINT threads_excerpt_length_check 
    CHECK (excerpt IS NULL OR char_length(excerpt) <= 200);
    RAISE NOTICE 'Added excerpt length constraint';
  END IF;

  -- Tags array size constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'threads_tags_count_check'
  ) THEN
    ALTER TABLE public.threads 
    ADD CONSTRAINT threads_tags_count_check 
    CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10);
    RAISE NOTICE 'Added tags count constraint';
  END IF;
END $$;

-- 3. Add constraint for posts content
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'posts_content_length_check'
  ) THEN
    ALTER TABLE public.posts 
    ADD CONSTRAINT posts_content_length_check 
    CHECK (char_length(content) >= 1 AND char_length(content) <= 50000);
    RAISE NOTICE 'Added posts content length constraint';
  END IF;
END $$;

-- 4. Create index for better performance on thread lookups
CREATE INDEX IF NOT EXISTS idx_threads_category_created 
ON public.threads(category_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_threads_topic 
ON public.threads(topic_id) 
WHERE topic_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_threads_tags 
ON public.threads USING GIN(tags);

-- 5. Update RLS policies for better security
DROP POLICY IF EXISTS "threads_select" ON public.threads;
CREATE POLICY "threads_select" 
ON public.threads 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "threads_insert" ON public.threads;
CREATE POLICY "threads_insert"
ON public.threads 
FOR INSERT
WITH CHECK (
  auth.uid()::text = author_id
);

DROP POLICY IF EXISTS "threads_update" ON public.threads;
CREATE POLICY "threads_update"
ON public.threads 
FOR UPDATE
USING (
  auth.uid()::text = author_id
);

DROP POLICY IF EXISTS "threads_delete" ON public.threads;
CREATE POLICY "threads_delete"
ON public.threads 
FOR DELETE
USING (
  auth.uid()::text = author_id
);

-- 6. Ensure posts RLS policies are correct
DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select" 
ON public.posts 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert"
ON public.posts 
FOR INSERT
WITH CHECK (auth.uid()::text = author_id);

DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update"
ON public.posts 
FOR UPDATE
USING (auth.uid()::text = author_id);

DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_delete"
ON public.posts 
FOR DELETE
USING (auth.uid()::text = author_id);

-- 7. Create function to validate topic belongs to category
CREATE OR REPLACE FUNCTION public.validate_thread_topic()
RETURNS TRIGGER AS $$
BEGIN
  -- If topic_id is provided, verify it belongs to the category
  IF NEW.topic_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.topics 
      WHERE id = NEW.topic_id 
      AND category_id = NEW.category_id
    ) THEN
      RAISE EXCEPTION 'Topic does not belong to the selected category';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for topic validation
DROP TRIGGER IF EXISTS validate_thread_topic_trigger ON public.threads;
CREATE TRIGGER validate_thread_topic_trigger
  BEFORE INSERT OR UPDATE ON public.threads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_thread_topic();

-- 8. Create function to auto-update category stats
CREATE OR REPLACE FUNCTION public.update_category_stats_on_thread()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment thread count and post count
    UPDATE public.categories 
    SET 
      thread_count = thread_count + 1,
      post_count = post_count + 1,
      last_activity = NEW.created_at
    WHERE id = NEW.category_id;
    
    -- Update topic stats if applicable
    IF NEW.topic_id IS NOT NULL THEN
      UPDATE public.topics
      SET
        thread_count = thread_count + 1,
        post_count = post_count + 1,
        last_activity = NEW.created_at
      WHERE id = NEW.topic_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement thread count
    UPDATE public.categories 
    SET thread_count = GREATEST(0, thread_count - 1)
    WHERE id = OLD.category_id;
    
    -- Update topic stats if applicable
    IF OLD.topic_id IS NOT NULL THEN
      UPDATE public.topics
      SET thread_count = GREATEST(0, thread_count - 1)
      WHERE id = OLD.topic_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for category stats
DROP TRIGGER IF EXISTS update_category_stats_trigger ON public.threads;
CREATE TRIGGER update_category_stats_trigger
  AFTER INSERT OR DELETE ON public.threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_category_stats_on_thread();

-- 9. Verify foreign key constraints
DO $$
BEGIN
  -- Ensure category foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'threads_category_id_fkey'
    AND table_name = 'threads'
  ) THEN
    ALTER TABLE public.threads
    ADD CONSTRAINT threads_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES public.categories(id)
    ON DELETE CASCADE;
  END IF;

  -- Ensure author foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'threads_author_id_fkey'
    AND table_name = 'threads'
  ) THEN
    ALTER TABLE public.threads
    ADD CONSTRAINT threads_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.forum_users(id)
    ON DELETE CASCADE;
  END IF;

  -- Ensure topic foreign key exists with proper cascade
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'threads_topic_id_fkey'
    AND table_name = 'threads'
  ) THEN
    ALTER TABLE public.threads
    ADD CONSTRAINT threads_topic_id_fkey
    FOREIGN KEY (topic_id) REFERENCES public.topics(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- 10. Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Thread creation fixes applied successfully!';
  RAISE NOTICE '✓ Banner column configured';
  RAISE NOTICE '✓ Data integrity constraints added';
  RAISE NOTICE '✓ RLS policies updated';
  RAISE NOTICE '✓ Validation triggers created';
  RAISE NOTICE '✓ Category stats auto-update enabled';
END $$;
