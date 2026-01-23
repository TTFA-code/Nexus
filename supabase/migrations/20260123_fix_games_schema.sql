-- 20260123_fix_games_schema.sql
-- Ensure games table has guild_id and created_by as TEXT (Discord Snowflake)

-- 1. Add/Modify columns
-- We use safe ALTER logic. If they exist as UUID, we cast to TEXT. 
-- If they don't exist, we add them as TEXT.

DO $$ 
BEGIN
    -- Handle guild_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'guild_id') THEN
        -- Check type
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'guild_id' AND data_type = 'uuid') THEN
             ALTER TABLE games ALTER COLUMN guild_id TYPE text USING guild_id::text;
        END IF;
    ELSE
        ALTER TABLE games ADD COLUMN guild_id text;
    END IF;

    -- Handle created_by
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'created_by') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'created_by' AND data_type = 'uuid') THEN
             ALTER TABLE games ALTER COLUMN created_by TYPE text USING created_by::text;
        END IF;
    ELSE
        ALTER TABLE games ADD COLUMN created_by text;
    END IF;
END $$;

-- 2. Add Foreign Key if players table exists (It should)
-- games.created_by -> players.user_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'games_created_by_fkey') THEN
        ALTER TABLE games 
        ADD CONSTRAINT games_created_by_fkey 
        FOREIGN KEY (created_by) 
        REFERENCES players(user_id) 
        ON DELETE SET NULL;
    END IF;
END $$;
