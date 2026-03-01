-- Setup Cron Jobs for Cache Refresh
-- Run this in your Supabase SQL Editor after running optimize-database-performance.sql

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule leaderboard cache refresh every 5 minutes
SELECT cron.schedule(
  'refresh-leaderboard-cache',
  '*/5 * * * *',
  $$SELECT refresh_leaderboard_cache()$$
);

-- Schedule online users cache update every minute
SELECT cron.schedule(
  'update-online-users-cache',
  '* * * * *',
  $$SELECT update_online_users_cache()$$
);

-- Verify cron jobs are scheduled
SELECT * FROM cron.job;

-- To unschedule a job (if needed):
-- SELECT cron.unschedule('refresh-leaderboard-cache');
-- SELECT cron.unschedule('update-online-users-cache');
