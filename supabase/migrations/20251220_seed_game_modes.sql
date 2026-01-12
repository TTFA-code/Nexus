-- Migration: 20251220_seed_game_modes
-- Description: Clear existing game modes and seed new Nexus Standard list

-- 1. Clear existing modes (Cascade if necessary, or just delete)
DELETE FROM game_modes;

-- 2. Insert Nexus Standard Modes (guild_id IS NULL)
INSERT INTO game_modes (name, team_size, picking_method, guild_id, is_active) VALUES
-- FIFA
('FIFA (1v1)', 1, 'RANDOM', NULL, TRUE),
('FIFA (2v2)', 2, 'RANDOM', NULL, TRUE),

-- League of Legends
('League of Legends (5v5 Tornament Draft)', 5, 'CAPTAINS', NULL, TRUE),
('League of Legends (5v5 Scrim)', 5, 'RANDOM', NULL, TRUE),
('League of Legends (5v5 Blitz)', 5, 'RANDOM', NULL, TRUE),

-- Rocket League
('Rocket League (2v2)', 2, 'RANDOM', NULL, TRUE),
('Rocket League (1v1)', 1, 'RANDOM', NULL, TRUE);
