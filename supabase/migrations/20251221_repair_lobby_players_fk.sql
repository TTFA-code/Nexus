DO $$
BEGIN
    -- 1. Create table if missing (Idempotent)
    CREATE TABLE IF NOT EXISTS lobby_players (
        lobby_id INT,
        user_id VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        PRIMARY KEY (lobby_id, user_id)
    );

    -- 2. Add Foreign Key to lobbies if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lobby_players_lobby_id_fkey'
    ) THEN
        ALTER TABLE lobby_players
        ADD CONSTRAINT lobby_players_lobby_id_fkey
        FOREIGN KEY (lobby_id)
        REFERENCES lobbies(id)
        ON DELETE CASCADE;
    END IF;

    -- 3. Add Foreign Key to players if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lobby_players_user_id_fkey'
    ) THEN
        ALTER TABLE lobby_players
        ADD CONSTRAINT lobby_players_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES players(user_id);
    END IF;
END $$;
