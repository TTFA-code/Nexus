-- =================================================================================
-- DEBUG: Check Created Matches
-- =================================================================================

RAISE NOTICE '--- LATEST MATCHES (Last 10 min) ---';
SELECT id, game_mode_id, status, created_at 
FROM public.matches 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

RAISE NOTICE '--- PLAYERS IN MATCHES ---';
SELECT m.status, mp.user_id, mp.team, mp.created_at
FROM public.match_players mp
JOIN public.matches m ON mp.match_id = m.id
WHERE mp.created_at > NOW() - INTERVAL '10 minutes';

RAISE NOTICE '--- READY CHECKS ---';
SELECT * FROM public.ready_checks 
WHERE created_at > NOW() - INTERVAL '10 minutes';
