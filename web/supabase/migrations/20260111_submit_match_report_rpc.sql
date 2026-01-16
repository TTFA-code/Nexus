-- =================================================================================
-- NUCLEAR CLEANUP: Drop ALL versions of submit_match_report
-- =================================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure as func_signature
        FROM pg_proc 
        WHERE proname = 'submit_match_report'
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Create submit_match_report RPC function
-- 2. CREATE THE FINAL, CORRECT VERSION
CREATE OR REPLACE FUNCTION submit_match_report(
  match_id_input text, -- Accepting TEXT works for everything
  reporter_id_input uuid, 
  my_score_input int,
  opponent_score_input int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
AS $$
DECLARE
  reporter_discord_id text;
  reporter_team int;
  winner_team_calc int;
  affected_rows int;
  
  -- MMR Variables
  v_game_id uuid;
  p_record RECORD;
  team1_mmr_sum numeric := 0;
  team2_mmr_sum numeric := 0;
  team1_count int := 0;
  team2_count int := 0;
  team1_avg_mmr numeric;
  team2_avg_mmr numeric;
  
  k_factor numeric := 32;
  expected_score_t1 numeric;
  expected_score_t2 numeric;
  actual_score_t1 numeric;
  actual_score_t2 numeric;
  
  mmr_delta numeric;
  new_mmr_val numeric;
  mmr_change_val numeric;
BEGIN
  BEGIN
      -- 0. Fetch Game ID
      SELECT gm.game_id INTO v_game_id
      FROM matches m
      JOIN game_modes gm ON m.game_mode_id = gm.id
      WHERE m.id::text = match_id_input; -- Force Text Comparison

      IF v_game_id IS NULL THEN
          RAISE EXCEPTION 'Game ID not found for match %. Ensure Game Mode is linked to a Game.', match_id_input;
      END IF;

      -- 1. Resolve Reporter Discord ID from Auth ID
      SELECT user_id INTO reporter_discord_id
      FROM players
      WHERE uuid_link = reporter_id_input::text;

      IF reporter_discord_id IS NULL THEN
        RETURN json_build_object('error', 'Reporter profile not found. Please link your account.');
      END IF;

      -- 2. Verify Reporter and Get Team
      SELECT mp.team INTO reporter_team
      FROM match_players mp
      WHERE mp.match_id::text = match_id_input
      AND mp.user_id = reporter_discord_id;

      IF reporter_team IS NULL THEN
        RETURN json_build_object('error', 'Reporter is not a participant in this match.');
      END IF;

      -- 3. Determine Winner Logic
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

      -- 4. Update the Matches Table
      UPDATE matches
      SET 
        winner_team = winner_team_calc,
        status = 'finished',
        finished_at = NOW()
      WHERE id::text = match_id_input;
      
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      IF affected_rows = 0 THEN
          RAISE EXCEPTION 'Match ID % not found during update.', match_id_input;
      END IF;

      -- 5. Update match_players stats
      UPDATE match_players
      SET stats = json_build_object('score', my_score_input)
      WHERE match_id::text = match_id_input AND user_id = reporter_discord_id;

      UPDATE match_players
      SET stats = json_build_object('score', opponent_score_input)
      WHERE match_id::text = match_id_input AND team != reporter_team;

      -- =================================================================================
      -- 6. MMR CALCULATION SYSTEM (Game-Specific)
      -- =================================================================================
      
      -- A. Calculate Team Averages (Pulling from player_mmr)
      FOR p_record IN 
          SELECT mp.user_id, mp.team, COALESCE(pm.mmr, 1000) as current_mmr
          FROM match_players mp
          LEFT JOIN players p ON mp.user_id = p.user_id
          LEFT JOIN player_mmr pm ON p.uuid_link::uuid = pm.user_id AND pm.game_id = v_game_id
          WHERE mp.match_id::text = match_id_input
      LOOP
          IF p_record.team = 1 THEN
              team1_mmr_sum := team1_mmr_sum + p_record.current_mmr;
              team1_count := team1_count + 1;
          ELSE
              team2_mmr_sum := team2_mmr_sum + p_record.current_mmr;
              team2_count := team2_count + 1;
          END IF;
      END LOOP;

      IF team1_count > 0 THEN team1_avg_mmr := team1_mmr_sum / team1_count; ELSE team1_avg_mmr := 1000; END IF;
      IF team2_count > 0 THEN team2_avg_mmr := team2_mmr_sum / team2_count; ELSE team2_avg_mmr := 1000; END IF;

      -- B. Calculate Expected Scores
      expected_score_t1 := 1.0 / (1.0 + POWER(10.0, (team2_avg_mmr - team1_avg_mmr) / 400.0));
      expected_score_t2 := 1.0 / (1.0 + POWER(10.0, (team1_avg_mmr - team2_avg_mmr) / 400.0));

      -- C. Determine Actual Scores based on Winner
      IF winner_team_calc = 1 THEN
          actual_score_t1 := 1.0;
          actual_score_t2 := 0.0;
      ELSIF winner_team_calc = 2 THEN
          actual_score_t1 := 0.0;
          actual_score_t2 := 1.0;
      ELSE -- Draw
          actual_score_t1 := 0.5;
          actual_score_t2 := 0.5;
      END IF;

      -- D. Loop Update Players
      FOR p_record IN 
          SELECT mp.user_id, mp.team, COALESCE(pm.mmr, 1000) as current_mmr, p.uuid_link
          FROM match_players mp
          LEFT JOIN players p ON mp.user_id = p.user_id
          LEFT JOIN player_mmr pm ON p.uuid_link::uuid = pm.user_id AND pm.game_id = v_game_id
          WHERE mp.match_id::text = match_id_input
      LOOP
          -- Calculate Delta
          IF p_record.team = 1 THEN
              mmr_delta := k_factor * (actual_score_t1 - expected_score_t1);
          ELSE
              mmr_delta := k_factor * (actual_score_t2 - expected_score_t2);
          END IF;

          mmr_change_val := ROUND(mmr_delta);
          new_mmr_val := p_record.current_mmr + mmr_change_val;

          -- 1. UPDATE/INSERT Player MMR (Game Specific)
          IF p_record.uuid_link IS NOT NULL THEN
              INSERT INTO player_mmr (user_id, game_id, mmr, updated_at)
              VALUES (p_record.uuid_link::uuid, v_game_id, new_mmr_val, NOW())
              ON CONFLICT (user_id, game_id) DO UPDATE
              SET mmr = EXCLUDED.mmr, updated_at = NOW();

              -- 2. Insert History Log
              INSERT INTO mmr_history (match_id, player_uuid, old_mmr, new_mmr, change)
              VALUES (match_id_input::uuid, p_record.uuid_link::uuid, p_record.current_mmr, new_mmr_val, mmr_change_val);
          END IF;

      END LOOP;

      -- 5. Close Lobby
      UPDATE lobbies
      SET status = 'finished'
      WHERE match_id::text = match_id_input;

      RETURN json_build_object('success', true, 'winner_team', winner_team_calc);

  EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Transaction Failed: %', SQLERRM;
  END;
END;
$$;
