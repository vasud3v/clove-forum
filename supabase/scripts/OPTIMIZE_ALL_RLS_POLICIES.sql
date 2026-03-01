-- ============================================================================
-- Optimize ALL RLS Policies for Performance
-- Fixes all auth.uid() calls by wrapping them in (SELECT auth.uid())
-- This prevents unnecessary re-evaluation for each row
-- ============================================================================

-- ============================================================================
-- Posts Table
-- ============================================================================

DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_delete" 
ON public.posts 
FOR DELETE
USING (
  (SELECT auth.uid())::text = author_id 
  OR 
  public.is_staff((SELECT auth.uid())::text)
);

-- ============================================================================
-- Follow and Messaging System
-- ============================================================================

-- User Follows Policies
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

-- Conversations Policies
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

-- Conversation Participants Policies
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
      user_id = (SELECT auth.uid())::text OR
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

-- Messages Policies
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
-- Notify PostgREST to reload schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Summary
-- ============================================================================
-- This script optimized:
-- - 1 policy on posts table
-- - 4 policies on user_follows table
-- - 2 policies on conversations table
-- - 3 policies on conversation_participants table
-- - 4 policies on messages table
-- Total: 14 RLS policies optimized for performance
-- ============================================================================
