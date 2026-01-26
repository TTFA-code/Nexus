-- =================================================================================
-- FEATURE: Add Wins/Losses to Player MMR
-- =================================================================================

ALTER TABLE public.player_mmr
ADD COLUMN wins INT DEFAULT 0,
ADD COLUMN losses INT DEFAULT 0;

RAISE NOTICE 'Added wins/losses columns to player_mmr.';
