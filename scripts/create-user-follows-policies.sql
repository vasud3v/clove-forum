-- Create User Follows RLS Policies (Simple Version)
-- Run this if the table doesn't have policies yet

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Create policies (will fail if they exist, that's ok)
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_follows TO authenticated;
