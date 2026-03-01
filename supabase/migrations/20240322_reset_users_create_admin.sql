-- ============================================================================
-- Delete all users and prepare for admin user creation
-- ============================================================================

-- IMPORTANT: Delete in correct order to avoid foreign key violations
-- Using DO block to handle tables that may not exist

DO $$
BEGIN
  -- Step 1: Delete all data that references forum_users (if tables exist)
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'moderation_logs') THEN
    DELETE FROM public.moderation_logs;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_warnings') THEN
    DELETE FROM public.user_warnings;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_reports') THEN
    DELETE FROM public.content_reports;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reputation_events') THEN
    DELETE FROM public.reputation_events;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_follows') THEN
    DELETE FROM public.user_follows;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'follow_requests') THEN
    DELETE FROM public.follow_requests;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookmarks') THEN
    DELETE FROM public.bookmarks;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'thread_watches') THEN
    DELETE FROM public.thread_watches;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'thread_votes') THEN
    DELETE FROM public.thread_votes;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_votes') THEN
    DELETE FROM public.post_votes;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_reactions') THEN
    DELETE FROM public.post_reactions;
  END IF;
  
  -- Step 2: Delete polls and related data
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'poll_votes') THEN
    DELETE FROM public.poll_votes;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'poll_options') THEN
    DELETE FROM public.poll_options;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'polls') THEN
    DELETE FROM public.polls;
  END IF;
  
  -- Step 3: Delete posts
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    DELETE FROM public.posts;
  END IF;
  
  -- Step 4: Delete threads
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'threads') THEN
    DELETE FROM public.threads;
  END IF;
  
  -- Step 5: Delete forum_users
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forum_users') THEN
    DELETE FROM public.forum_users;
  END IF;
  
  -- Step 6: Delete auth users
  DELETE FROM auth.users;
  
  RAISE NOTICE '✓ All existing data deleted successfully';
END $$;

-- Step 7: Create admin user in forum_users table with a known ID
INSERT INTO public.forum_users (
  id,
  username,
  avatar,
  custom_avatar,
  banner,
  custom_banner,
  post_count,
  reputation,
  join_date,
  is_online,
  rank,
  role,
  is_banned,
  follower_count,
  following_count,
  is_private
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Fixed UUID for admin
  'SuperAdmin',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin&backgroundColor=ffd700',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80',
  'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&q=80',
  0,
  999999, -- Maximum reputation
  NOW(),
  true,
  '👑 GOD MODE', -- Epic rank that everyone will crave
  'admin', -- CRITICAL: This must be 'admin' for full admin panel access and GOD MODE badge
  false,
  0,
  0,
  false
);

-- Step 8: Instructions for creating the auth user
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ADMIN USER SETUP INSTRUCTIONS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✓ All users and data have been deleted';
  RAISE NOTICE '✓ Admin forum profile created';
  RAISE NOTICE '';
  RAISE NOTICE 'Admin Profile Details:';
  RAISE NOTICE '  - ID: 00000000-0000-0000-0000-000000000001';
  RAISE NOTICE '  - Username: SuperAdmin';
  RAISE NOTICE '  - Role: admin (full access)';
  RAISE NOTICE '  - Reputation: 999,999 (maximum)';
  RAISE NOTICE '  - Rank: 👑 GOD MODE (legendary)';
  RAISE NOTICE '  - Badge: Golden animated GOD MODE badge';
  RAISE NOTICE '';
  RAISE NOTICE 'TO COMPLETE SETUP:';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE '';
  RAISE NOTICE 'Step 1: Create Auth User';
  RAISE NOTICE '  → Go to: Supabase Dashboard → Authentication → Users';
  RAISE NOTICE '  → Click: "Add User" → "Create new user"';
  RAISE NOTICE '';
  RAISE NOTICE 'Step 2: Enter Details';
  RAISE NOTICE '  Email: apunlegendhai@gmail.com';
  RAISE NOTICE '  Password: BASUDEVK';
  RAISE NOTICE '  Auto Confirm User: ✓ YES (CHECK THIS!)';
  RAISE NOTICE '';
  RAISE NOTICE 'Step 3: Create User';
  RAISE NOTICE '  → Click "Create user"';
  RAISE NOTICE '  → Copy the User ID (UUID)';
  RAISE NOTICE '';
  RAISE NOTICE 'Step 4: Link Accounts (Run this SQL)';
  RAISE NOTICE '';
  RAISE NOTICE '  UPDATE forum_users';
  RAISE NOTICE '  SET id = ''PASTE_UUID_HERE''';
  RAISE NOTICE '  WHERE id = ''00000000-0000-0000-0000-000000000001'';';
  RAISE NOTICE '';
  RAISE NOTICE 'Step 5: Login';
  RAISE NOTICE '  Email: apunlegendhai@gmail.com';
  RAISE NOTICE '  Password: BASUDEVK';
  RAISE NOTICE '';
  RAISE NOTICE 'Step 6: Access Admin Panel';
  RAISE NOTICE '  → Navigate to: /admin';
  RAISE NOTICE '  → Admin link will appear in header';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ADMIN POWERS GRANTED:';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ GOD MODE BADGE - Golden animated badge';
  RAISE NOTICE '  • Shimmering gold gradient';
  RAISE NOTICE '  • Animated crown icon with pulse';
  RAISE NOTICE '  • Sparkling effects';
  RAISE NOTICE '  • Lightning bolt accent';
  RAISE NOTICE '  • Glowing aura (everyone will be jealous!)';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Full admin panel access (/admin)';
  RAISE NOTICE '✓ Maximum reputation (999,999)';
  RAISE NOTICE '✓ Legendary rank: 👑 GOD MODE';
  RAISE NOTICE '✓ Manage all categories';
  RAISE NOTICE '✓ Manage all threads & posts';
  RAISE NOTICE '✓ Manage all users & roles';
  RAISE NOTICE '✓ Ban/unban any user';
  RAISE NOTICE '✓ View & manage all reports';
  RAISE NOTICE '✓ View moderation logs';
  RAISE NOTICE '✓ Manage site settings';
  RAISE NOTICE '✓ Create announcements';
  RAISE NOTICE '✓ Pin/lock/feature threads';
  RAISE NOTICE '✓ All moderator permissions';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NOTE: All threads, posts, and user data deleted.';
  RAISE NOTICE 'Categories remain intact.';
  RAISE NOTICE '';
END $$;
