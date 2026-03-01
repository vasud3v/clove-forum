-- Add icon and badge fields to topics table
ALTER TABLE public.topics 
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS badge TEXT;

-- Add comments
COMMENT ON COLUMN public.topics.icon IS 'URL to topic icon image';
COMMENT ON COLUMN public.topics.badge IS 'Badge style for topic (e.g., new, hot, trending, official, etc.)';
