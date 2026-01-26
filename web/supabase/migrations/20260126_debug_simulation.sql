-- 1. Show Anchor
SELECT user_id AS anchor_id, mmr, joined_at, 
    100 + (EXTRACT(EPOCH FROM (NOW() - joined_at)) * 6) as radius
FROM public.matchmaking_queue
ORDER BY joined_at ASC
LIMIT 1;

-- 2. Show Candidates for that Anchor
-- (Hardcoding the logic in a single query for inspection)
WITH anchor AS (
    SELECT user_id, mmr, joined_at, game_mode_id,
           (100 + (EXTRACT(EPOCH FROM (NOW() - joined_at)) * 6)) as radius
    FROM public.matchmaking_queue
    ORDER BY joined_at ASC
    LIMIT 1
)
SELECT q.user_id AS candidate_id, q.mmr, q.discord_id,
       a.mmr as anchor_mmr, a.radius as anchor_radius,
       (q.mmr >= (a.mmr - a.radius) AND q.mmr <= (a.mmr + a.radius)) as is_in_range
FROM public.matchmaking_queue q, anchor a
WHERE q.game_mode_id = a.game_mode_id
AND q.user_id != a.user_id;
