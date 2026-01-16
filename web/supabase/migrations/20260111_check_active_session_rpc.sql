-- Create RPC to check for active sessions
CREATE OR REPLACE FUNCTION check_active_session(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  -- Check if user is in any match that is NOT finished
  -- We check for statuses that indicate an ongoing game.
  -- Based on codebase: 'active', 'ongoing' are seen. User requested 'started', 'pending'.
  -- We will include all non-terminal states.
  
  SELECT COUNT(*) INTO v_count
  FROM match_players mp
  JOIN matches m ON mp.match_id = m.id
  WHERE mp.user_id = p_user_id
  AND m.status IN ('active', 'ongoing', 'started', 'pending', 'pending_approval')
  AND m.finished_at IS NULL; -- redundant safety check

  RETURN v_count > 0;
END;
$$;
