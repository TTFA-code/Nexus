-- =================================================================================
-- FIX: Safe 30-Second Schedule (Upsert)
-- =================================================================================

-- cron.schedule with a name updates the existing job if it exists.
-- We do not need to explicitly unschedule (which errors if missing).

-- 1. Schedule Job 1 (Runs at :00 seconds)
SELECT cron.schedule(
    'matchmaker-tick',
    '* * * * *',
    'SELECT public.find_match();'
);

-- 2. Schedule Job 2 (Runs at :30 seconds via sleep)
SELECT cron.schedule(
    'matchmaker-tick-30',
    '* * * * *',
    'SELECT pg_sleep(30); SELECT public.find_match();'
);

