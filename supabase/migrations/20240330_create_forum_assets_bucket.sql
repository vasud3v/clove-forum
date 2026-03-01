-- Create forum-assets storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum-assets',
  'forum-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  file_size_limit = 5242880;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for forum assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload forum assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own forum assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own forum assets" ON storage.objects;

-- Set up RLS policies for forum-assets bucket
-- Allow public read access
CREATE POLICY "Public read access for forum assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'forum-assets');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload forum assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'forum-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own forum assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'forum-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own forum assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'forum-assets' 
  AND auth.role() = 'authenticated'
);
