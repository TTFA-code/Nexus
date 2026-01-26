-- =================================================================================
-- FIX: Correct Team Sizes for Existing Modes
-- =================================================================================
-- Takes existing modes and ensures their team_size matches their name.
-- Default fallback is 1 (1v1) for safety if unknown, or keep as is?
-- User said: "remember we have 1v1... 2v2 and 3v3"

-- 1. Fix 1v1 Modes (Team Size = 1) -> Total 2 players
UPDATE public.game_modes
SET team_size = 1
WHERE name ILIKE '%1v1%';

-- 2. Fix 2v2 Modes (Team Size = 2) -> Total 4 players
UPDATE public.game_modes
SET team_size = 2
WHERE name ILIKE '%2v2%';

-- 3. Fix 3v3 Modes (Team Size = 3) -> Total 6 players
UPDATE public.game_modes
SET team_size = 3
WHERE name ILIKE '%3v3%';

-- 4. Fix 5v5 Modes (Team Size = 5) -> Total 10 players
UPDATE public.game_modes
SET team_size = 5
WHERE name ILIKE '%5v5%';

-- 5. Fallback: If team_size is NULL or 0, set to 1 (Safe default for testing)
UPDATE public.game_modes
SET team_size = 1
WHERE team_size IS NULL OR team_size = 0;

RAISE NOTICE 'Team sizes updated based on mode names (1v1=1, 2v2=2, 3v3=3, 5v5=5).';
