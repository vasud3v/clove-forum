-- Create forum_settings table
CREATE TABLE IF NOT EXISTS forum_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_name TEXT NOT NULL DEFAULT 'Clove Forums',
  forum_description TEXT DEFAULT 'A modern forum community',
  allow_registration BOOLEAN DEFAULT true,
  require_email_verification BOOLEAN DEFAULT false,
  min_post_length INTEGER DEFAULT 10,
  max_post_length INTEGER DEFAULT 10000,
  posts_per_page INTEGER DEFAULT 20,
  threads_per_page INTEGER DEFAULT 25,
  allow_guest_viewing BOOLEAN DEFAULT true,
  enable_reputation BOOLEAN DEFAULT true,
  enable_reactions BOOLEAN DEFAULT true,
  enable_mentions BOOLEAN DEFAULT true,
  auto_lock_threads_days INTEGER DEFAULT 0,
  max_attachments_per_post INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO forum_settings (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE forum_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read settings
CREATE POLICY "Anyone can read forum settings"
  ON forum_settings
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert settings
CREATE POLICY "Only admins can insert forum settings"
  ON forum_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forum_users
      WHERE forum_users.id = auth.uid()::text
      AND forum_users.role IN ('admin', 'super_moderator')
    )
  );

-- Policy: Only admins can update settings
CREATE POLICY "Only admins can update forum settings"
  ON forum_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM forum_users
      WHERE forum_users.id = auth.uid()::text
      AND forum_users.role IN ('admin', 'super_moderator')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_forum_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER forum_settings_updated_at
  BEFORE UPDATE ON forum_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_settings_updated_at();
