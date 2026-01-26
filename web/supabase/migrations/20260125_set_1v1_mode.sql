-- =================================================================================
-- DEV TOOL: Set Team Size to 1 (Enable 1v1 Testing)
-- =================================================================================

-- Update all game modes to be 1v1 (Team Size = 1, Total Players = 2)
UPDATE public.game_modes
SET team_size = 1
WHERE is_active = true;

RAISE NOTICE 'All active game modes updated to 1v1 (Required: 2 Players).';
