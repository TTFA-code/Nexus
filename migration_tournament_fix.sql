-- =================================================================================
-- FIX: PREVENT AUTO-JOIN FOR TOURNAMENT CREATORS
-- =================================================================================

CREATE OR REPLACE FUNCTION auto_join_lobby_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only auto-join for NON-TOURNAMENT lobbies
    -- If it is a tournament, the creator remains an admin but not a player
    IF NEW.is_tournament = false THEN
        INSERT INTO lobby_players (lobby_id, user_id, status, is_ready)
        VALUES (NEW.id, NEW.creator_id, 'joined', false)
        ON CONFLICT (lobby_id, user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger remains the same, just updating the function logic.
