-- Clear Mock Data / Reset Transactional State
-- Removes all matches, lobbies, queues, and history.
-- Keeps Users (players) and Config (game_modes).

BEGIN;

-- 1. Truncate Tables with Foreign Key dependencies (CASCADE)
TRUNCATE TABLE 
  match_players,
  matches,
  lobby_players,
  lobbies,
  queues,
  ready_checks,
  mmr_history,
  match_reports,
  reports,
  guild_bans
RESTART IDENTITY CASCADE;

-- 2. Optional: Reset specific sequences if needed (RESTART IDENTITY handles this for SERIAL)

COMMIT;

-- Verification Output
SELECT 'Cleanup Complete. All transactional tables truncated.' as status;
