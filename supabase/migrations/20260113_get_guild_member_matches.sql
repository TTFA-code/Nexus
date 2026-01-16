-- RPC to get all matches played by members of a specific guild
-- regardless of where the match was hosted.

CREATE OR REPLACE FUNCTION get_guild_member_matches(p_guild_id text)
RETURNS TABLE (
    id int,
    status text,
    created_at timestamptz,
    finished_at timestamptz,
    winner_team int,
    game_name text,
    game_icon text,
    mode_name text,
    player_username text,
    player_avatar text
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.status,
        m.started_at as created_at,
        m.finished_at,
        m.winner_team,
        g.name as game_name,
        g.icon_url as game_icon,
        gm.name as mode_name,
        p.username as player_username,
        p.avatar_url as player_avatar
    FROM 
        matches m
    JOIN 
        game_modes gm ON m.game_mode_id = gm.id
    JOIN 
        games g ON gm.game_id = g.id
    JOIN 
        match_players mp ON m.id = mp.match_id
    JOIN 
        players p ON mp.user_id = p.user_id
    JOIN 
        server_members sm ON p.uuid_link::text = sm.user_id::text -- Force Text=Text
    WHERE 
        sm.guild_id = p_guild_id
    ORDER BY 
        m.started_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;
