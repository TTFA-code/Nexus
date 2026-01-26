-- =================================================================================
-- FIX: Restore Missing 30s Job
-- =================================================================================

-- It seems only job 6 (tick) exists. We need tick-30.

SELECT cron.schedule(
    'matchmaker-tick-30',
    '* * * * *',
    'SELECT pg_sleep(30); SELECT public.find_match();'
);

RAISE NOTICE 'Added the second (30s delay) matchmaker job.';
