-- =================================================================================
-- FIX: Update join_queue to use player_mmr instead of player_ratings
-- =================================================================================

CREATE OR REPLACE FUNCTION public.join_queue(
    p_game_mode_id UUID,
    p_discord_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mode RECORD;
    v_game_id UUID;
    v_mmr INT := 1000;
    v_dummy_uuid UUID;
BEGIN
    -- 1. Check if Mode exists and is active
    SELECT * INTO v_mode FROM public.game_modes WHERE id = p_game_mode_id;
    IF v_mode IS NULL OR v_mode.is_active = FALSE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid or inactive game mode.');
    END IF;

    -- 2. Check if user is banned (Optional)
    -- IF EXISTS (SELECT 1 FROM public.players WHERE user_id = p_discord_id AND is_banned = TRUE) THEN ...

    -- 3. Check if already in queue
    IF EXISTS (SELECT 1 FROM public.matchmaking_queue WHERE user_id = p_discord_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already in queue.');
    END IF;

    -- 4. Get Player MMR for this Game
    -- FIX: Originally referenced player_ratings, now using player_mmr
    -- We need the game_id from the mode
    v_game_id := v_mode.game_id;

    -- player_mmr is keyed by (user_id [UUID], game_id [UUID]).
    -- But p_discord_id is TEXT. We need the UUID link from players table.
    
    SELECT uuid_link INTO v_dummy_uuid 
    FROM public.players 
    WHERE user_id = p_discord_id;

    IF v_dummy_uuid IS NOT NULL THEN
        SELECT mmr INTO v_mmr
        FROM public.player_mmr
        WHERE user_id = v_dummy_uuid
        AND game_id = v_game_id;
        
        -- Default to 1000 if not found
        IF v_mmr IS NULL THEN
            v_mmr := 1000;
        END IF;
    ELSE
        -- Fallback if no UUID link (shouldn't happen for auth'd users but safe fallback)
        v_mmr := 1000;
    END IF;

    -- 5. Insert into Queue
    INSERT INTO public.matchmaking_queue (
        user_id,
        discord_id,
        game_mode_id,
        mmr,
        joined_at
    ) VALUES (
        p_discord_id, -- user_id in queue is TEXT (Discord ID) based on previous schema checks?
                      -- Let's re-verify schema. `matchmaking_queue` definition?
                      -- In 20260125_matchmaking_queue.sql it says `user_id TEXT`.
        p_discord_id,
        p_game_mode_id,
        v_mmr,
        NOW()
    );

    RETURN jsonb_build_object('success', true);
END;
$$;
