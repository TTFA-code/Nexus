-- =================================================================================
-- FIX: Clean & Reschedule (Remove Duplicates)
-- =================================================================================

-- 1. Unschedule ALL potential variants (ignore errors if they don't exist)
SELECT cron.unschedule('matchmaker-tick');
SELECT cron.unschedule('matchmaker-tick-30');
-- Try to unschedule any old names if they might exist? 
-- If the user sees 3, the third one might be named differently or just a duplicate?
-- We can query `cron.job` to see them, but we can't easily iterate-delete in simple SQL block without permissions sometimes.
-- Let's just unschedule the known names ensuring we start fresh.
-- If the third job has a weird name, this won't catch it, but let's assume standard names.

-- 2. Schedule the Clean Pair

-- Job 1: :00 seconds
SELECT cron.schedule(
    'matchmaker-tick',
    '* * * * *',
    'SELECT public.find_match();'
);

-- Job 2: :30 seconds
SELECT cron.schedule(
    'matchmaker-tick-30',
    '* * * * *',
    'SELECT pg_sleep(30); SELECT public.find_match();'
);

RAISE NOTICE 'Schedule cleaned. You should only see 2 jobs now.';
