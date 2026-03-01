-- Ensure RLS is enabled on topics table
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "topics_select" ON public.topics;
DROP POLICY IF EXISTS "topics_insert" ON public.topics;
DROP POLICY IF EXISTS "topics_update" ON public.topics;
DROP POLICY IF EXISTS "topics_delete" ON public.topics;

-- Allow everyone to read topics
CREATE POLICY "topics_select" 
ON public.topics 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert topics (can be restricted to admins later)
CREATE POLICY "topics_insert" 
ON public.topics 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update topics (can be restricted to admins later)
CREATE POLICY "topics_update" 
ON public.topics 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete topics (can be restricted to admins later)
CREATE POLICY "topics_delete" 
ON public.topics 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Verify cascade delete is set up correctly
-- This ensures when a topic is deleted, related threads are handled properly
DO $$ 
BEGIN
  -- Check if the constraint exists and has CASCADE
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.referential_constraints 
    WHERE constraint_name = 'threads_topic_id_fkey' 
    AND delete_rule = 'CASCADE'
  ) THEN
    -- Drop and recreate with CASCADE if needed
    ALTER TABLE public.threads 
      DROP CONSTRAINT IF EXISTS threads_topic_id_fkey;
    
    ALTER TABLE public.threads
      ADD CONSTRAINT threads_topic_id_fkey 
      FOREIGN KEY (topic_id) 
      REFERENCES public.topics(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.topics IS 'Forum topics (subcategories). Deleting a topic will cascade delete all related threads.';
