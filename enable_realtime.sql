-- =================================================================================
-- ENABLE REALTIME FOR LOBBY SYSTEM
-- =================================================================================
-- Run this in your Supabase SQL Editor to fix the "refresh required" issue.
-- This manually adds the tables to the default 'supabase_realtime' publication.
-- =================================================================================

BEGIN;

-- 1. Enable Realtime for Lobbies (Creation/Status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobbies;

-- 2. Enable Realtime for Lobby Players (Join/Leave/Ready updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobby_players;

-- 3. Enable Realtime for Matches (Start/End updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

-- 4. Enable Realtime for Match Players (Status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_players;

-- 5. Enable Realtime for Ready Checks (if used)
ALTER PUBLICATION supabase_realtime ADD TABLE public.ready_checks;

COMMIT;

-- Verify with:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
