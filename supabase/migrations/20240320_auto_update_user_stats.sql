-- ============================================================================
-- Auto-update user statistics (post_count, reputation)
-- ============================================================================

-- Function to update user post count when a post is created/deleted
CREATE OR REPLACE FUNCTION update_user_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment post count
    UPDATE forum_users
    SET post_count = post_count + 1
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement post count
    UPDATE forum_users
    SET post_count = GREATEST(post_count - 1, 0)
    WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update post count on insert/delete
DROP TRIGGER IF EXISTS trigger_update_user_post_count ON posts;
CREATE TRIGGER trigger_update_user_post_count
AFTER INSERT OR DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_user_post_count();

-- Function to update user reputation from reputation_events
CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add reputation points
    UPDATE forum_users
    SET reputation = reputation + NEW.points
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Subtract reputation points
    UPDATE forum_users
    SET reputation = reputation - OLD.points
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update reputation on reputation_events changes
DROP TRIGGER IF EXISTS trigger_update_user_reputation ON reputation_events;
CREATE TRIGGER trigger_update_user_reputation
AFTER INSERT OR DELETE ON reputation_events
FOR EACH ROW
EXECUTE FUNCTION update_user_reputation();

-- One-time fix: Calculate and update existing post counts
UPDATE forum_users u
SET post_count = (
  SELECT COUNT(*)
  FROM posts p
  WHERE p.author_id = u.id
);

-- One-time fix: Calculate and update existing reputation
UPDATE forum_users u
SET reputation = COALESCE((
  SELECT SUM(points)
  FROM reputation_events r
  WHERE r.user_id = u.id
), 0);
