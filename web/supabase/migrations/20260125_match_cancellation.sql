-- =================================================================================
-- RPC: Decline Match (Dissolve)
-- =================================================================================
CREATE OR REPLACE FUNCTION public.decline_match(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_match RECORD;
BEGIN
    -- 1. Check Match Status
    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;

    IF v_match IS NULL OR v_match.status = 'finished' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Match already finished or invalid.');
    END IF;

    -- 2. Cancel Match
    -- We mark it as 'cancelled' so other players get notified via Realtime
    UPDATE public.matches
    SET status = 'cancelled', finished_at = NOW()
    WHERE id = p_match_id;

    -- 3. Cleanup (Optional)
    -- You might want to remove match_players or keep them for history ("Who dodged?")
    -- We'll keep them.
    
    RETURN jsonb_build_object('success', true);
END;
$$;
