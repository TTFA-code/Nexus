-- Phase 1: Ready Check & Lobbies
-- We need a temporary or persistent store for Lobbies (active ready checks).
-- Using a table allows us to handle bot restarts gracefully and scale better.

CREATE TABLE lobbies (
    id SERIAL PRIMARY KEY,
    game_mode_id INT REFERENCES game_modes(id),
    guild_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'ready_check', -- 'ready_check', 'failed', 'converted_to_match'
    message_id VARCHAR(30), -- Discord Message ID of the Ready Check announcement
    channel_id VARCHAR(30)  -- Discord Channel ID
);

CREATE TABLE lobby_players (
    lobby_id INT REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id VARCHAR(20) REFERENCES players(user_id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    PRIMARY KEY (lobby_id, user_id)
);

-- Add announcement channel to clubs if not exists
ALTER TABLE clubs ADD COLUMN announcement_channel_id VARCHAR(30);
