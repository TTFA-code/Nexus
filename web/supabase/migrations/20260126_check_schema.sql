-- =================================================================================
-- DEBUG: Check Matches Table Schema
-- =================================================================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches';
