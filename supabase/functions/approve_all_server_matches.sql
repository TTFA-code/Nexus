-- Function: Approve All Pending Matches for a Server (Guild)
-- Iterates through all 'pending_approval' matches for the given guild_id.
-- Calls approve_match() for each to ensure Elo calculation and cleanups run.

create or replace function approve_all_server_matches(guild_id_input text)
returns json
language plpgsql
security definer
as $$
declare
  match_rec record;
  processed_count int := 0;
  failed_count int := 0;
begin
  -- Loop through all pending matches for this guild
  -- We join game_modes to check the guild_id
  for match_rec in 
    select m.id 
    from matches m
    join game_modes gm on m.game_mode_id = gm.id
    where m.status = 'pending_approval'
      and gm.guild_id = guild_id_input
  loop
    -- Call the individual approve_match function
    -- We can ignore the result or check for error, but usually we just process.
    -- To be safe, we could wrap in a block, but let's trust approve_match handles its own validation.
    
    perform approve_match(match_rec.id);
    processed_count := processed_count + 1;
    
  end loop;

  return json_build_object(
    'success', true, 
    'processed_count', processed_count
  );
end;
$$;
