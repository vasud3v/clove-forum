# Fix User Follows RLS - Step by Step

Run these commands **ONE AT A TIME** in Supabase SQL Editor. Wait for each to complete before running the next.

## Step 1: Enable RLS
```sql
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
```

## Step 2: Create SELECT Policy
```sql
CREATE POLICY "view_own_follows"
ON user_follows
FOR SELECT
TO authenticated
USING (
  follower_id = auth.uid()::text 
  OR following_id = auth.uid()::text
);
```

## Step 3: Create INSERT Policy
```sql
CREATE POLICY "insert_own_follows"
ON user_follows
FOR INSERT
TO authenticated
WITH CHECK (
  follower_id = auth.uid()::text
);
```

## Step 4: Create DELETE Policy
```sql
CREATE POLICY "delete_own_follows"
ON user_follows
FOR DELETE
TO authenticated
USING (
  follower_id = auth.uid()::text
);
```

## Step 5: Create UPDATE Policy
```sql
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
```

## Step 6: Grant Permissions
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON user_follows TO authenticated;
```

## Verify
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_follows';
```

You should see 4 policies listed.
