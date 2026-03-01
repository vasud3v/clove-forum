-- ============================================================================
-- User Follows System
-- ============================================================================

-- Drop existing objects if they exist (for safe re-running)
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON public.user_follows;
DROP TRIGGER IF EXISTS trigger_update_unread_count ON public.messages;
DROP FUNCTION IF EXISTS update_follower_counts();
DROP FUNCTION IF EXISTS update_unread_count();
DROP FUNCTION IF EXISTS can_message_user(TEXT);

-- Follow relationships table
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Add follower/following counts to forum_users
ALTER TABLE public.forum_users 
  ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- Private Messaging System
-- ============================================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY DEFAULT 'conv-' || gen_random_uuid()::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  unread_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY DEFAULT 'msg-' || gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_status ON public.user_follows(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- User Follows Policies (optimized with SELECT auth.uid() for performance)
DROP POLICY IF EXISTS "Users can view their own follows" ON public.user_follows;
DROP POLICY IF EXISTS "Users can create follow requests" ON public.user_follows;
DROP POLICY IF EXISTS "Users can update their received follow requests" ON public.user_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.user_follows;

CREATE POLICY "Users can view their own follows"
  ON public.user_follows FOR SELECT
  USING ((SELECT auth.uid())::text = follower_id OR (SELECT auth.uid())::text = following_id);

CREATE POLICY "Users can create follow requests"
  ON public.user_follows FOR INSERT
  WITH CHECK ((SELECT auth.uid())::text = follower_id);

CREATE POLICY "Users can update their received follow requests"
  ON public.user_follows FOR UPDATE
  USING ((SELECT auth.uid())::text = following_id);

CREATE POLICY "Users can delete their own follows"
  ON public.user_follows FOR DELETE
  USING ((SELECT auth.uid())::text = follower_id);

-- Conversations Policies (optimized with SELECT auth.uid() for performance)
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Conversation Participants Policies (optimized with SELECT auth.uid() for performance)
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;

CREATE POLICY "Users can view conversation participants"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id AND cp.user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY "Users can join conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND (
      -- User can add themselves
      user_id = (SELECT auth.uid())::text OR
      -- Or user is already a participant in this conversation (adding others)
      EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conversation_participants.conversation_id
        AND user_id = (SELECT auth.uid())::text
      )
    )
  );

CREATE POLICY "Users can update their own participant record"
  ON public.conversation_participants FOR UPDATE
  USING ((SELECT auth.uid())::text = user_id);

-- Messages Policies (optimized with SELECT auth.uid() for performance)
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    (SELECT auth.uid())::text = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = (SELECT auth.uid())::text
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  USING ((SELECT auth.uid())::text = sender_id);

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING ((SELECT auth.uid())::text = sender_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    -- Increment counts
    UPDATE public.forum_users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE public.forum_users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    -- Accept request
    UPDATE public.forum_users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE public.forum_users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    -- Reject or remove
    UPDATE public.forum_users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = NEW.following_id;
    UPDATE public.forum_users SET following_count = GREATEST(0, following_count - 1) WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
    -- Unfollow
    UPDATE public.forum_users SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.following_id;
    UPDATE public.forum_users SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Trigger for follower counts
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON public.user_follows;
CREATE TRIGGER trigger_update_follower_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION update_follower_counts();

-- Function to update unread message counts
CREATE OR REPLACE FUNCTION update_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment unread count for all participants except sender
    UPDATE public.conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id;
    
    -- Update conversation timestamp
    UPDATE public.conversations
    SET updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Trigger for unread counts
DROP TRIGGER IF EXISTS trigger_update_unread_count ON public.messages;
CREATE TRIGGER trigger_update_unread_count
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_unread_count();

-- Function to check if users can message each other
CREATE OR REPLACE FUNCTION can_message_user(target_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_following BOOLEAN;
  target_is_private BOOLEAN;
BEGIN
  -- Get target user privacy setting
  SELECT is_private INTO target_is_private
  FROM public.forum_users
  WHERE id = target_user_id;
  
  -- If target is not private, anyone can message
  IF NOT target_is_private THEN
    RETURN TRUE;
  END IF;
  
  -- Check if current user is following target (and accepted)
  SELECT EXISTS (
    SELECT 1 FROM public.user_follows
    WHERE follower_id = auth.uid()::text
    AND following_id = target_user_id
    AND status = 'accepted'
  ) INTO is_following;
  
  RETURN is_following;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================================================
-- Enable Realtime
-- ============================================================================
DO $$ 
BEGIN
  -- Add tables to realtime publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'user_follows'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  END IF;
END $$;
