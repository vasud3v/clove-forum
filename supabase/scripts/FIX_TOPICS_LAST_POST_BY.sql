-- ============================================================================
-- Fix topics.last_post_by to show username instead of UUID
-- ============================================================================

-- Add foreign key constraint to link last_post_by to forum_users
ALTER TABLE public.topics
DROP CONSTRAINT IF EXISTS topics_last_post_by_fkey;

ALTER TABLE public.topics
ADD CONSTRAINT topics_last_post_by_fkey
FOREIGN KEY (last_post_by)
REFERENCES public.forum_users(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_topics_last_post_by ON public.topics(last_post_by);

-- Verify the constraint was created
SELECT 
  'Foreign key constraint created' as status,
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table
FROM pg_constraint
WHERE conname = 'topics_last_post_by_fkey';
