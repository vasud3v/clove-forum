-- ============================================================================
-- Apply Real-Time Triggers for Automatic Count Updates
-- ============================================================================
-- This script creates database triggers to automatically update counts
-- when data changes, ensuring real-time synchronization.
-- ============================================================================

-- ============================================================================
-- 1. CATEGORY COUNT TRIGGERS
-- ============================================================================

-- Function to update category thread count
CREATE OR REPLACE FUNCTION update_category_thread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment thread count for the category
    UPDATE categories
    SET thread_count = thread_count + 1,
        last_activity = NEW.created_at
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement thread count for the category
    UPDATE categories
    SET thread_count = GREATEST(thread_count - 1, 0)
    WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle category change
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      -- Decrement old category
      UPDATE categories
      SET thread_count = GREATEST(thread_count - 1, 0)
      WHERE id = OLD.category_id;
      -- Increment new category
      UPDATE categories
      SET thread_count = thread_count + 1,
          last_activity = NEW.created_at
      WHERE id = NEW.category_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for category thread count
DROP TRIGGER IF EXISTS trigger_update_category_thread_count ON threads;
CREATE TRIGGER trigger_update_category_thread_count
AFTER INSERT OR UPDATE OR DELETE ON threads
FOR EACH ROW
EXECUTE FUNCTION update_category_thread_count();

-- Function to update category post count
CREATE OR REPLACE FUNCTION update_category_post_count()
RETURNS TRIGGER AS $$
DECLARE
  category_id_var TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get category_id from thread
    SELECT category_id INTO category_id_var
    FROM threads
    WHERE id = NEW.thread_id;
    
    IF category_id_var IS NOT NULL THEN
      UPDATE categories
      SET post_count = post_count + 1,
          last_activity = NEW.created_at
      WHERE id = category_id_var;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get category_id from thread
    SELECT category_id INTO category_id_var
    FROM threads
    WHERE id = OLD.thread_id;
    
    IF category_id_var IS NOT NULL THEN
      UPDATE categories
      SET post_count = GREATEST(post_count - 1, 0)
      WHERE id = category_id_var;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for category post count
DROP TRIGGER IF EXISTS trigger_update_category_post_count ON posts;
CREATE TRIGGER trigger_update_category_post_count
AFTER INSERT OR DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_category_post_count();

-- ============================================================================
-- 2. TOPIC COUNT TRIGGERS
-- ============================================================================

-- Function to update topic thread count
CREATE OR REPLACE FUNCTION update_topic_thread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.topic_id IS NOT NULL THEN
      UPDATE topics
      SET thread_count = thread_count + 1,
          last_activity = NEW.created_at,
          last_post_by = NEW.author_id
      WHERE id = NEW.topic_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.topic_id IS NOT NULL THEN
      UPDATE topics
      SET thread_count = GREATEST(thread_count - 1, 0)
      WHERE id = OLD.topic_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle topic change
    IF OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
      IF OLD.topic_id IS NOT NULL THEN
        UPDATE topics
        SET thread_count = GREATEST(thread_count - 1, 0)
        WHERE id = OLD.topic_id;
      END IF;
      IF NEW.topic_id IS NOT NULL THEN
        UPDATE topics
        SET thread_count = thread_count + 1,
            last_activity = NEW.last_reply_at,
            last_post_by = NEW.last_reply_by_id
        WHERE id = NEW.topic_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for topic thread count
DROP TRIGGER IF EXISTS trigger_update_topic_thread_count ON threads;
CREATE TRIGGER trigger_update_topic_thread_count
AFTER INSERT OR UPDATE OR DELETE ON threads
FOR EACH ROW
EXECUTE FUNCTION update_topic_thread_count();

-- Function to update topic post count
CREATE OR REPLACE FUNCTION update_topic_post_count()
RETURNS TRIGGER AS $$
DECLARE
  topic_id_var TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get topic_id from thread
    SELECT topic_id INTO topic_id_var
    FROM threads
    WHERE id = NEW.thread_id;
    
    IF topic_id_var IS NOT NULL THEN
      UPDATE topics
      SET post_count = post_count + 1,
          last_activity = NEW.created_at,
          last_post_by = NEW.author_id
      WHERE id = topic_id_var;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Get topic_id from thread
    SELECT topic_id INTO topic_id_var
    FROM threads
    WHERE id = OLD.thread_id;
    
    IF topic_id_var IS NOT NULL THEN
      UPDATE topics
      SET post_count = GREATEST(post_count - 1, 0)
      WHERE id = topic_id_var;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for topic post count
DROP TRIGGER IF EXISTS trigger_update_topic_post_count ON posts;
CREATE TRIGGER trigger_update_topic_post_count
AFTER INSERT OR DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_topic_post_count();

-- ============================================================================
-- 3. USER POST COUNT TRIGGER
-- ============================================================================

-- Function to update user post count
CREATE OR REPLACE FUNCTION update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_users
    SET post_count = post_count + 1
    WHERE id = NEW.author_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_users
    SET post_count = GREATEST(post_count - 1, 0)
    WHERE id = OLD.author_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user post count
DROP TRIGGER IF EXISTS trigger_update_user_post_count ON posts;
CREATE TRIGGER trigger_update_user_post_count
AFTER INSERT OR DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_user_post_count();

-- ============================================================================
-- 4. THREAD REPLY COUNT TRIGGER
-- ============================================================================

-- Function to update thread reply count and last reply info
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE threads
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at,
        last_reply_by_id = NEW.author_id
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement reply count
    UPDATE threads
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.thread_id;
    
    -- Update last reply info to the most recent remaining post
    UPDATE threads t
    SET last_reply_at = COALESCE(
          (SELECT created_at FROM posts WHERE thread_id = OLD.thread_id ORDER BY created_at DESC LIMIT 1),
          t.created_at
        ),
        last_reply_by_id = COALESCE(
          (SELECT author_id FROM posts WHERE thread_id = OLD.thread_id ORDER BY created_at DESC LIMIT 1),
          t.author_id
        )
    WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for thread reply count
DROP TRIGGER IF EXISTS trigger_update_thread_reply_count ON posts;
CREATE TRIGGER trigger_update_thread_reply_count
AFTER INSERT OR DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_thread_reply_count();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All real-time triggers have been created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'The following triggers are now active:';
  RAISE NOTICE '  • trigger_update_category_thread_count';
  RAISE NOTICE '  • trigger_update_category_post_count';
  RAISE NOTICE '  • trigger_update_topic_thread_count';
  RAISE NOTICE '  • trigger_update_topic_post_count';
  RAISE NOTICE '  • trigger_update_user_post_count';
  RAISE NOTICE '  • trigger_update_thread_reply_count';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Counts will now update automatically in real-time!';
END $$;
