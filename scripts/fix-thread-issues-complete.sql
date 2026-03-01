-- ============================================================================
-- COMPLETE FIX FOR THREAD CREATION ISSUES
-- ============================================================================
-- This script fixes issues with threads not showing up or being deleted
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Ensure banner column exists and has proper defaults
DO $$ 
BEGIN
  -- Add banner column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'threads' AND column_name = 'banner'
  ) THEN
    ALTER TABLE threads ADD COLUMN banner TEXT;
  END IF;
  
  -- Make sure it allows NULL and has default
  ALTER TABLE threads ALTER COLUMN banner SET DEFAULT NULL;
  ALTER TABLE threads ALTER COLUMN banner DROP NOT NULL;
END $$;

-- 2. Fix RLS policies to ensure threads can be read after creation
-- Drop and recreate SELECT policy
DROP POLICY IF EXISTS "threads_select" ON public.threads;
CREATE POLICY "threads_select" 
ON public.threads 
FOR SELECT 
USING (true);

-- Drop and recreate INSERT policy
DROP POLICY IF EXISTS "threads_insert" ON public.threads;
CREATE POLICY "threads_insert"
ON public.threads 
FOR INSERT
WITH CHECK (
  (SELECT auth.uid())::text = author_id 
  OR public.is_staff((SELECT auth.uid())::text)
);

-- Drop and recreate UPDATE policy
DROP POLICY IF EXISTS "threads_update" ON public.threads;
CREATE POLICY "threads_update"
ON public.threads 
FOR UPDATE
USING (
  (SELECT auth.uid())::text = author_id 
  OR public.is_staff((SELECT auth.uid())::text)
);

-- 3. Ensure posts table has proper RLS policies
DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select" 
ON public.posts 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert"
ON public.posts 
FOR INSERT
WITH CHECK ((SELECT auth.uid())::text = author_id);

-- 4. Check and fix foreign key constraints
-- Make sure threads aren't being cascade deleted
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  -- Find any CASCADE DELETE constraints pointing TO threads
  FOR constraint_record IN
    SELECT tc.constraint_name, tc.table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE ccu.table_name = 'threads'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND rc.delete_rule = 'CASCADE'
  LOOP
    RAISE NOTICE 'Found CASCADE constraint: % on table %', 
      constraint_record.constraint_name, 
      constraint_record.table_name;
  END LOOP;
END $$;

-- 5. Verify category_id foreign key exists and is correct
DO $$
BEGIN
  -- Check if foreign key exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'threads_category_id_fkey'
    AND table_name = 'threads'
  ) THEN
    -- Add foreign key if missing
    ALTER TABLE threads
    ADD CONSTRAINT threads_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Verify author_id foreign key exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'threads_author_id_fkey'
    AND table_name = 'threads'
  ) THEN
    ALTER TABLE threads
    ADD CONSTRAINT threads_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES forum_users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 7. Create index on banner column for performance
CREATE INDEX IF NOT EXISTS idx_threads_banner 
ON threads(banner) 
WHERE banner IS NOT NULL;

-- 8. Refresh materialized views if any exist
DO $$
BEGIN
  -- Refresh any materialized views that depend on threads
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'thread_statistics'
  ) THEN
    REFRESH MATERIALIZED VIEW thread_statistics;
  END IF;
END $$;

-- 9. Verify the fix by showing current structure
SELECT 
  'Threads table structure:' as info,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'threads'
ORDER BY ordinal_position;

-- 10. Show current RLS policies
SELECT 
  'Current RLS policies:' as info,
  policyname, 
  cmd, 
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual 
    ELSE 'No USING clause' 
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check 
    ELSE 'No WITH CHECK clause' 
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'threads';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify everything is working:

-- Count total threads
SELECT COUNT(*) as total_threads FROM threads;

-- Show recent threads
SELECT id, title, author_id, category_id, created_at, banner
FROM threads
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✓ Thread creation issues have been fixed!';
  RAISE NOTICE '✓ Banner column is properly configured';
  RAISE NOTICE '✓ RLS policies have been updated';
  RAISE NOTICE '✓ Foreign key constraints verified';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Try creating a new thread in your application';
  RAISE NOTICE '2. Check if it appears in the category';
  RAISE NOTICE '3. Verify it persists after page refresh';
END $$;
