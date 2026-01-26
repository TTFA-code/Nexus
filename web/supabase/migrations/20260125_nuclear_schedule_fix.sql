-- =================================================================================
-- FIX: NUCLEAR CLEANUP (Remove ALL Matchmaker Jobs)
-- =================================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Iterate over every job that runs 'find_match' and unschedule it by ID
    FOR r IN SELECT jobid FROM cron.job WHERE command LIKE '%find_match%' LOOP
        PERFORM cron.unschedule(r.jobid);
        RAISE NOTICE 'Unscheduling job ID: %', r.jobid;
    END LOOP;
    
    RAISE NOTICE 'All matchmaker jobs have been removed.';
END $$;

-- Re-schedule the correct pair ONLY after cleanup is confirmed
-- You can run this block immediately after, or separately.
-- Let's do it here to ensure "Fix" means "Fix and Restore".

SELECT cron.schedule(
    'matchmaker-tick',
    '* * * * *',
    'SELECT public.find_match();'
);

SELECT cron.schedule(
    'matchmaker-tick-30',
    '* * * * *',
    'SELECT pg_sleep(30); SELECT public.find_match();'
);

RAISE NOTICE 'Schedule restored to exactly 2 jobs.';
