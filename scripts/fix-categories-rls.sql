-- ============================================================================
-- Fix Categories RLS Policy
-- ============================================================================
-- This script fixes the RLS policy for categories to allow authenticated users
-- to create categories (useful for development/testing)
-- Also fixes performance warnings by using (select auth.uid())
-- For production, you may want to keep the admin-only restriction

-- Drop existing policies
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;

-- OPTION 1: Development - Allow any authenticated user (RECOMMENDED FOR NOW)
-- This fixes the RLS violation error you're experiencing

CREATE POLICY "categories_insert" ON public.categories 
  FOR INSERT 
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "categories_update" ON public.categories 
  FOR UPDATE 
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "categories_delete" ON public.categories 
  FOR DELETE 
  USING ((select auth.uid()) IS NOT NULL);

-- OPTION 2: Production - Admin only (uncomment when ready)
-- First, make sure you have admin role by running:
-- UPDATE public.forum_users SET role = 'admin' WHERE id = 'your-user-id';
/*
CREATE POLICY "categories_insert" ON public.categories 
  FOR INSERT 
  WITH CHECK (public.is_admin_or_supermod((select auth.uid())::text));

CREATE POLICY "categories_update" ON public.categories 
  FOR UPDATE 
  USING (public.is_admin_or_supermod((select auth.uid())::text));

CREATE POLICY "categories_delete" ON public.categories 
  FOR DELETE 
  USING (public.is_admin_or_supermod((select auth.uid())::text));
*/
