-- Add thumbnail column to threads table
-- This allows thread creators to upload custom avatars/thumbnails for their threads

ALTER TABLE public.threads 
ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Add comment
COMMENT ON COLUMN public.threads.thumbnail IS 'Custom thumbnail/avatar URL for the thread (uploaded by thread creator)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_threads_thumbnail ON public.threads(thumbnail) WHERE thumbnail IS NOT NULL;
