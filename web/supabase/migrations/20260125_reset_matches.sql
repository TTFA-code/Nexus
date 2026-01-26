-- =================================================================================
-- DEV TOOL: Reset/Force-Close All Matches
-- =================================================================================

-- 1. Mark all open matches as finished (to unblock players)
UPDATE public.matches
SET status = 'finished', finished_at = NOW()
WHERE finished_at IS NULL;

-- 2. Clear Queue (Optional, but good for reset)
DELETE FROM public.matchmaking_queue;

-- 3. Clear Ready Checks
DELETE FROM public.ready_checks;

-- 4. Log
DO $$
BEGIN
    RAISE NOTICE 'All active matches have been force-closed and queue cleared.';
END $$;
