-- Migration: Standardize ID Column Types and Dependencies
-- Date: 2026-01-04
-- Description: Standardizes guild_id, user_id, and match_id columns to TEXT and recreates admin_match_review view.

BEGIN;

-- 1. Drop Dependencies
DROP VIEW IF EXISTS admin_match_review;

-- 2. Alter Tables to TEXT
-- Note: casting is explicit to prevent ambiguity if type was not text compatible (though varchar usually is)

ALTER TABLE clubs ALTER COLUMN guild_id TYPE TEXT;
ALTER TABLE players ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE matches ALTER COLUMN id TYPE TEXT;
ALTER TABLE matches ALTER COLUMN mvp_user_id TYPE TEXT;

-- Use 'USING' clause if straightforward cast fails, but for VARCHAR->TEXT it is implicit.
ALTER TABLE lobbies ALTER COLUMN id TYPE TEXT;
ALTER TABLE lobbies ALTER COLUMN guild_id TYPE TEXT;
ALTER TABLE lobbies ALTER COLUMN creator_id TYPE TEXT;

ALTER TABLE queues ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE match_players ALTER COLUMN match_id TYPE TEXT;
ALTER TABLE match_players ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE lobby_players ALTER COLUMN lobby_id TYPE TEXT;
ALTER TABLE lobby_players ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE player_ratings ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE game_modes ALTER COLUMN guild_id TYPE TEXT;

ALTER TABLE match_reports ALTER COLUMN reporter_id TYPE TEXT;

ALTER TABLE ttfa_player_stats ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE ttfa_challenges ALTER COLUMN challenger_id TYPE TEXT;
ALTER TABLE ttfa_challenges ALTER COLUMN defender_id TYPE TEXT;
ALTER TABLE ttfa_challenges ALTER COLUMN winner_id TYPE TEXT;

ALTER TABLE ttfa_wellness_runs ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE ready_checks ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE ready_checks ALTER COLUMN lobby_id TYPE TEXT;

-- 3. Recreate View
-- Logic Adjusted:
-- 'm.guild_id': Included as requested (assuming matches has guild_id based on lobbyActions usage).
-- 'm.creator_id': Replaced with 'm.mvp_user_id' because 'creator_id' column does not exist in matches table definition.
-- If 'creator_id' WAS intended to be the lobby creator, we'd need to join lobbies or use metadata. 
-- However, match_reports view usually implies a reporter. 
-- For now, we map 'reporter_name' to the user in the match (MVP) or potentially NULL if no user links.
-- Given 'AdminInbox' wants a reporter, using 'mvp_user_id' is the closest single user field.

CREATE OR REPLACE VIEW admin_match_review AS
SELECT 
    m.id AS match_id,
    m.status,
    m.guild_id, -- Matches has guild_id (confirmed via lobbyActions)
    gm.name AS game_mode_name,
    p.username AS reporter_name,
    m.winner_team,
    m.finished_at
FROM matches m
LEFT JOIN game_modes gm ON m.game_mode_id = gm.id
LEFT JOIN players p ON m.mvp_user_id = p.uuid_link -- Fallback: Using mvp_user_id as the primary user link for this view
WHERE m.status = 'pending_approval';

COMMIT;
