-- ============================================================================
-- Fix topic thread and post counts
-- ============================================================================

-- Recalculate thread_count for all topics based on actual threads
UPDATE topics t
SET thread_count = COALESCE(thread_counts.count, 0)
FROM (
  SELECT topic_id, COUNT(*) as count
  FROM threads
  WHERE topic_id IS NOT NULL
  GROUP BY topic_id
) AS thread_counts
WHERE t.id = thread_counts.topic_id;

-- Set thread_count to 0 for topics with no threads
UPDATE topics
SET thread_count = 0
WHERE id NOT IN (
  SELECT DISTINCT topic_id 
  FROM threads 
  WHERE topic_id IS NOT NULL
);

-- Recalculate post_count for all topics based on actual posts
UPDATE topics t
SET post_count = COALESCE(post_counts.count, 0)
FROM (
  SELECT th.topic_id, COUNT(p.id) as count
  FROM threads th
  LEFT JOIN posts p ON p.thread_id = th.id
  WHERE th.topic_id IS NOT NULL
  GROUP BY th.topic_id
) AS post_counts
WHERE t.id = post_counts.topic_id;

-- Set post_count to 0 for topics with no posts
UPDATE topics
SET post_count = 0
WHERE id NOT IN (
  SELECT DISTINCT th.topic_id 
  FROM threads th
  INNER JOIN posts p ON p.thread_id = th.id
  WHERE th.topic_id IS NOT NULL
);

-- Create function to update topic counts when threads are added/removed
CREATE OR REPLACE FUNCTION update_topic_thread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment thread count for the topic
    IF NEW.topic_id IS NOT NULL THEN
      UPDATE topics
      SET thread_count = thread_count + 1
      WHERE id = NEW.topic_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement thread count for the topic
    IF OLD.topic_id IS NOT NULL THEN
      UPDATE topics
      SET thread_count = GREATEST(thread_count - 1, 0)
      WHERE id = OLD.topic_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle topic change
    IF OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
      -- Decrement old topic
      IF OLD.topic_id IS NOT NULL THEN
        UPDATE topics
        SET thread_count = GREATEST(thread_count - 1, 0)
        WHERE id = OLD.topic_id;
      END IF;
      -- Increment new topic
      IF NEW.topic_id IS NOT NULL THEN
        UPDATE topics
        SET thread_count = thread_count + 1
        WHERE id = NEW.topic_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for thread count updates
DROP TRIGGER IF EXISTS trigger_update_topic_thread_count ON threads;
CREATE TRIGGER trigger_update_topic_thread_count
AFTER INSERT OR UPDATE OR DELETE ON threads
FOR EACH ROW
EXECUTE FUNCTION update_topic_thread_count();

-- Create function to update topic post count when posts are added/removed
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
      SET post_count = post_count + 1
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
$$ LANGUAGE plpgsql;

-- Create trigger for post count updates
DROP TRIGGER IF EXISTS trigger_update_topic_post_count ON posts;
CREATE TRIGGER trigger_update_topic_post_count
AFTER INSERT OR DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_topic_post_count();

-- Verify the counts
DO $$
DECLARE
  topic_record RECORD;
BEGIN
  RAISE NOTICE 'Topic counts after update:';
  FOR topic_record IN 
    SELECT name, thread_count, post_count 
    FROM topics 
    ORDER BY name
  LOOP
    RAISE NOTICE '  % - Threads: %, Posts: %', 
      topic_record.name, 
      topic_record.thread_count, 
      topic_record.post_count;
  END LOOP;
END $$;
