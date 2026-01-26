-- =================================================================================
-- DEBUG: Check Match Result Schema
-- =================================================================================

SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE (table_name = 'matches' AND column_name = 'winner_team')
   OR (table_name = 'match_players' AND column_name = 'team')
ORDER BY table_name;
