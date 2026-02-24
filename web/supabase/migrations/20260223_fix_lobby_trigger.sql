-- Fix for Lobby Creator Auto-Join Trigger
-- The previous trigger used auth.uid() which resulted in UUIDs being inserted instead of Discord IDs.
-- This caused the creator to be invisible in the lobby UI since the UI expects Discord IDs.
-- Additionally, we now explicitly set team 1 for the creator.

CREATE OR REPLACE FUNCTION public.handle_new_lobby_creator()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.lobby_players (lobby_id, user_id, status, is_ready, team)
  VALUES (NEW.id, NEW.creator_id, 'joined', false, 1)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old trigger if it exists
DROP TRIGGER IF EXISTS auto_join_lobby_creator ON public.lobbies;

-- Recreate the trigger bound to the new function
CREATE TRIGGER auto_join_lobby_creator
  AFTER INSERT ON public.lobbies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_lobby_creator();
