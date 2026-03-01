-- ============================================================================
-- Setup Forum Assets Storage Bucket
-- ============================================================================
-- This migration creates a storage bucket for forum assets (topic icons, 
-- thread banners, etc.) with proper permissions and policies.

-- ============================================================================
-- Create Storage Bucket
-- ============================================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum-assets',
  'forum-assets',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Storage Policies
-- ============================================================================

-- Policy: Anyone can view forum assets (public read)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum-assets');

-- Policy: Authenticated users can upload forum assets
CREATE POLICY "Authenticated users can upload forum assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'forum-assets' AND
  (storage.foldername(name))[1] IN ('topic-icons', 'thread-banners', 'category-icons')
);

-- Policy: Users can update their own uploads
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'forum-assets' AND owner::text = auth.uid()::text)
WITH CHECK (bucket_id = 'forum-assets');

-- Policy: Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'forum-assets' AND owner::text = auth.uid()::text);

-- Policy: Admins can manage all forum assets
CREATE POLICY "Admins can manage all forum assets"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'forum-assets' AND
  EXISTS (
    SELECT 1 FROM public.forum_users
    WHERE id = auth.uid()::text
    AND role IN ('admin', 'super_moderator')
  )
);

-- ============================================================================
-- Add icon column to topics if not exists
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'topics' 
    AND column_name = 'icon'
  ) THEN
    ALTER TABLE public.topics ADD COLUMN icon TEXT;
    RAISE NOTICE 'Added icon column to topics table';
  END IF;
END $$;

-- ============================================================================
-- Add banner column to threads if not exists
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'threads' 
    AND column_name = 'banner'
  ) THEN
    ALTER TABLE public.threads ADD COLUMN banner TEXT;
    RAISE NOTICE 'Added banner column to threads table';
  END IF;
END $$;

-- ============================================================================
-- Create helper function to clean up orphaned storage files
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_forum_assets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  RAISE NOTICE '✅ Cleanup completed';
END;
$$;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- ============================================================================
-- Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Forum assets storage bucket setup completed';
  RAISE NOTICE '   - Bucket: forum-assets';
  RAISE NOTICE '   - Max file size: 2MB';
  RAISE NOTICE '   - Allowed types: JPEG, PNG, GIF, WebP';
  RAISE NOTICE '   - Folders: topic-icons, thread-banners, category-icons';
END $$;
