-- ============================================================================
-- Consolidate Avatar System - Use Single 'avatar' Field
-- ============================================================================
-- This migration simplifies the avatar system to use industry standard approach:
-- ONE field that gets overwritten when user uploads a new avatar
--
-- Migration Strategy:
-- 1. Check if custom_avatar column exists
-- 2. If it exists, copy custom_avatar to avatar
-- 3. Drop custom_avatar and custom_banner columns if they exist
-- 4. Ensure avatar field has proper constraints
-- ============================================================================

-- Check if custom_avatar column exists and migrate if needed
DO $$
BEGIN
    -- Step 1: Migrate custom avatars to main avatar field (if column exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'forum_users' 
        AND column_name = 'custom_avatar'
    ) THEN
        UPDATE public.forum_users
        SET avatar = COALESCE(custom_avatar, avatar)
        WHERE custom_avatar IS NOT NULL AND custom_avatar != '';
        
        RAISE NOTICE 'Migrated custom_avatar to avatar field';
    ELSE
        RAISE NOTICE 'Column custom_avatar does not exist - already using simplified system';
    END IF;

    -- Step 2: Migrate custom banners to main banner field (if column exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'forum_users' 
        AND column_name = 'custom_banner'
    ) THEN
        UPDATE public.forum_users
        SET banner = COALESCE(custom_banner, banner)
        WHERE custom_banner IS NOT NULL AND custom_banner != '';
        
        RAISE NOTICE 'Migrated custom_banner to banner field';
    ELSE
        RAISE NOTICE 'Column custom_banner does not exist - already using simplified system';
    END IF;
END $$;

-- Step 3: Drop the redundant custom fields (if they exist)
ALTER TABLE public.forum_users 
DROP COLUMN IF EXISTS custom_avatar,
DROP COLUMN IF EXISTS custom_banner;

-- Step 4: Ensure avatar field has proper constraints
DO $$
BEGIN
    -- Set NOT NULL constraint if not already set
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'forum_users' 
        AND column_name = 'avatar'
        AND is_nullable = 'YES'
    ) THEN
        -- First set default for any null values
        UPDATE public.forum_users SET avatar = '' WHERE avatar IS NULL;
        
        -- Then add NOT NULL constraint
        ALTER TABLE public.forum_users ALTER COLUMN avatar SET NOT NULL;
        RAISE NOTICE 'Set avatar column to NOT NULL';
    ELSE
        RAISE NOTICE 'Avatar column already has NOT NULL constraint';
    END IF;

    -- Set default value if not already set
    ALTER TABLE public.forum_users ALTER COLUMN avatar SET DEFAULT '';
END $$;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- After this migration:
-- - Users have ONE avatar field that contains their current avatar
-- - When uploading new avatar: just UPDATE the avatar field
-- - No need for complex priority logic (custom_avatar vs avatar)
-- - Simpler queries: just SELECT avatar
-- - Simpler components: just use user.avatar
-- 
-- Avatar Upload Flow:
-- 1. User uploads image -> Store in Supabase Storage
-- 2. Get public URL from storage
-- 3. UPDATE forum_users SET avatar = <new_url> WHERE id = <user_id>
-- 4. (Optional) Delete old avatar from storage if it was custom uploaded
-- ============================================================================
