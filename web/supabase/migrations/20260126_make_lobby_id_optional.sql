-- =================================================================================
-- FIX: Make Lobby ID Optional
-- =================================================================================
-- The new matchmaker creates a MATCH directly, not a LOBBY.
-- Therefore, ready_checks must be allowed to have NULL lobby_id (as long as they have match_id).

ALTER TABLE public.ready_checks
ALTER COLUMN lobby_id DROP NOT NULL;

RAISE NOTICE 'ready_checks.lobby_id is now optional.';
