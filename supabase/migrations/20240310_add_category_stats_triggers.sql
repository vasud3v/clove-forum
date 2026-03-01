-- ============================================================================
-- Add Category Stats Auto-Update Triggers
-- ============================================================================
-- This migration creates triggers to automatically update category statistics
-- (thread_count, post_count, last_activity) when threads and posts change.

-- ============================================================================
-- Function: Update category stats when thread is created/deleted/moved
-- ============================================================================
CREATE OR REPLACE FUNCTION update_category_thread_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment thread count and update last activity
    UPDATE categories
    SET 
      thread_count = thread_count + 1,
      last_activity = NEW.created_at
    WHERE id = NEW.category_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement thread count
    UPDATE categories
    SET thread_count = GREATEST(thread_count - 1, 0)
    WHERE id = OLD.category_id;
    
    -- Update last_activity to the most recent thread in this category
    UPDATE categories c
    SET last_activity = COALESCE(
      (SELECT MAX(last_reply_at) FROM threads WHERE category_id = c.id),
      c.last_activity
    )
    WHERE id = OLD.category_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- If thread moved to different category
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      -- Decrement old category
      UPDATE categories
      SET thread_count = GREATEST(thread_count - 1, 0)
      WHERE id = OLD.category_id;
      
      -- Increment new category
      UPDATE categories
      SET 
        thread_count = thread_count + 1,
        last_activity = NEW.last_reply_at
      WHERE id = NEW.category_id;
    END IF;
    
    -- Update last_activity if thread was updated
    IF NEW.last_reply_at > OLD.last_reply_at THEN
      UPDATE categories
      SET last_activity = NEW.last_reply_at
      WHERE id = NEW.category_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- Function: Update category post count when post is created/deleted
-- ============================================================================
CREATE OR REPLACE FUNCTION update_category_post_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id TEXT;
BEGIN
  -- Get the category_id from the thread
  IF TG_OP = 'INSERT' THEN
    SELECT category_id INTO v_category_id FROM threads WHERE id = NEW.thread_id;
    
    IF v_category_id IS NOT NULL THEN
      UPDATE categories
      SET 
        post_count = post_count + 1,
        last_activity = NEW.created_at
      WHERE id = v_category_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    SELECT category_id INTO v_category_id FROM threads WHERE id = OLD.thread_id;
    
    IF v_category_id IS NOT NULL THEN
      UPDATE categories
      SET post_count = GREATEST(post_count - 1, 0)
      WHERE id = v_category_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================================
-- Drop existing triggers if they exist
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_update_category_thread_stats ON threads;
DROP TRIGGER IF EXISTS trigger_update_category_post_stats ON posts;

-- ============================================================================
-- Create triggers
-- ============================================================================

-- Trigger for thread changes
CREATE TRIGGER trigger_update_category_thread_stats
  AFTER INSERT OR UPDATE OR DELETE ON threads
  FOR EACH ROW
  EXECUTE FUNCTION update_category_thread_stats();

-- Trigger for post changes
CREATE TRIGGER trigger_update_category_post_stats
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_category_post_stats();

-- ============================================================================
-- Recalculate all category stats from scratch (one-time fix)
-- ============================================================================
DO $$
DECLARE
  category_record RECORD;
  thread_count_val INTEGER;
  post_count_val INTEGER;
  last_activity_val TIMESTAMPTZ;
BEGIN
  RAISE NOTICE 'Recalculating category statistics...';
  
  FOR category_record IN SELECT id FROM categories LOOP
    -- Count threads in this category
    SELECT COUNT(*) INTO thread_count_val
    FROM threads
    WHERE category_id = category_record.id;
    
    -- Count posts in threads of this category
    SELECT COUNT(p.*) INTO post_count_val
    FROM posts p
    INNER JOIN threads t ON p.thread_id = t.id
    WHERE t.category_id = category_record.id;
    
    -- Get last activity
    SELECT MAX(last_reply_at) INTO last_activity_val
    FROM threads
    WHERE category_id = category_record.id;
    
    -- Update the category
    UPDATE categories
    SET 
      thread_count = COALESCE(thread_count_val, 0),
      post_count = COALESCE(post_count_val, 0),
      last_activity = COALESCE(last_activity_val, NOW())
    WHERE id = category_record.id;
    
    RAISE NOTICE 'Updated category %: % threads, % posts', 
      category_record.id, thread_count_val, post_count_val;
  END LOOP;
  
  RAISE NOTICE '✅ Category statistics recalculated successfully';
END $$;
