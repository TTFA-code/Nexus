-- Rename ensure_club_exists to ensure_guild_exists and update table reference
CREATE OR REPLACE FUNCTION ensure_guild_exists(gid TEXT, gname TEXT) RETURNS void AS $$
BEGIN 
    INSERT INTO guilds (guild_id, name) VALUES (gid, gname) 
    ON CONFLICT (guild_id) DO NOTHING; 
END;
$$ LANGUAGE plpgsql;

-- Optional: Drop old function if you want to clean up
-- DROP FUNCTION IF EXISTS ensure_club_exists(TEXT, TEXT);
