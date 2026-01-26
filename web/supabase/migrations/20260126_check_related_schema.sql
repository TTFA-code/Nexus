-- =================================================================================
-- DEBUG: Check Related Tables Schema
-- =================================================================================

SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('match_players', 'ready_checks')
ORDER BY table_name, column_name;
