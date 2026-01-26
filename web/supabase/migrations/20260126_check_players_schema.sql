-- =================================================================================
-- DEBUG: Check Players Table Schema (Bridge)
-- =================================================================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'players';
