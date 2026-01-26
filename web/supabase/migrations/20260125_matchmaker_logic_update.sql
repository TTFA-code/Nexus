-- =================================================================================
-- RPC: Find Match (Optimized with SKIP LOCKED)
-- =================================================================================
CREATE OR REPLACE FUNCTION public.find_match()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mode RECORD;
    v_match_id UUID;
    v_team_size INT;
    v_players_list JSONB;
    v_player_row RECORD;
    i INT;
    v_team INT;
    v_matches_found INT := 0;
    v_anchor_player RECORD;
    v_search_delta INT;
    v_wait_seconds INT;
BEGIN
    -- Loop through each game mode that has people in queue
    FOR v_mode IN 
        SELECT DISTINCT game_mode_id, m.team_size 
        FROM public.matchmaking_queue q
        JOIN public.game_modes m ON q.game_mode_id = m.id
    LOOP
        v_team_size := v_mode.team_size;
        
        -- 1. Get Anchor (Reading without locking first to establish range)
        SELECT * INTO v_anchor_player
        FROM public.matchmaking_queue
        WHERE game_mode_id = v_mode.game_mode_id
        ORDER BY joined_at ASC
        LIMIT 1;
        
        IF v_anchor_player IS NOT NULL THEN
            
            -- Calculate their Wait Duration
            v_wait_seconds := EXTRACT(EPOCH FROM (NOW() - v_anchor_player.joined_at));
            
            -- Determine MMR Delta
            IF v_wait_seconds < 30 THEN
                v_search_delta := 100;
            ELSIF v_wait_seconds < 60 THEN
                v_search_delta := 250;
            ELSE
                v_search_delta := 500;
            END IF;
            
            -- 2. Select Players with Locking
            -- We normally want the anchor to be included, and since they are oldest, they should be picked 
            -- first by the ORDER BY joined_at ASC if they are not locked.
            WITH locked_players AS (
                SELECT user_id
                FROM public.matchmaking_queue
                WHERE game_mode_id = v_mode.game_mode_id
                AND mmr BETWEEN (v_anchor_player.mmr - v_search_delta) AND (v_anchor_player.mmr + v_search_delta)
                ORDER BY joined_at ASC
                LIMIT (v_team_size * 2)
                FOR UPDATE SKIP LOCKED -- CRITICAL: Prevents race conditions
            )
            SELECT jsonb_agg(row_to_json(q.*)) INTO v_players_list
            FROM public.matchmaking_queue q
            WHERE user_id IN (SELECT user_id FROM locked_players);

            -- Check if we have enough players
            IF v_players_list IS NOT NULL AND jsonb_array_length(v_players_list) = (v_team_size * 2) THEN
                
                -- FOUND A MATCH
                v_matches_found := v_matches_found + 1;

                -- Create Match
                INSERT INTO public.matches (game_mode_id, status, created_at, started_at)
                VALUES (v_mode.game_mode_id, 'in_progress', NOW(), NOW())
                RETURNING id INTO v_match_id;

                -- Sort Players by MMR (Desc) for S-Curve
                i := 1;
                FOR v_player_row IN 
                    SELECT * FROM jsonb_to_recordset(v_players_list) AS x(user_id UUID, discord_id TEXT, mmr INT)
                    ORDER BY mmr DESC
                LOOP
                    -- Abba-style Snake Draft for Balance
                    -- 1(A), 2(B), 3(B), 4(A)...
                    IF (i % 4) = 1 OR (i % 4) = 0 THEN
                         v_team := 1;
                    ELSE
                         v_team := 2;
                    END IF;

                    -- Insert into match_players
                    INSERT INTO public.match_players (match_id, user_id, team, created_at)
                    VALUES (v_match_id, v_player_row.discord_id, v_team, NOW());

                    -- Create Ready Check
                    INSERT INTO public.ready_checks (match_id, user_id, accepted, created_at)
                    VALUES (v_match_id, v_player_row.discord_id, FALSE, NOW());
                    
                    -- Remove from Queue (They are already locked, so this is safe)
                    DELETE FROM public.matchmaking_queue WHERE user_id = v_player_row.user_id;

                    i := i + 1;
                END LOOP;

            END IF;
        END IF;

    END LOOP;

    RETURN v_matches_found;
END;
$$;
