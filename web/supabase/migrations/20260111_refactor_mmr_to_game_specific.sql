-- 1. Create the new player_mmr table
CREATE TABLE IF NOT EXISTS player_mmr (
    user_id uuid NOT NULL REFERENCES players(uuid_link) ON DELETE CASCADE,
    game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    mmr int NOT NULL DEFAULT 1000,
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, game_id)
);

-- 2. Migrate existing MMR data
-- We pick a default game from the games table. If multiple actiive games exist, this might map them all to one, 
-- but assuming single game text for now or simple migration.
DO $$
DECLARE
    v_default_game_id uuid;
BEGIN
    SELECT id INTO v_default_game_id FROM games LIMIT 1;
    
    IF v_default_game_id IS NOT NULL THEN
        INSERT INTO player_mmr (user_id, game_id, mmr)
        SELECT uuid_link, v_default_game_id, COALESCE(mmr, 1000)
        FROM players
        WHERE uuid_link IS NOT NULL
        ON CONFLICT (user_id, game_id) 
        DO UPDATE SET mmr = EXCLUDED.mmr;
    END IF;
END $$;

-- 3. Update the RPC to use the new table
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
  -- Wrap execution in a block to ensure atomic failure if MMR math explodes
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

      -- 3. Update the Matches Table (Set Result)
      UPDATE matches
      SET 
        winner_team = winner_team_calc,
        status = 'finished',
        finished_at = NOW()
      WHERE id = match_id_input;
      
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      IF affected_rows = 0 THEN
          RAISE EXCEPTION 'Match ID % not found during update.', match_id_input;
      END IF;

      -- 3.5 Update match_players stats (scores)
      UPDATE match_players
      SET stats = json_build_object('score', my_score_input)
      WHERE match_id = match_id_input AND user_id = reporter_id_input;

      UPDATE match_players
      SET stats = json_build_object('score', opponent_score_input)
      WHERE match_id = match_id_input AND team != reporter_team;

      -- =================================================================================
      -- 4. MMR CALCULATION SYSTEM (Refactored for Game-ID)
      -- =================================================================================
      
      -- Find the Game ID for this match
      SELECT gm.game_id INTO v_game_id
      FROM matches m
      JOIN game_modes gm ON m.game_mode_id = gm.id
      WHERE m.id = match_id_input;

      IF v_game_id IS NULL THEN
          RAISE EXCEPTION 'Game ID not found for match %', match_id_input;
      END IF;

      -- A. Calculate Team Averages
      -- We must fetch MMR from player_mmr now.
      FOR p_record IN 
          SELECT mp.user_id, mp.team, COALESCE(pm.mmr, 1000) as current_mmr
          FROM match_players mp
          LEFT JOIN player_mmr pm ON mp.user_id = pm.user_id AND pm.game_id = v_game_id
          WHERE mp.match_id = match_id_input
      LOOP
          IF p_record.team = 1 THEN
              team1_mmr_sum := team1_mmr_sum + p_record.current_mmr;
              team1_count := team1_count + 1;
          ELSE
              team2_mmr_sum := team2_mmr_sum + p_record.current_mmr;
              team2_count := team2_count + 1;
          END IF;
      END LOOP;

      -- Avoid diff by zero
      IF team1_count > 0 THEN team1_avg_mmr := team1_mmr_sum / team1_count; ELSE team1_avg_mmr := 1000; END IF;
      IF team2_count > 0 THEN team2_avg_mmr := team2_mmr_sum / team2_count; ELSE team2_avg_mmr := 1000; END IF;

      -- B. Calculate Expected Scores (Elo Formula)
      -- E_A = 1 / (1 + 10 ^ ((R_B - R_A) / 400))
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
          SELECT mp.user_id, mp.team, COALESCE(pm.mmr, 1000) as current_mmr
          FROM match_players mp
          LEFT JOIN player_mmr pm ON mp.user_id = pm.user_id AND pm.game_id = v_game_id
          WHERE mp.match_id = match_id_input
      LOOP
          -- Calculate Delta
          IF p_record.team = 1 THEN
              mmr_delta := k_factor * (actual_score_t1 - expected_score_t1);
          ELSE
              mmr_delta := k_factor * (actual_score_t2 - expected_score_t2);
          END IF;

          mmr_change_val := ROUND(mmr_delta);
          new_mmr_val := p_record.current_mmr + mmr_change_val;

          -- 1. UPSERT Player MMR
          INSERT INTO player_mmr (user_id, game_id, mmr)
          VALUES (p_record.user_id, v_game_id, 1000 + mmr_change_val) -- Init at 1000 + delta if new? Or just current + delta?
          -- logic: if they didn't exist, p_record.current_mmr was 1000 (COALESCE). So new_mmr_val is 1000 + delta.
          -- So we can just insert `new_mmr_val` directly.
          ON CONFLICT (user_id, game_id) DO UPDATE
          SET mmr = new_mmr_val,
              updated_at = NOW();

          -- Corrected Logic:
          -- We already calculated new_mmr_val based on current (def 1000).
          -- So the INSERT ... VALUES ... ON CONFLICT SET mmr = new_mmr_val works for both cases.
          -- Wait, the VALUES clause should probably use new_mmr_val too?
          -- IF it's a new insert, we want it to be new_mmr_val.
          -- IF it's an update, we want it to be new_mmr_val.
          -- So:
          -- INSERT INTO player_mmr (..., mmr) VALUES (..., new_mmr_val) ON CONFLICT ... UPDATE SET mmr = EXCLUDED.mmr;

          -- 2. Insert History Log
          INSERT INTO mmr_history (match_id, player_uuid, old_mmr, new_mmr, change)
          VALUES (match_id_input, p_record.user_id, p_record.current_mmr, new_mmr_val, mmr_change_val);

      END LOOP;

      -- =================================================================================
      -- 5. Close the Related Lobby
      -- =================================================================================
      UPDATE lobbies
      SET status = 'finished'
      WHERE match_id = match_id_input;

      RETURN json_build_object('success', true, 'winner_team', winner_team_calc);

  EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Transaction Failed: %', SQLERRM;
  END;
END;
$$;

-- 4. Cleanup Schema (once confirmed)
-- ALTER TABLE players DROP COLUMN IF EXISTS mmr;
