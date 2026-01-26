-- =================================================================================
-- DEBUG: Check Configuration (Clean)
-- =================================================================================

-- 1. Check Game Modes (Verify team_size is 1)
SELECT id, name, team_size 
FROM public.game_modes 
WHERE is_active = true
ORDER BY name;

-- 2. Check Current Queue (Verify game_mode_id matches)
SELECT discord_id, mmr, game_mode_id, joined_at 
FROM public.matchmaking_queue;
