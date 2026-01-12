-- Add privacy and tournament fields to lobbies
ALTER TABLE lobbies 
ADD COLUMN IF NOT EXISTS is_tournament BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS passphrase VARCHAR(4); -- 4-char Hex Key

-- No index strictly needed for small scale, but good practice if searching by passphrase (unlikely)
