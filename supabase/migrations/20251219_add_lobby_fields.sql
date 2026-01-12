-- Add metadata fields to lobbies table for Custom Lobbies
ALTER TABLE lobbies 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'ranked', -- 'ranked', 'scrim', '1v1'
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS host_id VARCHAR(20) REFERENCES players(user_id);

-- Ensure status can handle 'open' (if generic VARCHAR, it's fine, but good to note)
-- Update default if needed, or just insert 'open'.
