-- ============================================================================
-- Notifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT 'notif-' || gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'reply', 'mention', 'upvote', 'reaction',
    'best_answer', 'follow', 'follow_request',
    'milestone', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  actor_id TEXT REFERENCES public.forum_users(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_avatar TEXT,
  target_type TEXT CHECK (target_type IN ('thread', 'post', 'user')),
  target_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can insert notifications for other users (triggered by actions)
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- Enable Realtime
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
