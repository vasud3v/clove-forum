-- ============================================================================
-- Create admin auth user directly in database
-- ============================================================================

-- Step 1: Delete existing SuperAdmin forum user if exists
DELETE FROM public.forum_users WHERE username = 'SuperAdmin';
DELETE FROM public.forum_users WHERE id = '00000000-0000-0000-0000-000000000001';

-- Step 2: Delete existing auth user if exists
DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'apunlegendhai@gmail.com');
DELETE FROM auth.users WHERE email = 'apunlegendhai@gmail.com';

-- Step 3: Temporarily disable the handle_new_user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 4: Update the handle_new_user function to not use email column
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Re-enable the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Create the auth user with proper encryption
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'apunlegendhai@gmail.com',
  crypt('BASUDEVK', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"SuperAdmin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Step 7: Create identity record
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  id,
  id::text,
  'email',
  format('{"sub":"%s","email":"%s","email_verified":true,"phone_verified":false}', id::text, email)::jsonb,
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'apunlegendhai@gmail.com';

-- Step 8: Update the forum_users record to have admin role and god mode
UPDATE public.forum_users
SET 
  username = 'SuperAdmin',
  role = 'admin',
  rank = '👑 GOD MODE',
  reputation = 999999,
  avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin',
  custom_avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=SuperAdmin&backgroundColor=ffd700',
  banner = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80',
  custom_banner = 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1200&q=80',
  post_count = 0,
  follower_count = 0,
  following_count = 0,
  is_private = false,
  is_banned = false
WHERE id = (SELECT id::text FROM auth.users WHERE email = 'apunlegendhai@gmail.com');

-- Step 9: Verify everything is set up correctly
DO $$
DECLARE
  auth_user_id UUID;
  forum_user_id TEXT;
  forum_username TEXT;
  forum_role TEXT;
  forum_rank TEXT;
  forum_reputation INTEGER;
BEGIN
  -- Get auth user
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'apunlegendhai@gmail.com';
  
  -- Get forum user
  SELECT id, username, role, rank, reputation 
  INTO forum_user_id, forum_username, forum_role, forum_rank, forum_reputation
  FROM forum_users
  WHERE id = auth_user_id::text;
  
  IF auth_user_id IS NOT NULL AND forum_user_id IS NOT NULL AND auth_user_id::text = forum_user_id THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✓ ADMIN USER CREATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Login Credentials:';
    RAISE NOTICE '  Email: apunlegendhai@gmail.com';
    RAISE NOTICE '  Password: BASUDEVK';
    RAISE NOTICE '';
    RAISE NOTICE 'User Details:';
    RAISE NOTICE '  User ID: %', auth_user_id;
    RAISE NOTICE '  Username: %', forum_username;
    RAISE NOTICE '  Role: %', forum_role;
    RAISE NOTICE '  Rank: %', forum_rank;
    RAISE NOTICE '  Reputation: %', forum_reputation;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '👑 GOD MODE BADGE ACTIVATED! 👑';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✨ Golden animated badge with shimmer';
    RAISE NOTICE '👑 Animated crown icon with pulse';
    RAISE NOTICE '💫 Sparkling effects';
    RAISE NOTICE '⚡ Lightning bolt accent';
    RAISE NOTICE '🌟 Glowing aura (everyone will be jealous!)';
    RAISE NOTICE '💎 Maximum reputation (999,999)';
    RAISE NOTICE '🛡️  Full admin panel access at /admin';
    RAISE NOTICE '⚔️  All admin powers activated';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now login and dominate the forum!';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION 'Failed to create or link admin user! Auth ID: %, Forum ID: %', auth_user_id, forum_user_id;
  END IF;
END $$;
