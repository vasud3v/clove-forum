-- ============================================================================
-- Fix category thread and post counts
-- ============================================================================

-- Recalculate thread_count for all categories based on actual threads
UPDATE categories c
SET thread_count = COALESCE(thread_counts.count, 0)
FROM (
  SELECT category_id, COUNT(*) as count
  FROM threads
  GROUP BY category_id
) AS thread_counts
WHERE c.id = thread_counts.category_id;make sure 

-- Set thread_count to 0 for categories with no threads
UPDATE categories
SET thread_count = 0
WHERE id NOT IN (
  SELECT DISTINCT category_id 
  FROM threads
);

-- Recalculate post_count for all categories based on actual posts
UPDATE categories c
SET post_count = COALESCE(post_counts.count, 0)
FROM (
  SELECT th.category_id, COUNT(p.id) as count
  FROM threads th
  LEFT JOIN posts p ON p.thread_id = th.id
  GROUP BY th.category_id
) AS post_counts
WHERE c.id = post_counts.category_id;

-- Set post_count to 0 for categories with no posts
UPDATE categories
SET post_count = 0
WHERE id NOT IN (
  SELECT DISTINCT th.category_id 
  FROM threads th
  INNER JOIN posts p ON p.thread_id = th.id
);

-- Create function to update category counts when threads are added/removed
CREATE OR REPLACE FUNCTION update_category_thread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment thread count for the category
    UPDATE categories
    SET thread_count = thread_count + 1
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
      SET thread_count = thread_count + 1
      WHERE id = NEW.category_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for category thread count updates
DROP TRIGGER IF EXISTS trigger_update_category_thread_count ON threads;
CREATE TRIGGER trigger_update_category_thread_count
AFTER INSERT OR UPDATE OR DELETE ON threads
FOR EACH ROW
EXECUTE FUNCTION update_category_thread_count();

-- Create function to update category post count when posts are added/removed
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
      SET post_count = post_count + 1
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
$$ LANGUAGE plpgsql;

-- Create trigger for category post count updates
DROP TRIGGER IF EXISTS trigger_update_category_post_count ON posts;
CREATE TRIGGER trigger_update_category_post_count
AFTER INSERT OR DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_category_post_count();

-- Verify the counts
DO $$
DECLARE
  category_record RECORD;
BEGIN
  RAISE NOTICE 'Category counts after update:';
  FOR category_record IN 
    SELECT name, thread_count, post_count 
    FROM categories 
    ORDER BY name
  LOOP
    RAISE NOTICE '  % - Threads: %, Posts: %', 
      category_record.name, 
      category_record.thread_count, 
      category_record.post_count;
  END LOOP;
END $$;
