-- ============================================================================
-- Optimize Posts Delete RLS Policy
-- Fixes performance warning by using (SELECT auth.uid()) instead of auth.uid()
-- ============================================================================

DROP POLICY IF EXISTS "posts_delete" ON public.posts;

CREATE POLICY "posts_delete" 
ON public.posts 
FOR DELETE
USING (
  (SELECT auth.uid())::text = author_id 
  OR 
  public.is_staff((SELECT auth.uid())::text)
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
