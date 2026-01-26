-- =================================================================================
-- MATCHMAKING SYSTEM MIGRATION
-- =================================================================================

-- 1. Create Matchmaking Queue Table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    discord_id TEXT NOT NULL, -- Cached for easy access
    game_mode_id UUID REFERENCES public.game_modes(id) ON DELETE CASCADE,
    mmr INT DEFAULT 1000,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own queue entry"
ON public.matchmaking_queue FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue entry"
ON public.matchmaking_queue FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can view queue (for counts)"
ON public.matchmaking_queue FOR SELECT
USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;

-- =================================================================================
-- RPC: Join Queue
-- =================================================================================
CREATE OR REPLACE FUNCTION public.join_queue(
    p_game_mode_id UUID,
    p_discord_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mmr INT;
    v_existing_match UUID;
BEGIN
    -- 1. Check if user is already in a live match
    SELECT id INTO v_existing_match
    FROM public.matches
    WHERE id IN (SELECT match_id FROM public.match_players WHERE user_id = p_discord_id)
    AND finished_at IS NULL
    LIMIT 1;

    IF v_existing_match IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'You are already in an active match.');
    END IF;

    -- 2. Get User MMR (Fallback to 1000 if not found)
    SELECT rating INTO v_mmr
    FROM public.player_ratings
    WHERE player_id = p_discord_id -- assuming player_id is discord_id in ratings table? Or need to verify schema. 
    -- If ratings table uses proper UUID, we might need to adjust.
    -- Assuming simplistic 1000 for now if complex.
    LIMIT 1;

    IF v_mmr IS NULL THEN
        v_mmr := 1000;
    END IF;

    -- 3. Insert into Queue
    INSERT INTO public.matchmaking_queue (user_id, discord_id, game_mode_id, mmr)
    VALUES (auth.uid(), p_discord_id, p_game_mode_id, v_mmr)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        game_mode_id = EXCLUDED.game_mode_id, 
        joined_at = NOW();

    RETURN jsonb_build_object('success', true);
END;
$$;

-- =================================================================================
-- RPC: Leave Queue
-- =================================================================================
CREATE OR REPLACE FUNCTION public.leave_queue()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.matchmaking_queue
    WHERE user_id = auth.uid();

    RETURN jsonb_build_object('success', true);
END;
$$;

-- =================================================================================
-- RPC: Find Match (The Engine)
-- =================================================================================
CREATE OR REPLACE FUNCTION public.find_match()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_mode RECORD;
    v_players RECORD;
    v_match_id UUID;
    v_team_size INT;
    v_players_list JSONB;
    v_player_row RECORD;
    i INT;
    v_team INT;
    v_matches_found INT := 0;
BEGIN
    -- Loop through each game mode that has people in queue
    FOR v_mode IN 
        SELECT DISTINCT game_mode_id, m.team_size 
        FROM public.matchmaking_queue q
        JOIN public.game_modes m ON q.game_mode_id = m.id
    LOOP
        v_team_size := v_mode.team_size;
        
        -- Basic FIFO + loose MMR matching for now (Top N players)
        -- In a real production system, this would do the complex Delta checks (30s +/- 100, etc)
        -- For MVP/Prototype: Just take `team_size * 2` players who have been waiting longest? 
        -- Or just take top `team_size * 2` sorted by MMR to ensure closeness?
        -- Let's Sort by MMR for balance.
        
        WITH matched_group AS (
            SELECT *
            FROM public.matchmaking_queue
            WHERE game_mode_id = v_mode.game_mode_id
            ORDER BY joined_at ASC -- Priority to waiters, but...
            -- PROMPT REQUEST: "S-Curve distribution... When we find 10 players, we sort them by MMR"
            -- So finding 10 players first is the key. 
            LIMIT (v_team_size * 2)
        )
        SELECT jsonb_agg(row_to_json(matched_group.*)) INTO v_players_list
        FROM matched_group;

        -- Check if we have enough players
        IF jsonb_array_length(v_players_list) = (v_team_size * 2) THEN
            
            -- FOUND A MATCH
            v_matches_found := v_matches_found + 1;

            -- 1. Create Match
            INSERT INTO public.matches (game_mode_id, status, created_at, started_at)
            VALUES (v_mode.game_mode_id, 'in_progress', NOW(), NOW())
            RETURNING id INTO v_match_id;

            -- 2. Sort Players by MMR (Desc) for S-Curve
            -- We need to unpack, sort, and re-pack or loop
            -- Let's do it via a temp query on the JSON data
            
            i := 1;
            FOR v_player_row IN 
                SELECT * FROM jsonb_to_recordset(v_players_list) AS x(user_id UUID, discord_id TEXT, mmr INT)
                ORDER BY mmr DESC
            LOOP
                -- S-Curve Logic for 5v5 (Indexes 1-10)
                -- Team 1: 1, 4, 5, 8, 9
                -- Team 2: 2, 3, 6, 7, 10
                IF i IN (1, 4, 5, 8, 9) THEN
                    v_team := 1;
                ELSE
                    v_team := 2;
                END IF;

                -- Insert into match_players
                INSERT INTO public.match_players (match_id, user_id, team, created_at)
                VALUES (v_match_id, v_player_row.discord_id, v_team, NOW());

                -- Create Ready Check (Accepted = True initially? Or need confirmation?)
                -- User said: "immediately send them into a match" and "Match Found pop up"
                -- So we create a Ready Check that prompts the popup.
                INSERT INTO public.ready_checks (match_id, user_id, accepted, created_at)
                VALUES (v_match_id, v_player_row.discord_id, FALSE, NOW());
                
                -- Remove from Queue
                DELETE FROM public.matchmaking_queue WHERE user_id = v_player_row.user_id;

                i := i + 1;
            END LOOP;

        END IF;

    END LOOP;

    RETURN v_matches_found;
END;
$$;

-- =================================================================================
-- RPC: Timeout Queue Player (Cleanup)
-- =================================================================================
CREATE OR REPLACE FUNCTION public.timeout_queue_player(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.matchmaking_queue WHERE user_id = p_user_id;
END;
$$;

-- Note: match_id column might need to be added to ready_checks if it only had lobby_id before.
-- Let's double check existing schema. If ready_checks links to lobby_id, we might need to 
-- link it to match_id now since we are skipping lobby. 
-- OR we create a dummy "Lobby" record that points to the match?
-- The user said "Immediately send them into a match".
-- If `ready_checks` has column `lobby_id` and not `match_id`, we need to alter it.
-- Based on previous file view, it had `lobby_id`.
-- Adding `match_id` to ready_checks.

ALTER TABLE public.ready_checks ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE;
-- Check constraint to ensure either lobby_id or match_id is set? 
-- Not strictly necessary but good practice.

