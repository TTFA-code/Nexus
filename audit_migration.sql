-- Post-Migration Audit Query
-- Run this in BOTH the Old and New Supabase SQL Editors to compare counts.

WITH table_counts AS (
    SELECT 'auth.users' as table_name, count(*) as row_count FROM auth.users
    UNION ALL
    SELECT 'public.guilds', count(*) FROM public.guilds
    UNION ALL
    SELECT 'public.profiles', count(*) FROM public.profiles
    UNION ALL
    SELECT 'public.game_modes', count(*) FROM public.game_modes
    UNION ALL
    SELECT 'public.lobbies', count(*) FROM public.lobbies
    UNION ALL
    SELECT 'public.matches', count(*) FROM public.matches
    UNION ALL
    SELECT 'public.match_players', count(*) FROM public.match_players
    UNION ALL
    SELECT 'public.mmr_history', count(*) FROM public.mmr_history
)
SELECT 
    table_name, 
    row_count, 
    now() as checked_at 
FROM table_counts
ORDER BY table_name;
