-- Add is_official to lobbies table
ALTER TABLE lobbies 
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE;
