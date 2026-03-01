-- Add default "General" topic to categories that don't have any topics
-- This ensures all categories follow the hierarchy: Category → Topic → Thread → Post

-- Insert a "General" topic for each category that doesn't have topics
INSERT INTO public.topics (id, name, description, category_id, thread_count, post_count, last_activity)
SELECT 
  'topic-general-' || c.id,
  'General',
  'General discussion for ' || c.name,
  c.id,
  c.thread_count,
  c.post_count,
  c.last_activity
FROM public.categories c
WHERE NOT EXISTS (
  SELECT 1 FROM public.topics t WHERE t.category_id = c.id
)
ON CONFLICT (id) DO NOTHING;

-- Update threads that don't have a topic_id to use the new General topic
UPDATE public.threads t
SET topic_id = 'topic-general-' || t.category_id
WHERE t.topic_id IS NULL
AND EXISTS (
  SELECT 1 FROM public.topics tp WHERE tp.id = 'topic-general-' || t.category_id
);
