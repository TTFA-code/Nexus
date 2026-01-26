-- =================================================================================
-- FIX: UUID vs TEXT Mismatch in join_queue
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
    v_auth_id UUID;
BEGIN
    -- 0. Get Auth ID safely
    v_auth_id := auth.uid();
    IF v_auth_id IS NULL THEN
         RETURN jsonb_build_object('success', false, 'message', 'Not authenticated.');
    END IF;

    -- 1. Check if Mode exists and is active
    SELECT * INTO v_mode FROM public.game_modes WHERE id = p_game_mode_id;
    IF v_mode IS NULL OR v_mode.is_active = FALSE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid or inactive game mode.');
    END IF;

    -- 2. Check if already in queue (Using UUID for check)
    IF EXISTS (SELECT 1 FROM public.matchmaking_queue WHERE user_id = v_auth_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already in queue.');
    END IF;

    -- 3. Get Player MMR for this Game
    v_game_id := v_mode.game_id;

    -- Try to find MMR using the auth_uuid directly from player_mmr
    SELECT mmr INTO v_mmr
    FROM public.player_mmr
    WHERE user_id = v_auth_id
    AND game_id = v_game_id;
    
    -- Default to 1000 if not found
    IF v_mmr IS NULL THEN
        v_mmr := 1000;
    END IF;

    -- 4. Insert into Queue
    -- user_id (PK) must be UUID (auth.uid())
    -- discord_id is TEXT (p_discord_id)
    INSERT INTO public.matchmaking_queue (
        user_id,
        discord_id,
        game_mode_id,
        mmr,
        joined_at
    ) VALUES (
        v_auth_id,      -- UUID
        p_discord_id,   -- TEXT
        p_game_mode_id, -- UUID
        v_mmr,          -- INT
        NOW()
    );

    RETURN jsonb_build_object('success', true);
END;
$$;
