-- Fix Row Level Security for user_follows table (Version 2)
-- First, let's check the column types and fix accordingly

-- Check column types
DO $$
DECLARE
  follower_type text;
  following_type text;
BEGIN
  SELECT data_type INTO follower_type
  FROM information_schema.columns
  WHERE table_name = 'user_follows' AND column_name = 'follower_id';
  
  SELECT data_type INTO following_type
  FROM information_schema.columns
  WHERE table_name = 'user_follows' AND column_name = 'following_id';
  
  RAISE NOTICE 'follower_id type: %', follower_type;
  RAISE NOTICE 'following_id type: %', following_type;
END $$;

-- Drop all existing policies (one at a time to avoid deadlock)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own follows" ON user_follows;
  DROP POLICY IF EXISTS "Users can view follows where they are involved" ON user_follows;
  DROP POLICY IF EXISTS "Users can insert their own follows" ON user_follows;
  DROP POLICY IF EXISTS "Users can delete their own follows" ON user_follows;
  DROP POLICY IF EXISTS "Users can update their own follow requests" ON user_follows;
  DROP POLICY IF EXISTS "Users can update follow requests they received" ON user_follows;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Create policies with proper type casting
-- Policy 1: View follows
CREATE POLICY "Users can view follows where they are involved"
ON user_follows
FOR SELECT
TO authenticated
USING (
  follower_id = auth.uid()::text 
  OR following_id = auth.uid()::text
);

-- Policy 2: Insert follows
CREATE POLICY "Users can insert their own follows"
ON user_follows
FOR INSERT
TO authenticated
WITH CHECK (
  follower_id = auth.uid()::text
);

-- Policy 3: Delete follows
CREATE POLICY "Users can delete their own follows"
ON user_follows
FOR DELETE
TO authenticated
USING (
  follower_id = auth.uid()::text
);

-- Policy 4: Update follows (accept/reject requests)
CREATE POLICY "Users can update follow requests they received"
ON user_follows
FOR UPDATE
TO authenticated
USING (
  following_id = auth.uid()::text
)
WITH CHECK (
  following_id = auth.uid()::text
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
