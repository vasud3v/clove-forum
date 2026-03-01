-- ============================================================================
-- Fix Post Delete RLS Policy (Optimized for Performance)
-- ============================================================================
-- Allow users to delete their own posts (not just staff)

DROP POLICY IF EXISTS "posts_delete" ON public.posts;

CREATE POLICY "posts_delete" 
ON public.posts 
FOR DELETE
USING (
  (SELECT auth.uid())::text = author_id 
  OR 
  public.is_staff((SELECT auth.uid())::text)
);

-- ============================================================================
-- Fix Thread Delete RLS Policy (Optional)
-- ============================================================================
-- Uncomment if you also want users to delete their own threads
-- Currently only staff can delete threads

/*
DROP POLICY IF EXISTS "threads_delete" ON public.threads;

CREATE POLICY "threads_delete" 
ON public.threads 
FOR DELETE
USING (
  auth.uid()::text = author_id 
  OR 
  public.is_staff(auth.uid()::text)
);
*/
