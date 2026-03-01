-- Cleanup script for follow and messaging system
-- Run this if the migration was partially applied

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON public.user_follows;
DROP TRIGGER IF EXISTS trigger_update_unread_count ON public.messages;

-- Drop functions
DROP FUNCTION IF EXISTS update_follower_counts();
DROP FUNCTION IF EXISTS update_unread_count();
DROP FUNCTION IF EXISTS can_message_user(TEXT);

-- Drop policies
DROP POLICY IF EXISTS "Users can view their own follows" ON public.user_follows;
DROP POLICY IF EXISTS "Users can create follow requests" ON public.user_follows;
DROP POLICY IF EXISTS "Users can update their received follow requests" ON public.user_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.user_follows;

DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Drop tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.user_follows CASCADE;

-- Remove columns from forum_users
ALTER TABLE public.forum_users 
  DROP COLUMN IF EXISTS follower_count,
  DROP COLUMN IF EXISTS following_count,
  DROP COLUMN IF EXISTS is_private;

-- Remove from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.user_follows;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.messages;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.conversation_participants;
