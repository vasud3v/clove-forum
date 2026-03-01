-- ============================================================================
-- Add default topics to categories
-- ============================================================================

-- Check if topics exist, if not create some default ones
-- This is just an example - adjust based on your actual categories

-- Example: Add topics to Introductions category
INSERT INTO public.topics (id, name, description, category_id, thread_count, post_count, last_activity)
SELECT 
  'topic-intro-general',
  'General Introductions',
  'Introduce yourself to the community',
  id,
  0,
  0,
  NOW()
FROM public.categories
WHERE name = 'Introductions'
ON CONFLICT (id) DO NOTHING;

-- You can add more topics for other categories here
-- Example structure:
-- INSERT INTO public.topics (id, name, description, category_id, thread_count, post_count, last_activity)
-- SELECT 
--   'topic-id',
--   'Topic Name',
--   'Topic Description',
--   id,
--   0,
--   0,
--   NOW()
-- FROM public.categories
-- WHERE name = 'Category Name'
-- ON CONFLICT (id) DO NOTHING;

-- Update existing threads to assign them to topics (optional)
-- This assigns all threads in Introductions to the General Introductions topic
UPDATE public.threads
SET topic_id = 'topic-intro-general'
WHERE category_id IN (SELECT id FROM public.categories WHERE name = 'Introductions')
AND topic_id IS NULL;
