-- Fix Row Level Security for user_follows table
-- This allows users to follow other users

-- Enable RLS if not already enabled
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can view follows where they are involved" ON user_follows;
DROP POLICY IF EXISTS "Users can insert their own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON user_follows;
DROP POLICY IF EXISTS "Users can update their own follow requests" ON user_follows;

-- Policy: Users can view follows where they are the follower or being followed
CREATE POLICY "Users can view follows where they are involved"
ON user_follows
FOR SELECT
TO authenticated
USING (
  auth.uid()::text = follower_id 
  OR auth.uid()::text = following_id
);

-- Policy: Users can insert follows (follow others)
CREATE POLICY "Users can insert their own follows"
ON user_follows
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = follower_id
);

-- Policy: Users can delete their own follows (unfollow)
CREATE POLICY "Users can delete their own follows"
ON user_follows
FOR DELETE
TO authenticated
USING (
  auth.uid()::text = follower_id
);

-- Policy: Users can update follow requests they received (accept/reject)
CREATE POLICY "Users can update follow requests they received"
ON user_follows
FOR UPDATE
TO authenticated
USING (
  auth.uid()::text = following_id
)
WITH CHECK (
  auth.uid()::text = following_id
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_follows TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ USER FOLLOWS RLS FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ RLS policies created';
  RAISE NOTICE '✓ Users can follow others';
  RAISE NOTICE '✓ Users can unfollow';
  RAISE NOTICE '✓ Users can accept/reject follow requests';
  RAISE NOTICE '========================================';
END $$;
