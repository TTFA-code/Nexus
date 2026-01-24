-- =================================================================================
-- NEXUS - SEED GAMES & GAME MODES
-- =================================================================================
-- Populates the games and game_modes tables with initial data
-- Run this AFTER schema.sql
-- =================================================================================

-- =================================================================================
-- 1. INSERT GAMES
-- =================================================================================

-- Clear existing data (optional - remove if you want to keep existing data)
-- DELETE FROM game_modes;
-- DELETE FROM games;

-- Insert Games with fixed UUIDs for consistency
INSERT INTO games (id, name, slug, icon_url) VALUES
    ('a1111111-1111-1111-1111-111111111111'::uuid, 'eFootball', 'efootball', 'https://cdn2.steamgriddb.com/icon_thumb/426b29ee7ce3cc98c80a13c1c5ad7cfe.png'),
    ('a2222222-2222-2222-2222-222222222222'::uuid, 'eFootball Mobile', 'efootball-mobile', 'https://play-lh.googleusercontent.com/lqvVIkYmkzPXjX7AW_x0hPQSvGDYprT2dGZ70HcKSxJGRlJAjZq4RwNJ2QmA4TXmHg'),
    ('a3333333-3333-3333-3333-333333333333'::uuid, 'EA Sports FC', 'eafc', 'https://image.api.playstation.com/vulcan/ap/rnd/202310/0919/16ad3935e3a228f22863a4eacd5bd4972b25ffe7c117ed90.png'),
    ('a4444444-4444-4444-4444-444444444444'::uuid, 'Rocket League', 'rocket-league', 'https://cdn2.steamgriddb.com/icon_thumb/426b29ee7ce3cc98c80a13c1c5ad7cfe.png'),
    ('a5555555-5555-5555-5555-555555555555'::uuid, 'Football Manager', 'football-manager', 'https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/2252570/c0a2e1e6c4a6fb5f75fe0fb5f3a3703fc7bfc61a.jpg')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    icon_url = EXCLUDED.icon_url;

-- =================================================================================
-- 2. INSERT GAME MODES (Global - No Guild Restriction)
-- =================================================================================

-- eFootball Modes
INSERT INTO game_modes (id, guild_id, game_id, name, team_size, is_active) VALUES
    ('b1111111-1111-1111-1111-111111111111'::uuid, NULL, 'a1111111-1111-1111-1111-111111111111'::uuid, '1v1', 1, true),
    ('b1111111-2222-2222-2222-222222222222'::uuid, NULL, 'a1111111-1111-1111-1111-111111111111'::uuid, '2v2', 2, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    team_size = EXCLUDED.team_size,
    is_active = EXCLUDED.is_active;

-- eFootball Mobile Modes
INSERT INTO game_modes (id, guild_id, game_id, name, team_size, is_active) VALUES
    ('b2222222-1111-1111-1111-111111111111'::uuid, NULL, 'a2222222-2222-2222-2222-222222222222'::uuid, '1v1', 1, true),
    ('b2222222-2222-2222-2222-222222222222'::uuid, NULL, 'a2222222-2222-2222-2222-222222222222'::uuid, '2v2', 2, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    team_size = EXCLUDED.team_size,
    is_active = EXCLUDED.is_active;

-- EA Sports FC Modes
INSERT INTO game_modes (id, guild_id, game_id, name, team_size, is_active) VALUES
    ('b3333333-1111-1111-1111-111111111111'::uuid, NULL, 'a3333333-3333-3333-3333-333333333333'::uuid, '1v1', 1, true),
    ('b3333333-2222-2222-2222-222222222222'::uuid, NULL, 'a3333333-3333-3333-3333-333333333333'::uuid, '2v2', 2, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    team_size = EXCLUDED.team_size,
    is_active = EXCLUDED.is_active;

-- Rocket League Modes
INSERT INTO game_modes (id, guild_id, game_id, name, team_size, is_active) VALUES
    ('b4444444-1111-1111-1111-111111111111'::uuid, NULL, 'a4444444-4444-4444-4444-444444444444'::uuid, '1v1', 1, true),
    ('b4444444-2222-2222-2222-222222222222'::uuid, NULL, 'a4444444-4444-4444-4444-444444444444'::uuid, '2v2', 2, true),
    ('b4444444-3333-3333-3333-333333333333'::uuid, NULL, 'a4444444-4444-4444-4444-444444444444'::uuid, '3v3 Standard', 3, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    team_size = EXCLUDED.team_size,
    is_active = EXCLUDED.is_active;

-- Football Manager Modes
INSERT INTO game_modes (id, guild_id, game_id, name, team_size, is_active) VALUES
    ('b5555555-1111-1111-1111-111111111111'::uuid, NULL, 'a5555555-5555-5555-5555-555555555555'::uuid, '1v1', 1, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    team_size = EXCLUDED.team_size,
    is_active = EXCLUDED.is_active;

-- =================================================================================
-- 3. VERIFICATION QUERIES
-- =================================================================================

-- View all games
SELECT 
    id,
    name,
    slug,
    icon_url
FROM games
ORDER BY name;

-- View all game modes with their games
SELECT 
    gm.id,
    g.name as game_name,
    gm.name as mode_name,
    gm.team_size,
    gm.is_active,
    CASE 
        WHEN gm.guild_id IS NULL THEN 'Global'
        ELSE gm.guild_id
    END as scope
FROM game_modes gm
JOIN games g ON gm.game_id = g.id
ORDER BY g.name, gm.team_size;

-- =================================================================================
-- SUMMARY
-- =================================================================================
-- Games: 5
-- - eFootball (2 modes: 1v1, 2v2)
-- - eFootball Mobile (2 modes: 1v1, 2v2)
-- - EA Sports FC (2 modes: 1v1, 2v2)
-- - Rocket League (3 modes: 1v1, 2v2, 3v3 Standard)
-- - Football Manager (1 mode: 1v1)
-- 
-- Total Game Modes: 10
-- All modes are GLOBAL (guild_id = NULL) and can be used across all servers
-- =================================================================================
