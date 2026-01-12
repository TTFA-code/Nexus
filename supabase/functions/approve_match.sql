-- Function: Approve Match (Calculate Elo & Update History)
-- Uses 800-base Elo logic (K=32).
-- Supports Team vs Team (Average MMR) or 1v1.

create or replace function approve_match(match_id_input uuid)
returns json
language plpgsql
security definer
as $$
declare
  match_rec record;
  player_rec record;
  
  -- Team Aggregates
  team1_id int;
  team2_id int;
  
  team1_mmr_sum int := 0;
  team1_count int := 0;
  team1_avg int := 0;
  
  team2_mmr_sum int := 0;
  team2_count int := 0;
  team2_avg int := 0;
  
  -- Scores
  team1_score numeric;
  team2_score numeric;
  
  -- Elo Math
  team1_expected numeric;
  team2_expected numeric;
  
  team1_change int;
  team2_change int;
  
  k_factor int := 32;

begin
  -- 1. Fetch Match
  select * into match_rec from matches where id = match_id_input;
  
  if match_rec.id is null then
    return json_build_object('error', 'Match not found');
  end if;
  
  if match_rec.status = 'completed' then
    return json_build_object('error', 'Match already completed');
  end if;

  -- 2. Identify Teams
  -- We assume 2 teams present.
  select team into team1_id from match_players where match_id = match_id_input group by team order by team asc limit 1;
  select team into team2_id from match_players where match_id = match_id_input group by team order by team desc limit 1;
  
  if team1_id = team2_id or team2_id is null then
      return json_build_object('error', 'Not enough teams to calculate Elo');
  end if;

  -- 3. Calculate Team Averages
  -- Join with players table. Note: match_players.user_id is UUID. players.uuid_link is UUID.
  -- If mismatch exists (players.user_id = varchar), we need to join correctly.
  -- Based on recent fix, match_players.user_id is UUID. players table has uuid_link (UUID).
  
  -- Team 1
  select coalesce(avg(p.mmr), 1200), count(*)
  into team1_avg, team1_count
  from match_players mp
  join players p on p.uuid_link = mp.user_id -- UUID Join
  where mp.match_id = match_id_input and mp.team = team1_id;
  
  -- Team 2
  select coalesce(avg(p.mmr), 1200), count(*)
  into team2_avg, team2_count
  from match_players mp
  join players p on p.uuid_link = mp.user_id
  where mp.match_id = match_id_input and mp.team = team2_id;

  -- 4. Determine Scores based on match_rec.winner_team
  if match_rec.winner_team = team1_id then
      team1_score := 1;
      team2_score := 0;
  elsif match_rec.winner_team = team2_id then
      team1_score := 0;
      team2_score := 1;
  else -- Draw
      team1_score := 0.5;
      team2_score := 0.5;
  end if;

  -- 5. Calculate Expected Score (800-base)
  -- E = 1 / (1 + 10 ^ ((Opponent - Me) / 800))
  team1_expected := 1.0 / (1.0 + power(10.0, (team2_avg - team1_avg)::numeric / 800.0));
  team2_expected := 1.0 / (1.0 + power(10.0, (team1_avg - team2_avg)::numeric / 800.0));
  
  -- 6. Calculate Change (K=32)
  team1_change := round(k_factor * (team1_score - team1_expected));
  team2_change := round(k_factor * (team2_score - team2_expected));

  -- 7. Apply Updates & Log History LOOP
  for player_rec in 
      select mp.user_id, mp.team, p.mmr
      from match_players mp
      join players p on p.uuid_link = mp.user_id
      where mp.match_id = match_id_input
  loop
      declare
          my_change int;
          new_rating int;
      begin
          if player_rec.team = team1_id then
              my_change := team1_change;
          else
              my_change := team2_change;
          end if;
          
          new_rating := player_rec.mmr + my_change;
          
          -- Update Player
          update players 
          set mmr = new_rating 
          where uuid_link = player_rec.user_id;
          
          -- Insert History
          insert into mmr_history (user_id, match_id, old_mmr, new_mmr, change)
          values (
             player_rec.user_id, -- Depending on schema, mmr_history might take UUID or Text. 
             -- If mmr_history.user_id is TEXT (matches players.user_id), we need to fetch the text ID.
             -- Let's fetch text ID to be safe if schema uses text.
             -- Actually, let's use a subquery or fetch it in the loop.
             -- optimizing: Let's assume mmr_history uses same type as match_players.user_id (UUID) OR handle text.
             -- Given recent churn, let's look up the text ID from players if needed.
             -- Safe bet: (select user_id from players where uuid_link = player_rec.user_id)
             (select user_id from players where uuid_link = player_rec.user_id),
             match_id_input,
             player_rec.mmr,
             new_rating,
             my_change
          );
      end;
  end loop;

  -- 8. Update Match Status
  update matches
  set status = 'completed'
  where id = match_id_input;

  return json_build_object(
    'success', true, 
    'team1_change', team1_change, 
    'team2_change', team2_change
  );
end;
$$;
