-- Drop potentially ambiguous versions first
DROP FUNCTION IF EXISTS submit_match_report(uuid, uuid, int, int);
DROP FUNCTION IF EXISTS submit_match_report(uuid, uuid, numeric, numeric);

-- Create submit_match_report RPC function
CREATE OR REPLACE FUNCTION submit_match_report(
  match_id_input uuid,
  reporter_id_input uuid, -- The UUID of the user submitting the report
  my_score_input int,
  opponent_score_input int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reporter_team int;
  winner_team_calc int;
  affected_rows int;
BEGIN
  -- 1. Verify Reporter and Get Team
  SELECT team INTO reporter_team
  FROM match_players
  WHERE match_id = match_id_input
  AND user_id = reporter_id_input;

  IF reporter_team IS NULL THEN
    RETURN json_build_object('error', 'Reporter is not a participant in this match.');
  END IF;

  -- 2. Determine Winner Logic
  -- Logic: 
  -- If My Score > Opponent Score -> My Team Wins
  -- If My Score < Opponent Score -> Opponent Team Wins (Assuming Team 1 vs Team 2)
  -- If Tie -> 0 (Draw)
  
  IF my_score_input > opponent_score_input THEN
    winner_team_calc := reporter_team;
  ELSIF my_score_input < opponent_score_input THEN
    IF reporter_team = 1 THEN
      winner_team_calc := 2;
    ELSE
      winner_team_calc := 1;
    END IF;
  ELSE
    winner_team_calc := 0; -- Draw
  END IF;

  -- 3. Update the Match Record
  UPDATE matches
  SET 
    winner_team = winner_team_calc,
    status = 'finished',
    finished_at = NOW()
  WHERE id = match_id_input;
  
  -- Check if match was actually found/updated
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows = 0 THEN
      RETURN json_build_object('error', 'Match ID not found.');
  END IF;

  -- 3.5 Update match_players stats (scores)
  -- Update Reporter's Team (My Score)
  UPDATE match_players
  SET stats = json_build_object('score', my_score_input)
  WHERE match_id = match_id_input AND user_id = reporter_id_input;

  -- Update Opponent's Team (Opponent Score)
  UPDATE match_players
  SET stats = json_build_object('score', opponent_score_input)
  WHERE match_id = match_id_input AND team != reporter_team;

  -- 4. Close the Related Lobby
  -- Matches are linked to lobbies via lobbies.match_id
  UPDATE lobbies
  SET status = 'finished'
  WHERE match_id = match_id_input;

  RETURN json_build_object('success', true, 'winner_team', winner_team_calc);
END;
$$;
