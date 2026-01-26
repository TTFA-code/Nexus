-- =================================================================================
-- UPDATE: 30-Second Matchmaker Schedule
-- =================================================================================

-- 1. Unschedule existing job
SELECT cron.unschedule('matchmaker-tick');
SELECT cron.unschedule('matchmaker-tick-30'); -- Safety clear

-- 2. Schedule Job 1 (Runs at :00 seconds of every minute)
SELECT cron.schedule(
    'matchmaker-tick',
    '* * * * *',
    'SELECT public.find_match();'
);

-- 3. Schedule Job 2 (Runs at :30 seconds of every minute using sleep)
-- Note: This consumes a connection for 30s during the wait, but ensures 30s interval.
SELECT cron.schedule(
    'matchmaker-tick-30',
    '* * * * *',
    'SELECT pg_sleep(30); SELECT public.find_match();'
);

RAISE NOTICE 'Matchmaker scheduled to run every 30 seconds.';
