-- Debug Matches and Match Players
-- Replace this UUID with the one from your logs if different: 'c34d1347-9858-4179-84d5-8577fdd941b4'

WITH target_user AS (
    SELECT 'c34d1347-9858-4179-84d5-8577fdd941b4'::uuid as user_uuid
)
SELECT 
    m.id as match_id,
    m.status,
    m.started_at as created_at,
    mp.user_id as player_discord_id,
    p.username,
    p.uuid_link
FROM public.matches m
LEFT JOIN public.match_players mp ON m.id = mp.match_id
LEFT JOIN public.players p ON mp.user_id = p.user_id
CROSS JOIN target_user u
WHERE p.uuid_link = u.user_uuid::text
OR mp.user_id IN (SELECT user_id FROM players WHERE uuid_link = u.user_uuid::text)
ORDER BY m.started_at DESC
LIMIT 5;
