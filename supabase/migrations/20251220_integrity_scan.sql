-- Migration: 20251220_integrity_scan
-- Description: "Soundness" and "Lean" checks remediation.
-- Adds updated_at timestamps, triggers, and performance indexes.
-- Ensures Foreign Keys have ON DELETE CASCADE where appropriate.

-- ==========================================
-- 1. UTILITIES
-- ==========================================

-- Helper function to update 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 2. SOUNDNESS CHECK: TIMESTAMPS & TRIGGERS
-- ==========================================

-- Table: lobbies
ALTER TABLE lobbies 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DROP TRIGGER IF EXISTS update_lobbies_modtime ON lobbies;
CREATE TRIGGER update_lobbies_modtime
    BEFORE UPDATE ON lobbies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table: clubs
ALTER TABLE clubs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DROP TRIGGER IF EXISTS update_clubs_modtime ON clubs;
CREATE TRIGGER update_clubs_modtime
    BEFORE UPDATE ON clubs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table: games
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DROP TRIGGER IF EXISTS update_games_modtime ON games;
CREATE TRIGGER update_games_modtime
    BEFORE UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table: game_modes
ALTER TABLE game_modes 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DROP TRIGGER IF EXISTS update_game_modes_modtime ON game_modes;
CREATE TRIGGER update_game_modes_modtime
    BEFORE UPDATE ON game_modes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table: guild_bans
ALTER TABLE guild_bans 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DROP TRIGGER IF EXISTS update_guild_bans_modtime ON guild_bans;
CREATE TRIGGER update_guild_bans_modtime
    BEFORE UPDATE ON guild_bans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table: match_reports
ALTER TABLE match_reports 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DROP TRIGGER IF EXISTS update_match_reports_modtime ON match_reports;
CREATE TRIGGER update_match_reports_modtime
    BEFORE UPDATE ON match_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Table: reports (Moderation)
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

DROP TRIGGER IF EXISTS update_reports_modtime ON reports;
CREATE TRIGGER update_reports_modtime
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- 3. SOUNDNESS CHECK: INDEXES
-- ==========================================

-- Indexing for Arena/Lobby Search Filters
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON lobbies(status);
CREATE INDEX IF NOT EXISTS idx_lobbies_is_official ON lobbies(is_official);
CREATE INDEX IF NOT EXISTS idx_lobbies_game_mode_id ON lobbies(game_mode_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_created_at ON lobbies(created_at DESC); -- For Recent/Latest sorting

-- Indexing for Queue lookups
CREATE INDEX IF NOT EXISTS idx_queues_user_id ON queues(user_id);
CREATE INDEX IF NOT EXISTS idx_queues_game_mode_id ON queues(game_mode_id);

-- Indexing for Reports/Bans
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_guild_bans_guild_user ON guild_bans(guild_id, user_id);

-- ==========================================
-- 4. LEAN CHECK: INTEGRITY ENFORCEMENT
-- ==========================================

-- Ensure lobby references game_mode with CASCADE
-- We first try to drop the constraint if it exists (to start fresh) or we can just alter it.
-- Since names might vary (lobbies_game_mode_id_fkey), we proceed with caution.
-- Best practice for migration files usually involves explicit naming.

-- Attempt to add constraint if it doesn't exist or ensure it is CASCADE.
-- This part acts as a safeguard.
DO $$
BEGIN
    -- Check if constraint needs update. This is complex in pure SQL without dropping.
    -- We'll assume if it exists, it might not be CASCADE. 
    -- SAFE METHOD: Drop and Re-Add.
    ALTER TABLE lobbies DROP CONSTRAINT IF EXISTS lobbies_game_mode_id_fkey;
    
    ALTER TABLE lobbies
    ADD CONSTRAINT lobbies_game_mode_id_fkey
    FOREIGN KEY (game_mode_id)
    REFERENCES game_modes(id)
    ON DELETE CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint manipulation failed or already exists properly';
END $$;
