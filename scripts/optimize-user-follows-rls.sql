-- Optimize User Follows RLS Policies
-- This fixes the performance warnings from the linter

-- Step 1: Drop old policies
DROP POLICY IF EXISTS "Users can delete their own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can create follow requests" ON user_follows;
DROP POLICY IF EXISTS "Users can view their own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can update their received follow requests" ON user_follows;
DROP POLICY IF EXISTS "view_own_follows" ON user_follows;
DROP POLICY IF EXISTS "insert_own_follows" ON user_follows;
DROP POLICY IF EXISTS "delete_own_follows" ON user_follows;
DROP POLICY IF EXISTS "update_received_requests" ON user_follows;

-- Step 2: Create optimized policies with (select auth.uid()) for better performance

-- SELECT: Users can view follows where they are involved
CREATE POLICY "user_follows_select_policy"
ON user_follows
FOR SELECT
TO authenticated
USING (
  follower_id = (select auth.uid())::text 
  OR following_id = (select auth.uid())::text
);

-- INSERT: Users can create their own follows
CREATE POLICY "user_follows_insert_policy"
ON user_follows
FOR INSERT
TO authenticated
WITH CHECK (
  follower_id = (select auth.uid())::text
);

-- DELETE: Users can delete their own follows
CREATE POLICY "user_follows_delete_policy"
ON user_follows
FOR DELETE
TO authenticated
USING (
  follower_id = (select auth.uid())::text
);

-- UPDATE: Users can update follow requests they received
CREATE POLICY "user_follows_update_policy"
ON user_follows
FOR UPDATE
TO authenticated
USING (
  following_id = (select auth.uid())::text
)
WITH CHECK (
  following_id = (select auth.uid())::text
);

-- Step 3: Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_follows'
ORDER BY cmd, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ USER FOLLOWS RLS OPTIMIZED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Old duplicate policies removed';
  RAISE NOTICE '✓ New optimized policies created';
  RAISE NOTICE '✓ auth.uid() wrapped in SELECT for performance';
  RAISE NOTICE '✓ One policy per action (SELECT/INSERT/UPDATE/DELETE)';
  RAISE NOTICE '========================================';
END $$;
