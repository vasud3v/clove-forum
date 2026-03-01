-- Seed sample data: 1 category, 1 topic, 1 thread, 1 post
-- Run this in your Supabase SQL Editor

-- First, get a user ID (replace with your actual user ID from auth.users table)
-- You can find your user ID by running: SELECT id FROM auth.users LIMIT 1;

DO $$
DECLARE
  v_user_id TEXT;
  v_category_id TEXT;
  v_topic_id TEXT;
  v_thread_id TEXT;
  v_post_id TEXT;
  v_now TIMESTAMPTZ;
BEGIN
  -- Get the first user from auth.users
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users table. Please create a user first.';
  END IF;

  RAISE NOTICE 'Using user ID: %', v_user_id;

  -- Ensure forum_users record exists
  INSERT INTO public.forum_users (id, username, avatar, join_date, post_count, reputation, is_online, rank, role)
  VALUES (v_user_id, 'admin', '', NOW(), 0, 0, true, 'Newcomer', 'member')
  ON CONFLICT (id) DO NOTHING;

  -- Generate IDs
  v_category_id := 'cat-' || gen_random_uuid()::text;
  v_topic_id := 'topic-' || gen_random_uuid()::text;
  v_thread_id := 't-' || gen_random_uuid()::text;
  v_post_id := 'post-' || gen_random_uuid()::text;
  v_now := NOW();

  -- Create category
  INSERT INTO public.categories (
    id, name, description, icon, thread_count, post_count, last_activity, sort_order
  ) VALUES (
    v_category_id,
    'General Discussion',
    'Talk about anything and everything',
    'MessageSquare',
    1,
    1,
    v_now,
    0
  );
  RAISE NOTICE 'Created category: %', v_category_id;

  -- Create topic
  INSERT INTO public.topics (
    id, category_id, name, description, icon, thread_count
  ) VALUES (
    v_topic_id,
    v_category_id,
    'Introductions',
    'Introduce yourself to the community',
    '👋',
    1
  );
  RAISE NOTICE 'Created topic: %', v_topic_id;

  -- Create thread
  INSERT INTO public.threads (
    id, title, excerpt, author_id, category_id, topic_id,
    created_at, last_reply_at, last_reply_by_id,
    reply_count, view_count, is_pinned, is_locked, is_hot,
    tags, upvotes, downvotes
  ) VALUES (
    v_thread_id,
    'Welcome to the Forum!',
    'This is a sample thread to get things started. Feel free to reply and introduce yourself!',
    v_user_id,
    v_category_id,
    v_topic_id,
    v_now,
    v_now,
    v_user_id,
    0,
    1,
    true,
    false,
    false,
    ARRAY['welcome', 'introduction'],
    0,
    0
  );
  RAISE NOTICE 'Created thread: %', v_thread_id;

  -- Create post
  INSERT INTO public.posts (
    id, thread_id, content, author_id, created_at, upvotes, downvotes
  ) VALUES (
    v_post_id,
    v_thread_id,
    '# Welcome to the Forum! 🎉

This is a sample thread to help you get started. Here are some things you can do:

- Reply to this thread
- Create your own threads
- Explore different categories
- Customize your profile
- Earn reputation by participating

Feel free to introduce yourself and let us know what brings you here!',
    v_user_id,
    v_now,
    0,
    0
  );
  RAISE NOTICE 'Created post: %', v_post_id;

  RAISE NOTICE '✅ Sample data seeded successfully!';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '- Category: General Discussion';
  RAISE NOTICE '- Topic: Introductions';
  RAISE NOTICE '- Thread: Welcome to the Forum!';
  RAISE NOTICE '- Post: Welcome message';
END $$;
