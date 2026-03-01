-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  user_id TEXT REFERENCES forum_users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'hiring', 'report', 'bug', 'feature', 'general', 'account'
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  assigned_to TEXT REFERENCES forum_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create support_ticket_replies table
CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES forum_users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_ticket ON support_ticket_replies(ticket_id);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_replies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Staff can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Staff can update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view replies to their tickets" ON support_ticket_replies;
DROP POLICY IF EXISTS "Staff can view all replies" ON support_ticket_replies;
DROP POLICY IF EXISTS "Users can reply to their tickets" ON support_ticket_replies;
DROP POLICY IF EXISTS "Staff can reply to any ticket" ON support_ticket_replies;

-- Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
  ON support_tickets
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Staff can view all tickets"
  ON support_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forum_users
      WHERE forum_users.id = auth.uid()::text
      AND forum_users.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Users can create tickets"
  ON support_tickets
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Staff can update tickets"
  ON support_tickets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM forum_users
      WHERE forum_users.id = auth.uid()::text
      AND forum_users.role IN ('admin', 'moderator')
    )
  );

-- Policies for support_ticket_replies
CREATE POLICY "Users can view replies to their tickets"
  ON support_ticket_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_ticket_replies.ticket_id
      AND support_tickets.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Staff can view all replies"
  ON support_ticket_replies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forum_users
      WHERE forum_users.id = auth.uid()::text
      AND forum_users.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Users can reply to their tickets"
  ON support_ticket_replies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_ticket_replies.ticket_id
      AND support_tickets.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Staff can reply to any ticket"
  ON support_ticket_replies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forum_users
      WHERE forum_users.id = auth.uid()::text
      AND forum_users.role IN ('admin', 'moderator')
    )
  );

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INT;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM support_tickets;
  new_number := 'TKT-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON support_tickets;
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();
