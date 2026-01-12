-- Migration: 20251220_update_game_modes
-- Description: Add guild_id to game_modes for custom server modes

ALTER TABLE game_modes 
ADD COLUMN guild_id TEXT NULL;

COMMENT ON COLUMN game_modes.guild_id IS 'NULL = Global (Nexus Official), Value = Custom (Server Specific)';
