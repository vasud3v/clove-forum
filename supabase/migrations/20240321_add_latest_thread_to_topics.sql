-- ============================================================================
-- Add latest thread info to topics table
-- ============================================================================

-- Add columns for latest thread information
ALTER TABLE public.topics
ADD COLUMN IF NOT EXISTS latest_thread_id TEXT,
ADD COLUMN IF NOT EXISTS latest_thread_title TEXT,
ADD COLUMN IF NOT EXISTS latest_thread_author_id TEXT;

-- Add foreign key constraints (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topics_latest_thread_fkey'
  ) THEN
    ALTER TABLE public.topics
    ADD CONSTRAINT topics_latest_thread_fkey
    FOREIGN KEY (latest_thread_id)
    REFERENCES public.threads(id)
    ON DELETE SET NULL;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topics_latest_thread_author_fkey'
  ) THEN
    ALTER TABLE public.topics
    ADD CONSTRAINT topics_latest_thread_author_fkey
    FOREIGN KEY (latest_thread_author_id)
    REFERENCES public.forum_users(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topics_latest_thread ON public.topics(latest_thread_id);
CREATE INDEX IF NOT EXISTS idx_topics_latest_thread_author ON public.topics(latest_thread_author_id);

-- Function to update topic's latest thread when a thread is created
CREATE OR REPLACE FUNCTION update_topic_latest_thread()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.topic_id IS NOT NULL THEN
    UPDATE topics
    SET 
      latest_thread_id = NEW.id,
      latest_thread_title = NEW.title,
      latest_thread_author_id = NEW.author_id,
      last_activity = NEW.created_at
    WHERE id = NEW.topic_id
    AND (latest_thread_id IS NULL OR NEW.created_at > last_activity);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update latest thread on thread creation
DROP TRIGGER IF EXISTS trigger_update_topic_latest_thread ON threads;
CREATE TRIGGER trigger_update_topic_latest_thread
AFTER INSERT ON threads
FOR EACH ROW
EXECUTE FUNCTION update_topic_latest_thread();

-- One-time fix: Update existing topics with their latest thread
UPDATE topics t
SET 
  latest_thread_id = latest.id,
  latest_thread_title = latest.title,
  latest_thread_author_id = latest.author_id
FROM (
  SELECT DISTINCT ON (topic_id)
    topic_id,
    id,
    title,
    author_id,
    created_at
  FROM threads
  WHERE topic_id IS NOT NULL
  ORDER BY topic_id, created_at DESC
) AS latest
WHERE t.id = latest.topic_id;

-- Verify the update worked
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count FROM topics WHERE latest_thread_id IS NOT NULL;
  RAISE NOTICE 'Updated % topics with latest thread information', updated_count;
END $$;
