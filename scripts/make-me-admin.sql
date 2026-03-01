-- ============================================================================
-- Make Yourself Admin (Quick Fix)
-- ============================================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Replace 'your-email@example.com' with your actual email

-- Step 1: Find your user ID (check the output)
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'apunlegendhai@gmail.com';

-- Step 2: Update your role to admin (replace the user_id)
-- Copy your user ID from Step 1 and paste it below
UPDATE public.forum_users 
SET role = 'admin'
WHERE id = '521ad298-05ca-4b33-ac01-178c76523a9c';

-- Step 3: Verify the change
SELECT 
  id,
  username,
  role
FROM public.forum_users
WHERE id = '521ad298-05ca-4b33-ac01-178c76523a9c';

-- You should see role = 'admin' in the output
