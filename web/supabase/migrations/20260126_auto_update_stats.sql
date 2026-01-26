-- =================================================================================
-- FEATURE: Auto-Update Stats on Match Finish
-- =================================================================================

-- 1. Create the Function
CREATE OR REPLACE FUNCTION public.handle_match_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player RECORD;
    v_new_wins INT;
    v_new_losses INT;
BEGIN
    -- Only proceed if status changed to 'finished'
    IF NEW.status = 'finished' AND OLD.status != 'finished' THEN
        
        RAISE NOTICE 'Match % finished. Updating stats...', NEW.id;

        -- Loop through all players in this match
        FOR v_player IN 
            SELECT mp.user_id, mp.team, p.uuid_link
            FROM public.match_players mp
            JOIN public.players p ON mp.user_id = p.user_id
            WHERE mp.match_id = NEW.id
        LOOP
            -- Check if Player Won or Lost
            IF v_player.team = NEW.winner_team THEN
                -- WINNER: Increment Wins
                UPDATE public.player_mmr
                SET wins = COALESCE(wins, 0) + 1,
                    updated_at = NOW()
                WHERE user_id = CAST(v_player.uuid_link AS UUID)
                  AND game_id = (SELECT game_id FROM public.game_modes WHERE id = NEW.game_mode_id);
            ELSE
                -- LOSER: Increment Losses
                UPDATE public.player_mmr
                SET losses = COALESCE(losses, 0) + 1,
                    updated_at = NOW()
                WHERE user_id = CAST(v_player.uuid_link AS UUID)
                  AND game_id = (SELECT game_id FROM public.game_modes WHERE id = NEW.game_mode_id);
            END IF;
        END LOOP;
        
    END IF;
    RETURN NEW;
END;
$$;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_match_finish ON public.matches;

CREATE TRIGGER on_match_finish
AFTER UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.handle_match_completion();

RAISE NOTICE 'Trigger on_match_finish created successfully.';
