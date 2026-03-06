-- Migration: 20260305_match_dispute_resolution.sql

-- 1. Create match_reports table if it doesn't exist already, or ensure structure
CREATE TABLE IF NOT EXISTS public.match_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    reporter_id TEXT REFERENCES public.players(user_id) ON DELETE CASCADE,
    result_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, admin_resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure index exists
CREATE INDEX IF NOT EXISTS match_reports_match_id_idx ON public.match_reports(match_id);

-- 2. Modify submit_match_report to await exact match from opponent team
-- Drop the existing function first because we are changing parameter names
DROP FUNCTION IF EXISTS submit_match_report(text, uuid, int, int);
DROP FUNCTION IF EXISTS submit_match_report(text, text, int, int);

CREATE OR REPLACE FUNCTION submit_match_report(
  match_id_input text, 
  reporter_discord_id_input text, 
  my_score_input int,
  opponent_score_input int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reporter_team int;
  existing_report_team1 jsonb;
  existing_report_team2 jsonb;
  reporter_normalized_t1 int;
  reporter_normalized_t2 int;
  
  opponent_report RECORD;
  opponent_t1_score int;
  opponent_t2_score int;
  
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
      WHERE m.id::text = match_id_input;

      IF v_game_id IS NULL THEN
          RAISE EXCEPTION 'Game ID not found for match %.', match_id_input;
      END IF;

      -- 1. Check if the Reporter Profile exists
      IF NOT EXISTS (SELECT 1 FROM players WHERE user_id = reporter_discord_id_input) THEN
        RETURN json_build_object('error', 'Reporter profile not found.');
      END IF;

      -- 2. Verify Reporter and Get Team
      SELECT mp.team INTO reporter_team
      FROM match_players mp
      WHERE mp.match_id::text = match_id_input
      AND mp.user_id = reporter_discord_id_input;

      IF reporter_team IS NULL THEN
        RETURN json_build_object('error', 'Reporter is not a participant in this match.');
      END IF;

      -- 3. Normalize score input to Team 1 and Team 2 based on reporter's team
      IF reporter_team = 1 THEN
          reporter_normalized_t1 := my_score_input;
          reporter_normalized_t2 := opponent_score_input;
      ELSE
          reporter_normalized_t1 := opponent_score_input;
          reporter_normalized_t2 := my_score_input;
      END IF;

      -- 4. Upsert the report for THIS team
      -- We delete any previous report by THIS SPECIFIC USER to allow them to correct it BEFORE the match closes
      -- 4. Upsert the report for THIS team
      -- We delete any previous report by THIS SPECIFIC USER to allow them to correct it BEFORE the match closes
      DELETE FROM match_reports 
      WHERE match_id::text = match_id_input AND reporter_id = reporter_discord_id_input;
      
      INSERT INTO match_reports (match_id, reporter_id, result_data, status)
      VALUES (
          match_id_input::uuid, 
          reporter_discord_id_input, 
          jsonb_build_object('team_reporter', reporter_team, 't1_score', reporter_normalized_t1, 't2_score', reporter_normalized_t2),
          'pending'
      );

      -- 5. Update match_players stats for the reporter immediately (so they see what they entered)
      UPDATE match_players
      SET stats = json_build_object('score', my_score_input)
      WHERE match_id::text = match_id_input AND user_id = reporter_discord_id_input;

      -- 6. Check if an OPPOSING TEAM player has also reported
      SELECT * INTO opponent_report
      FROM match_reports 
      WHERE match_id::text = match_id_input 
      AND (result_data->>'team_reporter')::int != reporter_team
      ORDER BY created_at DESC LIMIT 1;

      IF NOT FOUND THEN
          -- Opponent hasn't reported yet. Return successfully, but don't close the match.
          RETURN json_build_object('success', true, 'status', 'waiting_for_opponent');
      END IF;

      -- 7. Parse the opposing report
      opponent_t1_score := (opponent_report.result_data->>'t1_score')::int;
      opponent_t2_score := (opponent_report.result_data->>'t2_score')::int;

      -- 8. Compare the normalized scores
      IF reporter_normalized_t1 != opponent_t1_score OR reporter_normalized_t2 != opponent_t2_score THEN
          -- CONFLICT DETECTED
          UPDATE matches
          SET status = 'disputed'
          WHERE id::text = match_id_input;
          
          RETURN json_build_object('success', true, 'status', 'disputed', 'message', 'Scores do not match. Match is disputed and requires admin resolution.');
      END IF;

      -- 9. SCORES MATCH! PROCEED TO RESOLVE MATCH.
      -- A. Determine Winner Logic based on Normalized Scores
      IF reporter_normalized_t1 > reporter_normalized_t2 THEN
        winner_team_calc := 1;
      ELSIF reporter_normalized_t1 < reporter_normalized_t2 THEN
        winner_team_calc := 2;
      ELSE
        winner_team_calc := 0; -- Draw
      END IF;

      -- B. Update the Matches Table
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

      -- C. Ensure all stats are updated
      -- Update team 1 stats
      UPDATE match_players SET stats = json_build_object('score', reporter_normalized_t1)
      WHERE match_id::text = match_id_input AND team = 1;

      -- Update team 2 stats
      UPDATE match_players SET stats = json_build_object('score', reporter_normalized_t2)
      WHERE match_id::text = match_id_input AND team = 2;

      -- Update all reports to 'accepted'
      UPDATE match_reports SET status = 'accepted' WHERE match_id::text = match_id_input;

      -- =================================================================================
      -- D. MMR CALCULATION SYSTEM (Identical to existing logic)
      -- =================================================================================
      
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

      -- Calculate Expected Scores
      expected_score_t1 := 1.0 / (1.0 + POWER(10.0, (team2_avg_mmr - team1_avg_mmr) / 400.0));
      expected_score_t2 := 1.0 / (1.0 + POWER(10.0, (team1_avg_mmr - team2_avg_mmr) / 400.0));

      -- Determine Actual Scores based on Winner
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

      -- Loop Update Players
      FOR p_record IN 
          SELECT mp.user_id, mp.team, COALESCE(pm.mmr, 1000) as current_mmr, p.uuid_link
          FROM match_players mp
          LEFT JOIN players p ON mp.user_id = p.user_id
          LEFT JOIN player_mmr pm ON p.uuid_link::uuid = pm.user_id AND pm.game_id = v_game_id
          WHERE mp.match_id::text = match_id_input
      LOOP
          IF p_record.team = 1 THEN
              mmr_delta := k_factor * (actual_score_t1 - expected_score_t1);
          ELSE
              mmr_delta := k_factor * (actual_score_t2 - expected_score_t2);
          END IF;

          mmr_change_val := ROUND(mmr_delta);
          new_mmr_val := p_record.current_mmr + mmr_change_val;

          IF p_record.uuid_link IS NOT NULL THEN
              INSERT INTO player_mmr (user_id, game_id, mmr, updated_at)
              VALUES (p_record.uuid_link::uuid, v_game_id, new_mmr_val, NOW())
              ON CONFLICT (user_id, game_id) DO UPDATE
              SET mmr = EXCLUDED.mmr, updated_at = NOW();

              INSERT INTO mmr_history (match_id, player_uuid, old_mmr, new_mmr, change)
              VALUES (match_id_input::uuid, p_record.uuid_link::uuid, p_record.current_mmr, new_mmr_val, mmr_change_val);
          END IF;
      END LOOP;

      -- E. Close Lobby
      UPDATE lobbies
      SET status = 'finished'
      WHERE match_id::text = match_id_input;

      RETURN json_build_object('success', true, 'status', 'finished', 'winner_team', winner_team_calc);

  EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Transaction Failed: %', SQLERRM;
  END;
END;
$$;


-- 3. Create admin_resolve_match RPC Function
CREATE OR REPLACE FUNCTION admin_resolve_match(
  match_id_input text, 
  admin_id_input uuid, 
  force_t1_score int,
  force_t2_score int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_game_id uuid;
  winner_team_calc int;
  affected_rows int;
  
  -- MMR Variables
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
  -- We assume admin_id_input implies they have permission (check on Node.js Side)
  
  BEGIN
      -- 0. Fetch Game ID
      SELECT gm.game_id INTO v_game_id
      FROM matches m
      JOIN game_modes gm ON m.game_mode_id = gm.id
      WHERE m.id::text = match_id_input;

      IF v_game_id IS NULL THEN
          RAISE EXCEPTION 'Game ID not found for match %.', match_id_input;
      END IF;

      -- 1. Determine Winner Logic based on Forced Scores
      IF force_t1_score > force_t2_score THEN
        winner_team_calc := 1;
      ELSIF force_t1_score < force_t2_score THEN
        winner_team_calc := 2;
      ELSE
        winner_team_calc := 0; -- Draw
      END IF;

      -- 2. Update the Matches Table
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

      -- 3. Ensure all stats are updated forcefully
      UPDATE match_players SET stats = json_build_object('score', force_t1_score)
      WHERE match_id::text = match_id_input AND team = 1;

      UPDATE match_players SET stats = json_build_object('score', force_t2_score)
      WHERE match_id::text = match_id_input AND team = 2;
      
      -- Update reports to 'admin_resolved'
      UPDATE match_reports SET status = 'admin_resolved' WHERE match_id::text = match_id_input;

      -- 4. Execute MMR Calculation completely identical to standard path
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

      expected_score_t1 := 1.0 / (1.0 + POWER(10.0, (team2_avg_mmr - team1_avg_mmr) / 400.0));
      expected_score_t2 := 1.0 / (1.0 + POWER(10.0, (team1_avg_mmr - team2_avg_mmr) / 400.0));

      IF winner_team_calc = 1 THEN
          actual_score_t1 := 1.0;
          actual_score_t2 := 0.0;
      ELSIF winner_team_calc = 2 THEN
          actual_score_t1 := 0.0;
          actual_score_t2 := 1.0;
      ELSE 
          actual_score_t1 := 0.5;
          actual_score_t2 := 0.5;
      END IF;

      FOR p_record IN 
          SELECT mp.user_id, mp.team, COALESCE(pm.mmr, 1000) as current_mmr, p.uuid_link
          FROM match_players mp
          LEFT JOIN players p ON mp.user_id = p.user_id
          LEFT JOIN player_mmr pm ON p.uuid_link::uuid = pm.user_id AND pm.game_id = v_game_id
          WHERE mp.match_id::text = match_id_input
      LOOP
          IF p_record.team = 1 THEN
              mmr_delta := k_factor * (actual_score_t1 - expected_score_t1);
          ELSE
              mmr_delta := k_factor * (actual_score_t2 - expected_score_t2);
          END IF;

          mmr_change_val := ROUND(mmr_delta);
          new_mmr_val := p_record.current_mmr + mmr_change_val;

          IF p_record.uuid_link IS NOT NULL THEN
              INSERT INTO player_mmr (user_id, game_id, mmr, updated_at)
              VALUES (p_record.uuid_link::uuid, v_game_id, new_mmr_val, NOW())
              ON CONFLICT (user_id, game_id) DO UPDATE
              SET mmr = EXCLUDED.mmr, updated_at = NOW();

              INSERT INTO mmr_history (match_id, player_uuid, old_mmr, new_mmr, change)
              VALUES (match_id_input::uuid, p_record.uuid_link::uuid, p_record.current_mmr, new_mmr_val, mmr_change_val);
          END IF;
      END LOOP;

      -- Close Lobby
      UPDATE lobbies
      SET status = 'finished'
      WHERE match_id::text = match_id_input;

      RETURN json_build_object('success', true, 'status', 'admin_resolved', 'winner_team', winner_team_calc, 't1_score', force_t1_score, 't2_score', force_t2_score);

  EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Transaction Failed: %', SQLERRM;
  END;
END;
$$;
