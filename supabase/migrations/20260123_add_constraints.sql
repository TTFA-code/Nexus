-- 20260123_add_constraints.sql
-- Add Foreign Key constraints to fix PGRST200 and ensure data integrity

-- 1. lobbies.creator_id -> profiles.id
-- Note: We assume profiles for all creators exist. If not, this might fail on existing dirty data.
ALTER TABLE lobbies
ADD CONSTRAINT lobbies_creator_id_fkey
FOREIGN KEY (creator_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 2. matches.game_mode_id -> game_modes.id
ALTER TABLE matches
ADD CONSTRAINT matches_game_mode_id_fkey
FOREIGN KEY (game_mode_id)
REFERENCES game_modes(id)
ON DELETE SET NULL;
