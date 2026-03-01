-- Fix User Follows RLS - Safe Version
-- This version terminates blocking queries first

-- Step 1: Terminate any blocking queries on user_follows table
DO $$
DECLARE
  blocking_pid integer;
BEGIN
  -- Find and terminate blocking processes
  FOR blocking_pid IN 
    SELECT pid 
    FROM pg_stat_activity 
    WHERE datname = current_database()
      AND pid != pg_backend_pid()
      AND state = 'idle in transaction'
  LOOP
    PERFORM pg_terminate_backend(blocking_pid);
    RAISE NOTICE 'Terminated blocking process: %', blocking_pid;
  END LOOP;
END $$;

-- Wait a moment for cleanup
SELECT pg_sleep(1);

-- Step 2: Drop existing policies one by one
DO $$
DECLARE
  policy_name text;
BEGIN
  FOR policy_name IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'user_follows'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON user_follows', policy_name);
    RAISE NOTICE 'Dropped policy: %', policy_name;
  END LOOP;
END $$;

-- Step 3: Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new policies
CREATE POLICY "view_own_follows"
ON user_follows
FOR SELECT
TO authenticated
USING (
  follower_id = auth.uid()::text 
  OR following_id = auth.uid()::text
);

CREATE POLICY "insert_own_follows"
ON user_follows
FOR INSERT
TO authenticated
WITH CHECK (
  follower_id = auth.uid()::text
);

CREATE POLICY "delete_own_follows"
ON user_follows
FOR DELETE
TO authenticated
USING (
  follower_id = auth.uid()::text
);

CREATE POLICY "update_received_requests"
ON user_follows
FOR UPDATE
TO authenticated
USING (
  following_id = auth.uid()::text
)
WITH CHECK (
  following_id = auth.uid()::text
);

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_follows TO authenticated;

-- Success
SELECT 'RLS policies successfully created for user_follows' as status;
