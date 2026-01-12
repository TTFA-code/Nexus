-- Create function to ensure club exists (idempotent)
CREATE OR REPLACE FUNCTION ensure_club_exists(gid TEXT, gname TEXT) RETURNS void AS $$
BEGIN 
    INSERT INTO clubs (guild_id, name) VALUES (gid, gname) 
    ON CONFLICT (guild_id) DO NOTHING; 
END;
$$ LANGUAGE plpgsql;
