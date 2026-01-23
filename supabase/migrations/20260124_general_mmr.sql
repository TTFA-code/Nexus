-- Migration: General MMR Update (One Rank Per Game)
-- Description: Implements the logic to track MMR per Game and updates match reporting to use Text IDs.
-- Changes: Creates player_mmr table, updates update_mmr, and updates submit_match_report.

BEGIN;

-- 1. Create player_mmr table if not exists
CREATE TABLE IF NOT EXISTS public.player_mmr (
    user_id text REFERENCES public.players(user_id) ON DELETE CASCADE,
    game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
    mmr integer DEFAULT 1000,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, game_id)
);

-- 2. Update update_mmr function to use Game-based Logic
CREATE OR REPLACE FUNCTION update_mmr(p_match_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_winner_team integer;
    v_game_id uuid;
    v_player record;
    v_change integer;
    v_current_mmr integer;
    v_new_mmr integer;
BEGIN
    -- A. Get Match Info & Game ID
    SELECT 
        m.winner_team,
        gm.game_id
    INTO 
        v_winner_team,
        v_game_id
    FROM public.matches m
    JOIN public.game_modes gm ON m.game_mode_id = gm.id
    WHERE m.id = p_match_id;

    IF v_winner_team IS NULL THEN
        RAISE EXCEPTION 'Match has no winner declared.';
    END IF;

    IF v_game_id IS NULL THEN
        RAISE EXCEPTION 'Could not determine Game ID for this match.';
    END IF;

    -- B. Loop through all players in the match
    FOR v_player IN 
        SELECT user_id, team
        FROM public.match_players
        WHERE match_id = p_match_id
    LOOP
        -- 1. Get or Init Player MMR for this specific Game
        INSERT INTO public.player_mmr (user_id, game_id, mmr)
        VALUES (v_player.user_id, v_game_id, 1000)
        ON CONFLICT (user_id, game_id) DO NOTHING;

        SELECT mmr INTO v_current_mmr
        FROM public.player_mmr
        WHERE user_id = v_player.user_id AND game_id = v_game_id
        FOR UPDATE;

        -- 2. Calculate Change
        IF v_player.team = v_winner_team THEN
            v_change := 20;
        ELSE
            v_change := -20;
        END IF;

        v_new_mmr := v_current_mmr + v_change;

        -- 3. Update Player MMR
        UPDATE public.player_mmr
        SET 
            mmr = v_new_mmr,
            wins = wins + (CASE WHEN v_player.team = v_winner_team THEN 1 ELSE 0 END),
            losses = losses + (CASE WHEN v_player.team != v_winner_team THEN 1 ELSE 0 END),
            updated_at = now()
        WHERE user_id = v_player.user_id AND game_id = v_game_id;

        -- 4. Record History
        INSERT INTO public.mmr_history (
            match_id,
            player_uuid, 
            old_mmr,
            new_mmr,
            change
        ) VALUES (
            p_match_id,
            v_player.user_id,
            v_current_mmr,
            v_new_mmr,
            v_change
        );
    END LOOP;
END;
$$;

-- 3. Update submit_match_report to accept TEXT match_id and call new update_mmr
-- NOTE: Parameter names MUST match existing Supabase Types (p_...)
CREATE OR REPLACE FUNCTION submit_match_report(
    p_match_id text,
    p_reporter_id text,
    p_my_score integer,
    p_opponent_score integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_match_status text;
    v_reporter_team integer;
    v_winner_team integer;
    v_scores jsonb;
BEGIN
    -- 1. Check Match Status
    SELECT status INTO v_match_status
    FROM public.matches
    WHERE id = p_match_id;

    IF v_match_status IS NULL THEN
        RAISE EXCEPTION 'Match not found.';
    END IF;

    IF v_match_status != 'active' THEN 
        RAISE EXCEPTION 'Match is not ongoing (Current Status: %)', v_match_status;
    END IF;

    -- 2. Determine Reporter's Team
    SELECT team INTO v_reporter_team
    FROM public.match_players
    WHERE match_id = p_match_id AND user_id = p_reporter_id;

    IF v_reporter_team IS NULL THEN
        RAISE EXCEPTION 'Reporter % invalid for this match.', p_reporter_id;
    END IF;

    -- 3. Determine Winner
    IF p_my_score > p_opponent_score THEN
        v_winner_team := v_reporter_team;
    ELSIF p_my_score < p_opponent_score THEN
        -- Assuming 2 teams: 1 and 2. 
        IF v_reporter_team = 1 THEN v_winner_team := 2; ELSE v_winner_team := 1; END IF;
    ELSE
        v_winner_team := 0; -- Draw
    END IF;

    -- 4. Construct Metadata
    v_scores := jsonb_build_object(
        'reporter_score', p_my_score,
        'opponent_score', p_opponent_score,
        'reporter_team', v_reporter_team
    );

    -- 5. Update Match
    UPDATE public.matches
    SET 
        winner_team = v_winner_team,
        status = 'completed',
        finished_at = now(),
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('scores', v_scores)
    WHERE id = p_match_id;

    -- 6. Insert Report Log
    INSERT INTO public.match_reports (match_id, reporter_id, result_data, status)
    VALUES (p_match_id, p_reporter_id, v_scores, 'RESOLVED');

    -- 7. Trigger MMR Update
    IF v_winner_team != 0 THEN
        PERFORM update_mmr(p_match_id);
    END IF;

END;
$$;

COMMIT;
