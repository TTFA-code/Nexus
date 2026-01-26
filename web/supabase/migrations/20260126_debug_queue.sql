-- =================================================================================
-- DEBUG: Inspect Queue State
-- =================================================================================

SELECT 
    discord_id, 
    mmr, 
    joined_at, 
    EXTRACT(EPOCH FROM (NOW() - joined_at)) AS wait_seconds,
    game_mode_id
FROM public.matchmaking_queue
ORDER BY joined_at ASC;

-- Check Ready Checks as well (maybe match formed but UI didn't show?)
SELECT * FROM public.ready_checks ORDER BY created_at DESC LIMIT 5;
