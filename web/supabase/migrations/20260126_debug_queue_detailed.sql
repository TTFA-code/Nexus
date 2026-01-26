-- =================================================================================
-- DEBUG: Detailed Queue Check
-- =================================================================================

-- Shows who is waiting and EXACTLY what they are waiting for (Game + Mode)
SELECT 
    q.discord_id,
    q.mmr,
    q.joined_at,
    gm.name AS mode_name,
    gm.team_size,
    -- Assuming 'games' table exists and links from game_modes
    -- If 'games' table doesn't exist, this might fail, but based on UI code it should.
    (SELECT name FROM public.games WHERE id = gm.game_id) AS game_name
FROM public.matchmaking_queue q
JOIN public.game_modes gm ON q.game_mode_id = gm.id;
