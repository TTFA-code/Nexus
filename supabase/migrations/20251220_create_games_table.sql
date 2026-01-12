-- Migration: 20251220_create_games_table
-- Description: Create games table, seed data, and link game_modes

-- 1. Create games table
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add game_id to game_modes
ALTER TABLE game_modes 
ADD COLUMN game_id UUID REFERENCES games(id) ON DELETE SET NULL;

-- 3. Seed Games
INSERT INTO games (name, icon_url) VALUES 
('FIFA', 'https://upload.wikimedia.org/wikipedia/commons/a/aa/FIFA_logo_without_slogan.svg'),
('League of Legends', 'https://upload.wikimedia.org/wikipedia/commons/d/d8/League_of_Legends_2019_vector.svg'),
('Rocket League', 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Rocket_League_coverart.jpg')
ON CONFLICT (name) DO NOTHING;

-- 4. Map existing modes to games (Data Migration)
UPDATE game_modes SET game_id = (SELECT id FROM games WHERE name = 'FIFA') WHERE name LIKE 'FIFA%';
UPDATE game_modes SET game_id = (SELECT id FROM games WHERE name = 'League of Legends') WHERE name LIKE 'League of Legends%';
UPDATE game_modes SET game_id = (SELECT id FROM games WHERE name = 'Rocket League') WHERE name LIKE 'Rocket League%';
