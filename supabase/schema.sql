-- ==================================================
-- PART 1: CORE NEXUS SYSTEM (Clubs, Users, Queues)
-- ==================================================

-- 1. CLUBS (Multi-Tenancy / Discord Servers)
CREATE TABLE IF NOT EXISTS clubs (
    guild_id TEXT PRIMARY KEY, -- Discord Server ID
    name VARCHAR(100),
    premium_tier INT DEFAULT 0,       -- 0=Free, 1=Pro
    announcement_channel_id TEXT, -- Where bot posts updates
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. GAME MODES (e.g. "Valorant In-House", "FIFA 1v1")
CREATE TABLE IF NOT EXISTS game_modes (
    id SERIAL PRIMARY KEY,
    guild_id TEXT REFERENCES clubs(guild_id),
    name VARCHAR(50) NOT NULL,
    team_size INT DEFAULT 5,          -- 1 for FIFA, 5 for Valorant
    picking_method TEXT DEFAULT 'RANDOM', -- 'RANDOM', 'CAPTAINS'
    voice_enabled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. PLAYERS (The Master User List)
-- All other tables link back to this 'user_id'
CREATE TABLE IF NOT EXISTS players (
    user_id TEXT PRIMARY KEY, -- Discord User ID
    username VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PLAYER RATINGS (MMR / Elo per Game Mode)
CREATE TABLE IF NOT EXISTS player_ratings (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES players(user_id),
    game_mode_id INT REFERENCES game_modes(id),
    mmr INT DEFAULT 1200,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    win_streak INT DEFAULT 0,
    UNIQUE(user_id, game_mode_id)
);

-- 5. ACTIVE QUEUES (Who is waiting to play?)
CREATE TABLE IF NOT EXISTS queues (
    id SERIAL PRIMARY KEY,
    game_mode_id INT REFERENCES game_modes(id),
    user_id TEXT REFERENCES players(user_id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_mode_id, user_id)
);

-- 6. MATCH HISTORY (Standard Games)
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    game_mode_id INT REFERENCES game_modes(id),
    winner_team INT, -- 1 or 2
    mvp_user_id TEXT REFERENCES players(user_id),
    status TEXT DEFAULT 'finished', -- 'ongoing', 'finished'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    approval_status TEXT DEFAULT 'approved',
    evidence_url TEXT
);

-- 7. MATCH PLAYERS (Who played in which match?)
CREATE TABLE IF NOT EXISTS match_players (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id),
    user_id TEXT REFERENCES players(user_id),
    team INT, -- 1 or 2
    UNIQUE(match_id, user_id)
);

-- 8. LOBBIES (The Pre-Game Ready Check)
CREATE TABLE IF NOT EXISTS lobbies (
    id SERIAL PRIMARY KEY,
    game_mode_id INT REFERENCES game_modes(id),
    guild_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'ready_check', -- 'ready_check', 'failed', 'converted_to_match'
    message_id TEXT,
    channel_id TEXT
);

-- 9. LOBBY PLAYERS (Who is in the ready check?)
CREATE TABLE IF NOT EXISTS lobby_players (
    lobby_id INT REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES players(user_id),
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    PRIMARY KEY (lobby_id, user_id)
);


-- ==================================================
-- PART 2: TTFA MEDAL QUEST MODULE (The Operations Exam)
-- ==================================================

-- 10. TTFA PLAYER STATS (Extension of 'players')
-- Links 1-to-1 with the main players table
CREATE TABLE IF NOT EXISTS ttfa_player_stats (
    user_id TEXT PRIMARY KEY REFERENCES players(user_id),
    fifa_gg_id VARCHAR(100),
    
    -- The 4 Medal Pieces
    medal_1 BOOLEAN DEFAULT FALSE, -- Top 12 Tournament
    medal_2 BOOLEAN DEFAULT FALSE, -- Top 12 Tournament
    medal_3 BOOLEAN DEFAULT FALSE, -- Top 12 Tournament
    medal_4 BOOLEAN DEFAULT FALSE, -- Wellness 5K
    
    -- Game State
    immunity_expires_at TIMESTAMP WITH TIME ZONE,
    challenges_won INT DEFAULT 0,
    challenges_lost INT DEFAULT 0,
    current_streak INT DEFAULT 0
);

-- 11. TTFA CHALLENGES (The "Bounty Hunt" Matches)
-- Separate from standard matches because rules are different (BO5, Immunity)
CREATE TABLE IF NOT EXISTS ttfa_challenges (
    id SERIAL PRIMARY KEY,
    challenger_id TEXT REFERENCES players(user_id),
    defender_id TEXT REFERENCES players(user_id),
    target_medal_piece INT NOT NULL, -- Which piece is being stolen (1-4)
    
    status TEXT DEFAULT 'PENDING', -- PENDING, ACTIVE, COMPLETED, CANCELLED
    winner_id TEXT REFERENCES players(user_id),
    
    -- BO5 Score Tracking
    defender_wins INT DEFAULT 0,
    challenger_wins INT DEFAULT 0,
    
    match_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. TTFA WELLNESS RUNS (The 5K Approval Queue)
CREATE TABLE IF NOT EXISTS ttfa_wellness_runs (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES players(user_id),
    
    proof_url TEXT,
    comments TEXT,
    
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    reviewed_by TEXT,              -- Admin Discord ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. TTFA GLOBAL CONFIG
CREATE TABLE IF NOT EXISTS ttfa_config (
    key VARCHAR(50) PRIMARY KEY,
    value VARCHAR(100)
);

-- Insert Default Config safely
INSERT INTO ttfa_config (key, value)
VALUES ('window_status', 'CLOSED')
ON CONFLICT (key) DO NOTHING;

-- 14. MATCH REPORTS (Text-Only Admin Inbox)
CREATE TABLE IF NOT EXISTS match_reports (
    id SERIAL PRIMARY KEY,
    reporter_id TEXT REFERENCES players(user_id),
    game_mode_id INT REFERENCES game_modes(id),
    result_data JSONB, -- { score: string, opponent_username: string, outcome: 'win' | 'loss' }
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    discord_thread_id TEXT,
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
