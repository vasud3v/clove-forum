-- ============================================================================
-- Fix Supabase Database Linter Warnings
-- ============================================================================
-- This migration fixes 3 categories of warnings:
-- 1. Function Search Path Mutable (SET search_path = '')
-- 2. Auth RLS Initplan (auth.uid() → (select auth.uid()))
-- 3. Multiple Permissive Policies (consolidate overlapping policies)
-- ============================================================================


-- ============================================================================
-- PART 1: Fix Function Search Path Mutable
-- Add SET search_path = '' to all public functions
-- ============================================================================

-- 1a. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.forum_users (id, username, role, avatar, post_count, reputation, join_date, is_online, rank)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'member',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id::text,
    0,
    0,
    NOW(),
    true,
    'Newcomer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 1b. update_forum_settings_updated_at
CREATE OR REPLACE FUNCTION public.update_forum_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1c. cleanup_orphaned_reports
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_reports()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up reports for deleted threads
  IF TG_TABLE_NAME = 'threads' THEN
    DELETE FROM public.content_reports 
    WHERE target_type = 'thread' AND target_id = OLD.id;
  END IF;
  
  -- Clean up reports for deleted posts
  IF TG_TABLE_NAME = 'posts' THEN
    DELETE FROM public.content_reports 
    WHERE target_type = 'post' AND target_id = OLD.id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1d. cleanup_orphaned_forum_assets
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_forum_assets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  asset_record RECORD;
  is_used BOOLEAN;
BEGIN
  -- Loop through all forum assets
  FOR asset_record IN 
    SELECT name FROM storage.objects 
    WHERE bucket_id = 'forum-assets'
  LOOP
    is_used := FALSE;
    
    -- Check if used in topics
    IF EXISTS (
      SELECT 1 FROM public.topics 
      WHERE icon LIKE '%' || asset_record.name || '%'
    ) THEN
      is_used := TRUE;
    END IF;
    
    -- Check if used in threads
    IF NOT is_used AND EXISTS (
      SELECT 1 FROM public.threads 
      WHERE banner LIKE '%' || asset_record.name || '%'
    ) THEN
      is_used := TRUE;
    END IF;
    
    -- Delete if not used
    IF NOT is_used THEN
      DELETE FROM storage.objects 
      WHERE bucket_id = 'forum-assets' 
      AND name = asset_record.name;
      
      RAISE NOTICE 'Deleted orphaned asset: %', asset_record.name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Cleanup completed';
END;
$$;

-- 1e. update_user_post_count
CREATE OR REPLACE FUNCTION public.update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_users
    SET post_count = post_count + 1
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_users
    SET post_count = GREATEST(post_count - 1, 0)
    WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1f. update_user_reputation
CREATE OR REPLACE FUNCTION public.update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_users
    SET reputation = reputation + NEW.points
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_users
    SET reputation = reputation - OLD.points
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1g. update_topic_latest_thread
CREATE OR REPLACE FUNCTION public.update_topic_latest_thread()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.topic_id IS NOT NULL THEN
    UPDATE public.topics
    SET 
      latest_thread_id = NEW.id,
      latest_thread_title = NEW.title,
      latest_thread_author_id = NEW.author_id,
      last_activity = NEW.created_at
    WHERE id = NEW.topic_id
    AND (latest_thread_id IS NULL OR NEW.created_at > last_activity);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1h. update_topic_thread_count
CREATE OR REPLACE FUNCTION public.update_topic_thread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.topic_id IS NOT NULL THEN
      UPDATE public.topics
      SET thread_count = thread_count + 1
      WHERE id = NEW.topic_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.topic_id IS NOT NULL THEN
      UPDATE public.topics
      SET thread_count = GREATEST(thread_count - 1, 0)
      WHERE id = OLD.topic_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
      IF OLD.topic_id IS NOT NULL THEN
        UPDATE public.topics
        SET thread_count = GREATEST(thread_count - 1, 0)
        WHERE id = OLD.topic_id;
      END IF;
      IF NEW.topic_id IS NOT NULL THEN
        UPDATE public.topics
        SET thread_count = thread_count + 1
        WHERE id = NEW.topic_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1i. update_topic_post_count
CREATE OR REPLACE FUNCTION public.update_topic_post_count()
RETURNS TRIGGER AS $$
DECLARE
  topic_id_var TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT topic_id INTO topic_id_var
    FROM public.threads
    WHERE id = NEW.thread_id;
    
    IF topic_id_var IS NOT NULL THEN
      UPDATE public.topics
      SET post_count = post_count + 1
      WHERE id = topic_id_var;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT topic_id INTO topic_id_var
    FROM public.threads
    WHERE id = OLD.thread_id;
    
    IF topic_id_var IS NOT NULL THEN
      UPDATE public.topics
      SET post_count = GREATEST(post_count - 1, 0)
      WHERE id = topic_id_var;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1j. update_category_thread_count
CREATE OR REPLACE FUNCTION public.update_category_thread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.categories
    SET thread_count = thread_count + 1
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.categories
    SET thread_count = GREATEST(thread_count - 1, 0)
    WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      UPDATE public.categories
      SET thread_count = GREATEST(thread_count - 1, 0)
      WHERE id = OLD.category_id;
      UPDATE public.categories
      SET thread_count = thread_count + 1
      WHERE id = NEW.category_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1k. update_category_post_count
CREATE OR REPLACE FUNCTION public.update_category_post_count()
RETURNS TRIGGER AS $$
DECLARE
  category_id_var TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT category_id INTO category_id_var
    FROM public.threads
    WHERE id = NEW.thread_id;
    
    IF category_id_var IS NOT NULL THEN
      UPDATE public.categories
      SET post_count = post_count + 1
      WHERE id = category_id_var;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT category_id INTO category_id_var
    FROM public.threads
    WHERE id = OLD.thread_id;
    
    IF category_id_var IS NOT NULL THEN
      UPDATE public.categories
      SET post_count = GREATEST(post_count - 1, 0)
      WHERE id = category_id_var;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1l. update_thread_reply_count (DB-only function, not in local migrations)
-- Recreate with search_path set
CREATE OR REPLACE FUNCTION public.update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.threads
    SET reply_count = COALESCE(reply_count, 0) + 1
    WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.threads
    SET reply_count = GREATEST(COALESCE(reply_count, 0) - 1, 0)
    WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1m. generate_ticket_number (DB-only function, not in local migrations)
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  ticket_num TEXT;
  next_val BIGINT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS BIGINT)), 0) + 1
  INTO next_val
  FROM public.support_tickets
  WHERE ticket_number IS NOT NULL;
  
  ticket_num := 'TKT-' || LPAD(next_val::TEXT, 6, '0');
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- 1n. set_ticket_number (DB-only function, not in local migrations)
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';


-- ============================================================================
-- PART 2: Fix Auth RLS Initplan Performance
-- Replace auth.uid() with (select auth.uid()) in RLS policies
-- Replace auth.role() with (select auth.role()) in RLS policies
-- ============================================================================

-- ---- forum_settings ----

DROP POLICY IF EXISTS "Only admins can insert forum settings" ON public.forum_settings;
CREATE POLICY "Only admins can insert forum settings"
  ON public.forum_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forum_users
      WHERE public.forum_users.id = (select auth.uid())::text
      AND public.forum_users.role IN ('admin', 'super_moderator')
    )
  );

DROP POLICY IF EXISTS "Only admins can update forum settings" ON public.forum_settings;
CREATE POLICY "Only admins can update forum settings"
  ON public.forum_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_users
      WHERE public.forum_users.id = (select auth.uid())::text
      AND public.forum_users.role IN ('admin', 'super_moderator')
    )
  );

-- ---- announcement_banners ----
-- Fix initplan + consolidate multiple permissive SELECT policies

-- Drop conflicting SELECT policies
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.announcement_banners;
DROP POLICY IF EXISTS "Admins and moderators can manage banners" ON public.announcement_banners;

-- Single consolidated SELECT policy (visible to everyone)
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.announcement_banners;
CREATE POLICY "Anyone can view active banners"
  ON public.announcement_banners
  FOR SELECT
  USING (true);

-- Separate write policies for admins/moderators with initplan fix
DROP POLICY IF EXISTS "Admins and moderators can insert banners" ON public.announcement_banners;
CREATE POLICY "Admins and moderators can insert banners"
  ON public.announcement_banners
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forum_users
      WHERE public.forum_users.id = (select auth.uid())::text
      AND public.forum_users.role IN ('admin', 'super_moderator', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Admins and moderators can update banners" ON public.announcement_banners;
CREATE POLICY "Admins and moderators can update banners"
  ON public.announcement_banners
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_users
      WHERE public.forum_users.id = (select auth.uid())::text
      AND public.forum_users.role IN ('admin', 'super_moderator', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Admins and moderators can delete banners" ON public.announcement_banners;
CREATE POLICY "Admins and moderators can delete banners"
  ON public.announcement_banners
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_users
      WHERE public.forum_users.id = (select auth.uid())::text
      AND public.forum_users.role IN ('admin', 'super_moderator', 'moderator')
    )
  );

-- ---- support_tickets ----
-- Fix initplan + consolidate multiple permissive SELECT policies

DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Staff can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Staff can update tickets" ON public.support_tickets;

-- Single consolidated SELECT policy
DROP POLICY IF EXISTS "Users and staff can view tickets" ON public.support_tickets;
CREATE POLICY "Users and staff can view tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    (select auth.uid())::text = user_id
    OR EXISTS (
      SELECT 1 FROM public.forum_users
      WHERE public.forum_users.id = (select auth.uid())::text
      AND public.forum_users.role IN ('admin', 'super_moderator', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
CREATE POLICY "Users can create tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Staff can update tickets" ON public.support_tickets;
CREATE POLICY "Staff can update tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.forum_users
      WHERE public.forum_users.id = (select auth.uid())::text
      AND public.forum_users.role IN ('admin', 'super_moderator', 'moderator')
    )
  );

-- ---- support_ticket_replies ----
-- Fix initplan + consolidate multiple permissive SELECT and INSERT policies

DROP POLICY IF EXISTS "Users can reply to their tickets" ON public.support_ticket_replies;
DROP POLICY IF EXISTS "Staff can reply to any ticket" ON public.support_ticket_replies;
DROP POLICY IF EXISTS "Users can view replies to their tickets" ON public.support_ticket_replies;
DROP POLICY IF EXISTS "Staff can view all replies" ON public.support_ticket_replies;

-- Single consolidated SELECT policy
DROP POLICY IF EXISTS "Users and staff can view replies" ON public.support_ticket_replies;
CREATE POLICY "Users and staff can view replies"
  ON public.support_ticket_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE public.support_tickets.id = ticket_id
      AND public.support_tickets.user_id = (select auth.uid())::text
    )
    OR EXISTS (
      SELECT 1 FROM public.forum_users
      WHERE public.forum_users.id = (select auth.uid())::text
      AND public.forum_users.role IN ('admin', 'super_moderator', 'moderator')
    )
  );

-- Single consolidated INSERT policy
DROP POLICY IF EXISTS "Users and staff can reply" ON public.support_ticket_replies;
CREATE POLICY "Users and staff can reply"
  ON public.support_ticket_replies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE public.support_tickets.id = ticket_id
      AND public.support_tickets.user_id = (select auth.uid())::text
    )
    OR EXISTS (
      SELECT 1 FROM public.forum_users
      WHERE public.forum_users.id = (select auth.uid())::text
      AND public.forum_users.role IN ('admin', 'super_moderator', 'moderator')
    )
  );

-- ---- posts ----

DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;

DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert" 
ON public.posts 
FOR INSERT 
WITH CHECK (
  (select auth.uid()) IS NOT NULL 
  AND (
    (select auth.uid())::text = author_id 
    OR public.is_staff((select auth.uid())::text)
  )
);

DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update" 
ON public.posts 
FOR UPDATE 
USING (
  (select auth.uid()) IS NOT NULL 
  AND (
    (select auth.uid())::text = author_id 
    OR public.is_staff((select auth.uid())::text)
  )
);

DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_delete" 
ON public.posts 
FOR DELETE 
USING (
  (select auth.uid()) IS NOT NULL 
  AND (
    (select auth.uid())::text = author_id 
    OR public.is_staff((select auth.uid())::text)
  )
);

-- ---- topics ----

DROP POLICY IF EXISTS "topics_insert" ON public.topics;
DROP POLICY IF EXISTS "topics_update" ON public.topics;
DROP POLICY IF EXISTS "topics_delete" ON public.topics;

DROP POLICY IF EXISTS "topics_insert" ON public.topics;
CREATE POLICY "topics_insert" 
ON public.topics 
FOR INSERT 
WITH CHECK ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "topics_update" ON public.topics;
CREATE POLICY "topics_update" 
ON public.topics 
FOR UPDATE 
USING ((select auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "topics_delete" ON public.topics;
CREATE POLICY "topics_delete" 
ON public.topics 
FOR DELETE 
USING ((select auth.role()) = 'authenticated');

-- ---- notifications ----

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING ((select auth.uid())::text = user_id);


-- ============================================================================
-- Done!
-- ============================================================================
