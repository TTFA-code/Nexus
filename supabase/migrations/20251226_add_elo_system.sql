-- Add MMR and uuid_link to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS mmr INTEGER DEFAULT 1200,
ADD COLUMN IF NOT EXISTS uuid_link TEXT;

-- Create MMR history table
CREATE TABLE IF NOT EXISTS mmr_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) REFERENCES players(user_id),
    match_id INTEGER REFERENCES matches(id),
    old_mmr INTEGER,
    new_mmr INTEGER,
    change INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
