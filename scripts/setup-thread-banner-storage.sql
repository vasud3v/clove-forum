-- Create storage bucket for thread banners if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-uploads', 'forum-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload thread banners" ON storage.objects;
DROP POLICY IF EXISTS "Public can view thread banners" ON storage.objects;
DROP POLICY IF EXISTS "Thread authors can delete their banners" ON storage.objects;

-- Set up storage policies for thread banners
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload thread banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'forum-uploads' AND (storage.foldername(name))[1] = 'thread-banners');

-- Allow public read access
CREATE POLICY "Public can view thread banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'forum-uploads' AND (storage.foldername(name))[1] = 'thread-banners');

-- Allow thread authors to delete their banners
CREATE POLICY "Thread authors can delete their banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'forum-uploads' AND (storage.foldername(name))[1] = 'thread-banners');

-- Add banner column to threads table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'threads' AND column_name = 'banner'
  ) THEN
    ALTER TABLE threads ADD COLUMN banner TEXT;
  END IF;
END $$;

-- Create index on banner column for faster queries
CREATE INDEX IF NOT EXISTS idx_threads_banner ON threads(banner) WHERE banner IS NOT NULL;
