-- Create announcement_banners table for admin-controlled banners
CREATE TABLE IF NOT EXISTS announcement_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'hiring', 'announcement', 'warning'
  link_text TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_dismissible BOOLEAN DEFAULT true,
  created_by TEXT REFERENCES forum_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create index for active banners
CREATE INDEX IF NOT EXISTS idx_announcement_banners_active ON announcement_banners(is_active, expires_at);

-- Enable RLS
ALTER TABLE announcement_banners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active banners" ON announcement_banners;
DROP POLICY IF EXISTS "Admins and moderators can manage banners" ON announcement_banners;

-- Policy: Everyone can view active banners
CREATE POLICY "Anyone can view active banners"
  ON announcement_banners
  FOR SELECT
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Policy: Only admins and moderators can manage banners
CREATE POLICY "Admins and moderators can manage banners"
  ON announcement_banners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM forum_users
      WHERE forum_users.id = auth.uid()::text
      AND forum_users.role IN ('admin', 'moderator')
    )
  );

-- Insert a default hiring banner
INSERT INTO announcement_banners (title, message, type, link_text, link_url, is_active, is_dismissible)
VALUES (
  'We''re Hiring Staff!',
  'Join our moderation team! We''re looking for passionate moderators and community managers to help grow our forum.',
  'hiring',
  'Apply Now',
  '/support?category=hiring',
  true,
  true
) ON CONFLICT DO NOTHING;
