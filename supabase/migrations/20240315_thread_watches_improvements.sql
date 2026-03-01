-- ============================================================================
-- Thread Watches Table Improvements
-- ============================================================================

-- Ensure thread_watches table exists with proper structure
CREATE TABLE IF NOT EXISTS public.thread_watches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  thread_id TEXT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_thread_watches_user_id ON public.thread_watches(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_watches_thread_id ON public.thread_watches(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_watches_last_read ON public.thread_watches(last_read_at);

-- Enable RLS
ALTER TABLE public.thread_watches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage their own watches" ON public.thread_watches;
DROP POLICY IF EXISTS "Users can view their own watches" ON public.thread_watches;

-- Create policies
CREATE POLICY "Users can manage their own watches"
ON public.thread_watches
FOR ALL
TO authenticated
USING ((SELECT auth.uid())::text = user_id)
WITH CHECK ((SELECT auth.uid())::text = user_id);

-- Function to update unread count when new posts are added
CREATE OR REPLACE FUNCTION update_thread_watch_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment unread count for all users watching this thread (except the post author)
  UPDATE thread_watches
  SET 
    unread_count = unread_count + 1,
    updated_at = NOW()
  WHERE 
    thread_id = NEW.thread_id 
    AND user_id != NEW.author_id
    AND last_read_at < NEW.created_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new posts
DROP TRIGGER IF EXISTS trigger_update_thread_watch_unread ON public.posts;
CREATE TRIGGER trigger_update_thread_watch_unread
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION update_thread_watch_unread_count();

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_thread_watches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_thread_watches_updated_at ON public.thread_watches;
CREATE TRIGGER trigger_thread_watches_updated_at
BEFORE UPDATE ON public.thread_watches
FOR EACH ROW
EXECUTE FUNCTION update_thread_watches_updated_at();
