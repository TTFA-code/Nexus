-- =================================================================================
-- ENABLE MATCHMAKER SCHEDULE
-- =================================================================================

-- Enable the extension if not already enabled (Requires Superuser, might fail if restricted)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job to run every minute
-- Note: Supabase free tier pg_cron minimal interval is 1 minute usually.
-- To emulate 30s, we can't easily do it with standard Cron syntax in one job.
-- We can create two jobs: one at * * * * * and one that sleeps 30s? No, sleep is blocking.
-- For now, we stick to 1 minute.
SELECT cron.schedule(
    'matchmaker-tick', -- name of the job
    '* * * * *',       -- every minute
    'SELECT public.find_match();'
);

-- Check scheduled jobs
-- SELECT * FROM cron.job;
