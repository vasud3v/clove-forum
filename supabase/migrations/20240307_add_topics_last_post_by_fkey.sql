-- ============================================================================
-- Add foreign key constraint for topics.last_post_by
-- ============================================================================

-- Add foreign key constraint to link last_post_by to forum_users
ALTER TABLE public.topics
ADD CONSTRAINT topics_last_post_by_fkey
FOREIGN KEY (last_post_by)
REFERENCES public.forum_users(id)
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_topics_last_post_by ON public.topics(last_post_by);
