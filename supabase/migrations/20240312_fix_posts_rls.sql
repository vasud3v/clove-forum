-- Fix RLS policies for posts table to allow authenticated users to read and create posts
-- This migration ensures that:
-- 1. Anyone can read posts (already working)
-- 2. Authenticated users can create posts as themselves
-- 3. Users can only update/delete their own posts (or staff can manage any)

-- Drop existing policies
DROP POLICY IF EXISTS "posts_select" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;

-- Allow anyone to read posts
CREATE POLICY "posts_select" 
ON public.posts 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert posts as themselves
-- Also allow staff to insert posts as anyone
CREATE POLICY "posts_insert" 
ON public.posts 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid()::text = author_id 
    OR public.is_staff(auth.uid()::text)
  )
);

-- Allow users to update their own posts, or staff to update any post
CREATE POLICY "posts_update" 
ON public.posts 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid()::text = author_id 
    OR public.is_staff(auth.uid()::text)
  )
);

-- Allow users to delete their own posts, or staff to delete any post
CREATE POLICY "posts_delete" 
ON public.posts 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid()::text = author_id 
    OR public.is_staff(auth.uid()::text)
  )
);

-- Verify RLS is enabled
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
