-- Add 'topic' to the allowed target_type values in moderation_logs

-- Drop the old constraint
ALTER TABLE public.moderation_logs 
DROP CONSTRAINT IF EXISTS moderation_logs_target_type_check;

-- Add new constraint with 'topic' included
ALTER TABLE public.moderation_logs 
ADD CONSTRAINT moderation_logs_target_type_check 
CHECK (target_type IN ('thread', 'post', 'user', 'category', 'report', 'topic'));
