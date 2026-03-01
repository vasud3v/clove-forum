-- Check the threads table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'threads'
ORDER BY ordinal_position;

-- Check RLS policies on threads table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'threads';

-- Check if there are any triggers on threads table
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'threads';

-- Check recent threads (last 10)
SELECT id, title, author_id, category_id, created_at, banner
FROM threads
ORDER BY created_at DESC
LIMIT 10;
