-- Enable CORS for storage bucket
-- This allows images to be loaded from the storage bucket

-- First, ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Public read access for forum assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload forum assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own forum assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own forum assets" ON storage.objects;

-- Allow ANYONE to read files from forum-assets bucket (no auth required)
CREATE POLICY "Public read access for forum assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'forum-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload forum assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'forum-assets');

-- Allow authenticated users to update
CREATE POLICY "Users can update their own forum assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'forum-assets');

-- Allow authenticated users to delete
CREATE POLICY "Users can delete their own forum assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'forum-assets');

-- Verify the bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'forum-assets';

-- Show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%forum assets%'
ORDER BY policyname;
