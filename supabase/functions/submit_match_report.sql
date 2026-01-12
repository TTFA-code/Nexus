-- Function to Submit Match Result and Clean Up
-- Handles: Score Update, Status Change, and Cleanup of Queues/Lobbies (Type-Safe Version)
-- Fixes: 42883 (uuid = text) errors by explicit casting and correct table joins.

create or replace function submit_match_report(
  match_id_input uuid,
  reporter_id_input uuid,
  my_score_input numeric,
  opponent_score_input numeric
)
returns json
language plpgsql
security definer
as $$
declare
  match_record record;
  reporter_record record;
  opponent_record record;
  winner_team_val int;
  
  -- Variables for cleanup
  reporter_uuid uuid;
  opponent_uuid uuid;
begin
  -- 1. Fetch Match
  select * into match_record from matches where id = match_id_input;
  
  if match_record.id is null then
    return json_build_object('error', 'Match not found');
  end if;

  -- 2. Fetch Reporter (Participant Check)
  -- match_players.user_id is UUID (Supabase Auth ID)
  
  select * into reporter_record 
  from match_players 
  where match_id = match_id_input 
  and user_id = reporter_id_input;

  if reporter_record.user_id is null then
     return json_build_object('error', 'You are not a participant in this match');
  end if;
  
  reporter_uuid := reporter_record.user_id;

  -- 3. Fetch Opponent
  select * into opponent_record 
  from match_players 
  where match_id = match_id_input 
  and user_id != reporter_id_input
  limit 1;
  
  if opponent_record.user_id is not null then
      opponent_uuid := opponent_record.user_id;
  end if;

  -- 4. Determine Winner
  if my_score_input > opponent_score_input then
    winner_team_val := reporter_record.team;
  elsif opponent_score_input > my_score_input then
    winner_team_val := opponent_record.team; 
  elsif my_score_input = opponent_score_input then
    winner_team_val := 0; 
  end if;

  -- 5. Update Stats
  update match_players
  set stats = jsonb_set(coalesce(stats, '{}'), '{score}', to_jsonb(my_score_input))
  where match_id = match_id_input and user_id = reporter_uuid;

  if opponent_uuid is not null then
    update match_players
    set stats = jsonb_set(coalesce(stats, '{}'), '{score}', to_jsonb(opponent_score_input))
    where match_id = match_id_input and user_id = opponent_uuid;
  end if;

  -- 7. Update Match Status
  update matches
  set 
    status = 'pending_approval',
    winner_team = winner_team_val,
    finished_at = now()
  where id = match_id_input;

  -- 8. Cleanup Queues (The "Arena Cleanup")
  -- Optimization: Single DELETE using Discord IDs fetched via UUID link.
  -- Explicitly cast inputs where necessary to avoid ambiguity, though input vars are typed.
  
  DELETE FROM queues
  WHERE user_id IN (
    SELECT user_id -- Select the Text Discord ID
    FROM players 
    WHERE uuid_link = reporter_uuid -- UUID = UUID
       OR (opponent_uuid IS NOT NULL AND uuid_link = opponent_uuid)
  );

  -- 9. Cleanup Lobby
  update lobbies
  set status = 'finished'
  where match_id = match_id_input;

  return json_build_object('success', true);
end;
$$;
