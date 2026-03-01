-- Fix thread creation issues
-- This script ensures the banner column doesn't cause problems

-- 1. Make sure banner column allows NULL and has a default
ALTER TABLE threads 
ALTER COLUMN banner SET DEFAULT NULL;

-- 2. Check if there are any NOT NULL constraints that shouldn't be there
-- (This will show any columns that are NOT NULL)
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'threads' AND is_nullable = 'NO';

-- 3. Verify RLS policies allow thread creation
-- Show all policies on threads table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'threads';

-- 4. Check if there are any problematic triggers
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'threads';

-- 5. Test if we can insert a thread (this will fail if there are issues)
-- Uncomment and modify with your user_id and category_id to test:
/*
INSERT INTO threads (
  id, title, excerpt, author_id, category_id, 
  created_at, last_reply_at, last_reply_by_id, banner
) VALUES (
  gen_random_uuid()::text,
  'Test Thread',
  'Test excerpt',
  'YOUR_USER_ID_HERE',
  'YOUR_CATEGORY_ID_HERE',
  NOW(),
  NOW(),
  'YOUR_USER_ID_HERE',
  NULL
) RETURNING id, title, created_at;
*/

-- 6. If threads are being deleted, check for CASCADE deletes
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'threads' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND rc.delete_rule = 'CASCADE';
