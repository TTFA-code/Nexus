-- =================================================================================
-- TOOL: Clear Queue (Unstick Players)
-- =================================================================================

DELETE FROM public.matchmaking_queue;

RAISE NOTICE 'Queue has been cleared. You should be able to join again.';
