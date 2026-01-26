-- =================================================================================
-- DEBUG: Check Player MMR Columns
-- =================================================================================

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'player_mmr';
