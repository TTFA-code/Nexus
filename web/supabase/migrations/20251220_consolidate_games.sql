-- 1. DROP EXISTING DEPENDENCIES
-- We need to drop tables that depend on game_modes or game_modes itself to recreate it cleanly.
-- WARNING: This deletes existing data.
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS queues CASCADE;
DROP TABLE IF EXISTS player_ratings CASCADE;
DROP TABLE IF EXISTS lobby_players CASCADE;
DROP TABLE IF EXISTS lobbies CASCADE;
DROP TABLE IF EXISTS game_modes CASCADE;

-- 2. The Parent Table: Supported Games
-- This holds the "Logos" and main titles.
CREATE TABLE IF NOT EXISTS games (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE, -- e.g., "League of Legends"
  slug text NOT NULL UNIQUE, -- e.g., "lol"
  icon_url text,
  cover_image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. The Child Table: Game Modes (Presets)
-- Handles both GLOBAL (Standard) and GUILD (Custom) types.
CREATE TABLE IF NOT EXISTS game_modes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  guild_id text, -- NULL = Standard/Global. Value = Private/Custom.
  name text NOT NULL, -- e.g., "5v5 Draft Pick" or "Bob's 1v1 Arena"
  team_size int DEFAULT 5,
  description text,
  picking_method text DEFAULT 'RANDOM', -- Added back from previous schema to maintain compatibility
  voice_enabled boolean DEFAULT true,   -- Added back for compatibility
  json_settings jsonb DEFAULT '{}', -- Flexible config (bans, map, etc.)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Safety Index
-- Ensures quick lookups when filtering "Show me Global + My Guild's modes"
CREATE INDEX IF NOT EXISTS idx_game_modes_guild ON game_modes(guild_id);


-- 5. RE-CREATE DEPENDENT TABLES (Simplified for getting back up and running)
--   (You might want to check the original schema references to be exact, but this covers the known ones)

-- LOBBIES
CREATE TABLE IF NOT EXISTS lobbies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    game_mode_id uuid REFERENCES game_modes(id),
    guild_id VARCHAR(20),
    status VARCHAR(20) DEFAULT 'PENDING',
    region VARCHAR(20) DEFAULT 'US-East',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    require_vc boolean DEFAULT false,
    voice_channel_id VARCHAR(20)
);

-- LOBBY PLAYERS
CREATE TABLE IF NOT EXISTS lobby_players (
    lobby_id uuid REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id VARCHAR(20), -- REFERENCES players(user_id) - assuming players table exists
    team INT DEFAULT 1,
    is_ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (lobby_id, user_id)
);

-- QUEUES (Active Queues)
CREATE TABLE IF NOT EXISTS queues (
    id SERIAL PRIMARY KEY,
    game_mode_id uuid REFERENCES game_modes(id),
    user_id VARCHAR(20),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_mode_id, user_id)
);

-- MATCHES
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    game_mode_id uuid REFERENCES game_modes(id),
    winner_team INT, -- 1 or 2
    mvp_user_id VARCHAR(20),
    finished_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PLAYER RATINGS
CREATE TABLE IF NOT EXISTS player_ratings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20),
    game_mode_id uuid REFERENCES game_modes(id),
    mmr INT DEFAULT 1200,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    win_streak INT DEFAULT 0,
    UNIQUE(user_id, game_mode_id)
);


-- 6. SEED DATA for GAMES
INSERT INTO games (name, slug, is_active)
VALUES 
    ('League of Legends', 'lol', true),
    ('Valorant', 'valorant', true),
    ('Rocket League', 'rocket-league', true),
    ('EA FC 24', 'eafc', true)
ON CONFLICT (slug) DO NOTHING;

-- 7. SEED DATA for GLOBAL MODES (Standard Presets)
-- We need to get the IDs we just inserted.
DO $$
DECLARE
    lol_id uuid;
    val_id uuid;
    rl_id uuid;
    fifa_id uuid;
BEGIN
    SELECT id INTO lol_id FROM games WHERE slug = 'lol';
    SELECT id INTO val_id FROM games WHERE slug = 'valorant';
    SELECT id INTO rl_id FROM games WHERE slug = 'rocket-league';
    SELECT id INTO fifa_id FROM games WHERE slug = 'eafc';

    -- LoL Modes
    INSERT INTO game_modes (game_id, name, team_size, picking_method, guild_id) VALUES
    (lol_id, '5v5 Tournament Draft', 5, 'CAPTAINS', NULL),
    (lol_id, '5v5 Blind Pick', 5, 'RANDOM', NULL),
    (lol_id, '1v1 Showdown', 1, 'RANDOM', NULL);

    -- Valorant Modes
    INSERT INTO game_modes (game_id, name, team_size, picking_method, guild_id) VALUES
    (val_id, '5v5 Standard', 5, 'CAPTAINS', NULL),
    (val_id, '2v2 Wingman', 2, 'RANDOM', NULL);
    
    -- Rocket League
    INSERT INTO game_modes (game_id, name, team_size, picking_method, guild_id) VALUES
    (rl_id, '3v3 Standard', 3, 'RANDOM', NULL),
    (rl_id, '2v2 Doubles', 2, 'RANDOM', NULL);

    -- FIFA
    INSERT INTO game_modes (game_id, name, team_size, picking_method, guild_id) VALUES
    (fifa_id, '1v1 Friendly', 1, 'RANDOM', NULL);
END $$;
