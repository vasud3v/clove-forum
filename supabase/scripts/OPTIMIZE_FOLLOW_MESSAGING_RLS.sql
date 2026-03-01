-- ============================================================================
-- Optimize RLS Policies for Follow and Messaging System
-- Fixes performance warnings by using (SELECT auth.uid()) instead of auth.uid()
-- ============================================================================

-- Drop existing policies
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

-- ============================================================================
-- Optimized User Follows Policies
-- ============================================================================

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

-- ============================================================================
-- Optimized Conversations Policies
-- ============================================================================

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

-- ============================================================================
-- Optimized Conversation Participants Policies
-- ============================================================================

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

-- ============================================================================
-- Optimized Messages Policies
-- ============================================================================

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

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
