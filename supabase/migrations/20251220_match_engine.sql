-- Match Engine Schema Update
-- 1. Create ready_checks table
CREATE TABLE IF NOT EXISTS ready_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lobby_id INT REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id VARCHAR(20) REFERENCES players(user_id) ON DELETE CASCADE,
    accepted BOOLEAN DEFAULT FALSE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lobby_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ready_checks_lobby_id ON ready_checks(lobby_id);
