-- =================================================================================
-- UPDATE: Advanced Matchmaking (Anchor Logic + Expansion)
-- =================================================================================

CREATE OR REPLACE FUNCTION public.find_match()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mode RECORD;
    v_anchor RECORD;
    v_anchor_wait_seconds INT;
    v_current_radius INT;
    v_needed_players INT;
    v_potential_opponents JSONB;
    v_final_team JSONB;
    v_match_id UUID;
    v_player_row RECORD;
    i INT;
    v_team INT;
    v_matches_found INT := 0;
    v_processed_user_ids UUID[] := '{}'; -- Keep track of matched users in this tick to avoid double matching
BEGIN
    -- Loop through each Game Mode with active players
    FOR v_mode IN 
        SELECT DISTINCT q.game_mode_id, m.team_size 
        FROM public.matchmaking_queue q
        JOIN public.game_modes m ON q.game_mode_id = m.id
    LOOP
        v_needed_players := (v_mode.team_size * 2) - 1; -- We need this many PLUS the anchor

        -- Iterate through potential Anchors (Oldest -> Newest)
        -- We filter out users we already matched in this tick (v_processed_user_ids)
        FOR v_anchor IN 
            SELECT * 
            FROM public.matchmaking_queue 
            WHERE game_mode_id = v_mode.game_mode_id
            AND NOT (user_id = ANY(v_processed_user_ids))
            ORDER BY joined_at ASC
        LOOP
            -- 1. Calculate Radius
            v_anchor_wait_seconds := EXTRACT(EPOCH FROM (NOW() - v_anchor.joined_at));
            
            -- Formula: Base 100 + (6 * seconds). Cap at 400.
            v_current_radius := 100 + (v_anchor_wait_seconds * 6);
            IF v_current_radius > 400 THEN
                v_current_radius := 400;
            END IF;

            -- 2. Find Opponents within Radius
            -- Must match Game Mode
            -- Must match MMR range
            -- Must NOT be already processed
            -- Sort by closeness to Anchor MMR (or wait time? Let's prioritize MMR closeness for quality)
            WITH candidates AS (
                SELECT *
                FROM public.matchmaking_queue
                WHERE game_mode_id = v_mode.game_mode_id
                AND user_id != v_anchor.user_id
                AND NOT (user_id = ANY(v_processed_user_ids))
                AND mmr >= (v_anchor.mmr - v_current_radius)
                AND mmr <= (v_anchor.mmr + v_current_radius)
                ORDER BY ABS(mmr - v_anchor.mmr) ASC -- Prioritize closest MMR
                LIMIT v_needed_players
            )
            SELECT jsonb_agg(row_to_json(candidates.*)) INTO v_potential_opponents
            FROM candidates;

            -- 3. Check if we have enough
            IF jsonb_array_length(v_potential_opponents) = v_needed_players THEN
                
                -- MATCH FOUND!
                v_matches_found := v_matches_found + 1;

                -- Add Anchor + Opponents to refined list
                SELECT jsonb_agg(x) INTO v_final_team
                FROM (
                    SELECT to_jsonb(v_anchor) as x
                    UNION ALL
                    SELECT * FROM jsonb_array_elements(v_potential_opponents)
                ) combined;

                -- Create Match
                INSERT INTO public.matches (game_mode_id, status, started_at)
                VALUES (v_mode.game_mode_id, 'started', NOW())
                RETURNING id INTO v_match_id;

                -- Assign Teams (S-Curve Sort)
                i := 1;
                FOR v_player_row IN 
                    SELECT * FROM jsonb_to_recordset(v_final_team) AS x(user_id UUID, discord_id TEXT, mmr INT)
                    ORDER BY mmr DESC
                LOOP
                     -- Track processed ID so we don't pick them again in this outer loop
                    v_processed_user_ids := array_append(v_processed_user_ids, v_player_row.user_id);

                    -- Team Logic
                    IF i IN (1, 4, 5, 8, 9) THEN v_team := 1; ELSE v_team := 2; END IF;

                    -- Insert Players
                    INSERT INTO public.match_players (match_id, user_id, team)
                    VALUES (v_match_id, v_player_row.discord_id, v_team);

                    -- Ready Check
                    INSERT INTO public.ready_checks (match_id, user_id, accepted, created_at)
                    VALUES (v_match_id, v_player_row.discord_id, FALSE, NOW());

                    -- Remove from Queue
                    DELETE FROM public.matchmaking_queue WHERE user_id = v_player_row.user_id;

                    i := i + 1;
                END LOOP;

            END IF;
            -- If not found, loop continues to next Anchor. This Anchor keeps waiting.
            
        END LOOP; -- End Anchor Loop
    END LOOP; -- End Mode Loop

    RETURN v_matches_found;
END;
$$;
