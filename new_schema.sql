-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Guilds (formerly Clubs)
CREATE TABLE IF NOT EXISTS public.guilds (
    guild_id text PRIMARY KEY, -- Text PK (Snowflake)
    name text,
    created_at timestamptz DEFAULT now(),
    premium_tier integer DEFAULT 0,
    announcement_channel_id text
);

-- 2. Games (Base Table)
CREATE TABLE IF NOT EXISTS public.games (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL,
    icon_url text
);

-- 3. Players (Base Table)
-- Changing to Strict Discord ID (TEXT) reference
CREATE TABLE IF NOT EXISTS public.players (
    user_id text PRIMARY KEY, -- Text PK (Discord Snowflake)
    username text,
    avatar_url text,
    uuid_link text, -- Legacy/Auth Link
    mmr integer DEFAULT 1000,
    is_banned boolean DEFAULT false
);

-- 4. Game Modes (Depends on Guilds + Games)
CREATE TABLE IF NOT EXISTS public.game_modes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id text REFERENCES public.guilds(guild_id) ON DELETE CASCADE,
    game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
    name text NOT NULL,
    team_size integer DEFAULT 5,
    is_active boolean DEFAULT true
);

-- 5. Matches (Depends on Guilds + Game Modes)
CREATE TABLE IF NOT EXISTS public.matches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id text REFERENCES public.guilds(guild_id) ON DELETE CASCADE,
    game_mode_id uuid REFERENCES public.game_modes(id),
    region text DEFAULT 'NA',
    status text DEFAULT 'active',
    winner_team integer,
    started_at timestamptz DEFAULT now(),
    finished_at timestamptz,
    creator_id text, -- Loose text or FK to players(user_id) if verified
    metadata jsonb,
    mvp_user_id text REFERENCES public.players(user_id) ON DELETE SET NULL
);

-- 6. Lobbies (Depends on Guilds + Game Modes + Matches)
CREATE TABLE IF NOT EXISTS public.lobbies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id text REFERENCES public.guilds(guild_id) ON DELETE CASCADE,
    game_mode_id uuid REFERENCES public.game_modes(id),
    match_id uuid REFERENCES public.matches(id),
    creator_id text NOT NULL, -- Storing Discord ID (Text)
    status text DEFAULT 'created',
    region text DEFAULT 'NA',
    is_private boolean DEFAULT false,
    is_tournament boolean DEFAULT false,
    voice_required boolean DEFAULT false,
    notes text,
    sector_key text,
    scheduled_start timestamptz,
    created_at timestamptz DEFAULT now(),
    game_id uuid REFERENCES public.games(id)
);

-- 7. Lobby Players (Link Table)
CREATE TABLE IF NOT EXISTS public.lobby_players (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lobby_id uuid REFERENCES public.lobbies(id) ON DELETE CASCADE,
    user_id text REFERENCES public.players(user_id) ON DELETE CASCADE, -- Explicitly TEXT FK
    status text DEFAULT 'joined',
    team integer,
    is_ready boolean DEFAULT false,
    joined_at timestamptz DEFAULT now()
);

-- 8. Match Players (Link Table)
CREATE TABLE IF NOT EXISTS public.match_players (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
    user_id text REFERENCES public.players(user_id) ON DELETE CASCADE, -- Explicitly TEXT FK
    team integer NOT NULL,
    stats jsonb
);

-- 9. Match Reports
CREATE TABLE IF NOT EXISTS public.match_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
    reporter_id text REFERENCES public.players(user_id), -- Explicitly TEXT FK
    result_data jsonb,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- 10. MMR History
CREATE TABLE IF NOT EXISTS public.mmr_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id uuid REFERENCES public.matches(id),
    player_uuid text REFERENCES public.players(user_id) ON DELETE CASCADE, -- Explicitly TEXT FK (renamed var in logic to match, but column name kept for now or changed if user accepts breaking changes. User said "modify schema variables referencing uuid_link". I'll keep column name loose but type STRICT TEXT.)
    old_mmr integer,
    new_mmr integer,
    change integer,
    created_at timestamptz DEFAULT now()
);

-- 11. Player MMR (Per Game Stats)
CREATE TABLE IF NOT EXISTS public.player_mmr (
    user_id text REFERENCES public.players(user_id) ON DELETE CASCADE, -- Explicitly TEXT FK
    game_id uuid REFERENCES public.games(id) ON DELETE CASCADE,
    mmr integer DEFAULT 1000,
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, game_id)
);

-- 12. Queues
CREATE TABLE IF NOT EXISTS public.queues (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.players(user_id) ON DELETE CASCADE, -- Explicitly TEXT FK
    game_mode_id uuid REFERENCES public.game_modes(id) ON DELETE CASCADE,
    joined_at timestamptz DEFAULT now()
);

-- 13. Reports (Moderation)
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id text REFERENCES public.guilds(guild_id) ON DELETE CASCADE,
    reporter_id text REFERENCES public.players(user_id), -- Explicitly TEXT FK
    reported_id text REFERENCES public.players(user_id), -- Explicitly TEXT FK
    reason text NOT NULL,
    details text,
    status text DEFAULT 'open',
    created_at timestamptz DEFAULT now()
);

-- 14. Guild Bans
CREATE TABLE IF NOT EXISTS public.guild_bans (
    guild_id text REFERENCES public.guilds(guild_id) ON DELETE CASCADE,
    user_id text REFERENCES public.players(user_id) ON DELETE CASCADE, -- Explicitly TEXT FK
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (guild_id, user_id)
);

-- 15. Custom Types
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 16. RPC: Submit Match Report
-- 16. RPC: Submit Match Report
DROP FUNCTION IF EXISTS submit_match_report(uuid, text, jsonb);
DROP FUNCTION IF EXISTS submit_match_report(uuid, text, integer, integer); -- Drop potential conflict

CREATE OR REPLACE FUNCTION submit_match_report(
    match_id_input uuid,
    reporter_id_input text,
    my_score_input integer,
    opponent_score_input integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_match_status text;
    v_reporter_team integer;
    v_winner_team integer;
    v_scores jsonb;
BEGIN
    -- 1. Check Match Status
    SELECT status INTO v_match_status
    FROM public.matches
    WHERE id = match_id_input;

    IF v_match_status IS NULL THEN
        RAISE EXCEPTION 'Match not found.';
    END IF;

    IF v_match_status != 'active' THEN 
        RAISE EXCEPTION 'Match is not ongoing (Current Status: %)', v_match_status;
    END IF;

    -- 2. Determine Reporter's Team
    SELECT team INTO v_reporter_team
    FROM public.match_players
    WHERE match_id = match_id_input AND user_id = reporter_id_input;

    IF v_reporter_team IS NULL THEN
        RAISE EXCEPTION 'Reporter % invalid for this match.', reporter_id_input;
    END IF;

    -- 3. Determine Winner
    IF my_score_input > opponent_score_input THEN
        v_winner_team := v_reporter_team;
    ELSIF my_score_input < opponent_score_input THEN
        -- Assuming 2 teams: 1 and 2. 
        IF v_reporter_team = 1 THEN v_winner_team := 2; ELSE v_winner_team := 1; END IF;
    ELSE
        v_winner_team := 0; -- Draw
    END IF;

    -- 4. Construct Metadata
    v_scores := jsonb_build_object(
        'reporter_score', my_score_input,
        'opponent_score', opponent_score_input,
        'reporter_team', v_reporter_team
    );

    -- 5. Update Match
    UPDATE public.matches
    SET 
        winner_team = v_winner_team,
        status = 'completed',
        finished_at = now(),
        metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('scores', v_scores)
    WHERE id = match_id_input;

    -- 6. Insert Report Log
    INSERT INTO public.match_reports (match_id, reporter_id, result_data, status)
    VALUES (match_id_input, reporter_id_input, v_scores, 'RESOLVED');

    -- 7. Trigger MMR Update
    IF v_winner_team != 0 THEN
        PERFORM update_mmr(match_id_input);
    END IF;

END;
$$;

-- 17. RPC: Update MMR (+20/-20 Simple Logic)
CREATE OR REPLACE FUNCTION update_mmr(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_winner_team integer;
    v_player record;
    v_change integer;
    v_new_mmr integer;
BEGIN
    -- Get Winner Team
    SELECT winner_team INTO v_winner_team
    FROM public.matches
    WHERE id = p_match_id;

    IF v_winner_team IS NULL THEN
        RAISE EXCEPTION 'Match has no winner declared.';
    END IF;

    -- Loop through all players in the match
    FOR v_player IN 
        SELECT mp.user_id, mp.team, p.mmr
        FROM public.match_players mp
        JOIN public.players p ON mp.user_id = p.user_id
        WHERE mp.match_id = p_match_id
    LOOP
        -- Calculate Change
        IF v_player.team = v_winner_team THEN
            v_change := 20;
        ELSE
            v_change := -20;
        END IF;

        v_new_mmr := v_player.mmr + v_change;

        -- Update Player MMR
        UPDATE public.players
        SET mmr = v_new_mmr
        WHERE user_id = v_player.user_id;

        -- Record History
        INSERT INTO public.mmr_history (
            match_id,
            player_uuid,
            old_mmr,
            new_mmr,
            change
        ) VALUES (
            p_match_id,
            v_player.user_id,
            v_player.mmr,
            v_new_mmr,
            v_change
        );
    END LOOP;
END;
$$;

-- 18. Automation: Auto-Update Timestamps
-- A. Create Trigger Function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- B. Apply Trigger to All Tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I;', t);
        EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION handle_updated_at();', t);
    END LOOP;
END;
$$;
