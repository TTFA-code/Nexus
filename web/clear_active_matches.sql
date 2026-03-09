-- Remove all active queue entries
DELETE FROM queues;
DELETE FROM matchmaking_queue;

-- Remove pending ready checks
DELETE FROM ready_checks;

-- Remove players from active/unfinished lobbies
DELETE FROM lobby_players 
WHERE lobby_id IN (SELECT id FROM lobbies WHERE status != 'finished' AND status != 'SCHEDULED');

-- Remove reports for active/unfinished matches
DELETE FROM match_reports 
WHERE match_id IN (SELECT id FROM matches WHERE status != 'finished');

-- Remove players from active/unfinished matches
DELETE FROM match_players 
WHERE match_id IN (SELECT id FROM matches WHERE status != 'finished');

-- Unlink matches from lobbies to prevent foreign key constraint errors
UPDATE lobbies 
SET match_id = NULL 
WHERE status != 'finished' AND status != 'SCHEDULED';

-- Delete unfinished matches
DELETE FROM matches WHERE status != 'finished';

-- Delete unfinished lobbies
DELETE FROM lobbies WHERE status != 'finished' AND status != 'SCHEDULED';

-- Optional: Reset sequence or notify completion
RAISE NOTICE 'All active lobbies, queues, and matches have been successfully cleared.';
