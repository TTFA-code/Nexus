-- Refine lobbies table for Voice and Private support
ALTER TABLE lobbies 
ADD COLUMN IF NOT EXISTS voice_required BOOLEAN DEFAULT FALSE;

-- Rename host_id to creator_id for consistency (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lobbies' AND column_name = 'host_id') THEN
    ALTER TABLE lobbies RENAME COLUMN host_id TO creator_id;
  END IF;
END $$;

-- Rename passphrase to sector_key for "Private Sector" theming (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lobbies' AND column_name = 'passphrase') THEN
    ALTER TABLE lobbies RENAME COLUMN passphrase TO sector_key;
  END IF;
END $$;
