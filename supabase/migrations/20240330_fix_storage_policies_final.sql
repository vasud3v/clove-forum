-- Fix storage policies for forum-assets bucket
-- Run this in Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for forum assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload forum assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own forum assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own forum assets" ON storage.objects;

-- Create SELECT policy (public read)
CREATE POLICY "Public read access for forum assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum-assets');

-- Create INSERT policy (authenticated upload)
CREATE POLICY "Authenticated users can upload forum assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'forum-assets' 
  AND auth.role() = 'authenticated'
);

-- Create UPDATE policy (authenticated update)
CREATE POLICY "Users can update their own forum assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'forum-assets' 
  AND auth.role() = 'authenticated'
);

-- Create DELETE policy (authenticated delete)
CREATE POLICY "Users can delete their own forum assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'forum-assets' 
  AND auth.role() = 'authenticated'
);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%forum assets%'
ORDER BY policyname;
