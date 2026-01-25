-- =================================================================================
-- NEXUS DATABASE SCHEMA - COMPREHENSIVE MIGRATION
-- =================================================================================
-- This file eliminates all PGRST204 (missing column) and 42501 (permission) errors
-- Run this in Supabase SQL Editor
-- =================================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =================================================================================
-- 1. DROP EXISTING TABLES (Clean Migration)
-- =================================================================================
-- Drop in reverse dependency order
DROP TABLE IF EXISTS public.queues CASCADE;
DROP TABLE IF EXISTS public.guild_bans CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.match_reports CASCADE;
DROP TABLE IF EXISTS public.mmr_history CASCADE;
DROP TABLE IF EXISTS public.player_mmr CASCADE;
DROP TABLE IF EXISTS public.ready_checks CASCADE;
DROP TABLE IF EXISTS public.match_players CASCADE;
DROP TABLE IF EXISTS public.lobby_players CASCADE;
DROP TABLE IF EXISTS public.lobbies CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.game_modes CASCADE;
DROP TABLE IF EXISTS public.server_members CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;
DROP TABLE IF EXISTS public.guilds CASCADE;

-- =================================================================================
-- 2. CORE TABLES (Base Layer)
-- =================================================================================

-- Guilds (Discord Servers)
CREATE TABLE IF NOT EXISTS public.guilds (
    guild_id text PRIMARY KEY,
    name text,
    created_at timestamptz DEFAULT now(),
    premium_tier integer DEFAULT 0,
    announcement_channel_id text
);

-- Games (Base Game Library)
CREATE TABLE IF NOT EXISTS public.games (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    icon_url text,
    created_at timestamptz DEFAULT now()
);

-- Players (User Profiles)
CREATE TABLE IF NOT EXISTS public.players (
    user_id text PRIMARY KEY, -- Discord Snowflake ID
    username text,
    avatar_url text,
    uuid_link text UNIQUE, -- Supabase Auth UUID Link
    mmr integer DEFAULT 1000,
    is_banned boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Server Members (Guild Membership & Roles)
CREATE TABLE IF NOT EXISTS public.server_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
    guild_id text NOT NULL REFERENCES public.guilds(guild_id) ON DELETE CASCADE,
    role text DEFAULT 'player', -- 'player', 'nexus-admin', 'owner'
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, guild_id)
);

-- =================================================================================
-- 2. GAME STRUCTURE TABLES
-- =================================================================================

-- Game Modes (Per Guild, Per Game)
CREATE TABLE IF NOT EXISTS public.game_modes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id text REFERENCES public.guilds(guild_id) ON DELETE CASCADE,
    game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
    name text NOT NULL,
    team_size integer DEFAULT 5,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Matches
CREATE TABLE IF NOT EXISTS public.matches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id text REFERENCES public.guilds(guild_id) ON DELETE CASCADE,
    game_mode_id uuid REFERENCES public.game_modes(id) ON DELETE SET NULL,
    region text DEFAULT 'NA',
    status text DEFAULT 'active', -- 'active', 'finished', 'ongoing', 'started', 'pending'
    winner_team integer,
    started_at timestamptz DEFAULT now(),
    finished_at timestamptz,
    creator_id text, -- Discord ID (loose, not enforced FK)
    metadata jsonb DEFAULT '{}'::jsonb,
    mvp_user_id text REFERENCES public.players(user_id) ON DELETE SET NULL
);

-- Lobbies
CREATE TABLE IF NOT EXISTS public.lobbies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id text REFERENCES public.guilds(guild_id) ON DELETE CASCADE,
    game_mode_id uuid REFERENCES public.game_modes(id) ON DELETE SET NULL,
    game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
    match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
    creator_id text NOT NULL, -- Discord Snowflake ID
    status text DEFAULT 'WAITING', -- 'WAITING', 'READY_CHECK', 'starting', 'live', 'finished', 'SCHEDULED'
    region text DEFAULT 'NA',
    is_private boolean DEFAULT false,
    is_tournament boolean DEFAULT false,
    voice_required boolean DEFAULT false,
    notes text,
    sector_key text, -- Password for private lobbies
    scheduled_start timestamptz,
    created_at timestamptz DEFAULT now()
);

-- =================================================================================
-- 3. JUNCTION/LINK TABLES
-- =================================================================================

-- Lobby Players
CREATE TABLE IF NOT EXISTS public.lobby_players (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lobby_id uuid NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
    status text DEFAULT 'joined', -- 'joined', 'ACCEPTED', 'DECLINED'
    team integer,
    is_ready boolean DEFAULT false,
    joined_at timestamptz DEFAULT now(),
    UNIQUE(lobby_id, user_id)
);

-- Match Players
CREATE TABLE IF NOT EXISTS public.match_players (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
    team integer NOT NULL,
    stats jsonb DEFAULT '{}'::jsonb,
    UNIQUE(match_id, user_id)
);

-- Ready Checks (Matchmaking System)
CREATE TABLE IF NOT EXISTS public.ready_checks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lobby_id uuid NOT NULL REFERENCES public.lobbies(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
    status text DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'DECLINED'
    accepted boolean DEFAULT false,
    responded_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(lobby_id, user_id)
);

-- =================================================================================
-- 4. MMR & STATISTICS TABLES
-- =================================================================================

-- Player MMR (Per Game, Per Player)
CREATE TABLE IF NOT EXISTS public.player_mmr (
    user_id uuid NOT NULL REFERENCES public.players(uuid_link) ON DELETE CASCADE,
    game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    mmr integer DEFAULT 1000,
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, game_id)
);

-- MMR History (Audit Trail)
CREATE TABLE IF NOT EXISTS public.mmr_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id uuid REFERENCES public.matches(id) ON DELETE SET NULL,
    player_uuid uuid NOT NULL, -- Supabase Auth UUID
    old_mmr integer,
    new_mmr integer,
    change integer,
    created_at timestamptz DEFAULT now()
);

-- Match Reports
CREATE TABLE IF NOT EXISTS public.match_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
    reporter_id text REFERENCES public.players(user_id) ON DELETE SET NULL,
    result_data jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending', -- 'pending', 'RESOLVED', 'REJECTED'
    created_at timestamptz DEFAULT now()
);

-- =================================================================================
-- 5. MODERATION TABLES
-- =================================================================================

-- Reports (Player Reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id text REFERENCES public.guilds(guild_id) ON DELETE CASCADE,
    reporter_id text REFERENCES public.players(user_id) ON DELETE SET NULL,
    reported_id text REFERENCES public.players(user_id) ON DELETE SET NULL,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'open', -- 'open', 'resolved', 'rejected'
    created_at timestamptz DEFAULT now()
);

-- Guild Bans
CREATE TABLE IF NOT EXISTS public.guild_bans (
    guild_id text NOT NULL REFERENCES public.guilds(guild_id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
    reason text,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (guild_id, user_id)
);

-- =================================================================================
-- 6. QUEUE SYSTEM
-- =================================================================================

-- Queues (Matchmaking Queue)
CREATE TABLE IF NOT EXISTS public.queues (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
    game_mode_id uuid NOT NULL REFERENCES public.game_modes(id) ON DELETE CASCADE,
    joined_at timestamptz DEFAULT now()
);

-- =================================================================================
-- 7. CUSTOM TYPES
-- =================================================================================

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =================================================================================
-- 8. RPC FUNCTIONS
-- =================================================================================

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS check_active_session(text);
DROP FUNCTION IF EXISTS check_active_session(uuid);

-- Check Active Session (prevents players from joining multiple matches)
CREATE OR REPLACE FUNCTION check_active_session(p_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count int;
BEGIN
    -- Check if user is in any active match
    SELECT COUNT(*) INTO v_count
    FROM match_players mp
    JOIN matches m ON mp.match_id = m.id
    WHERE mp.user_id = p_user_id
    AND m.status IN ('active', 'ongoing', 'started', 'pending', 'pending_approval')
    AND m.finished_at IS NULL;

    RETURN v_count > 0;
END;
$$;

-- Drop all versions of submit_match_report
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

-- Submit Match Report (with MMR calculation)
CREATE OR REPLACE FUNCTION submit_match_report(
    p_match_id text,
    p_reporter_id text,
    p_my_score integer,
    p_opponent_score integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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
        WHERE m.id::text = p_match_id;

        IF v_game_id IS NULL THEN
            RAISE EXCEPTION 'Game ID not found for match %. Ensure Game Mode is linked to a Game.', p_match_id;
        END IF;

        -- 1. Use reporter_id directly as Discord ID
        reporter_discord_id := p_reporter_id;

        -- 2. Verify Reporter and Get Team
        SELECT mp.team INTO reporter_team
        FROM match_players mp
        WHERE mp.match_id::text = p_match_id
        AND mp.user_id = reporter_discord_id;

        IF reporter_team IS NULL THEN
            RETURN json_build_object('error', 'Reporter is not a participant in this match.');
        END IF;

        -- 3. Determine Winner Logic
        IF p_my_score > p_opponent_score THEN
            winner_team_calc := reporter_team;
        ELSIF p_my_score < p_opponent_score THEN
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
        WHERE id::text = p_match_id;
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        IF affected_rows = 0 THEN
            RAISE EXCEPTION 'Match ID % not found during update.', p_match_id;
        END IF;

        -- 5. Update match_players stats
        UPDATE match_players
        SET stats = json_build_object('score', p_my_score)
        WHERE match_id::text = p_match_id AND user_id = reporter_discord_id;

        UPDATE match_players
        SET stats = json_build_object('score', p_opponent_score)
        WHERE match_id::text = p_match_id AND team != reporter_team;

        -- 6. MMR CALCULATION SYSTEM (Game-Specific)
        
        -- A. Calculate Team Averages
        FOR p_record IN 
            SELECT mp.user_id, mp.team, COALESCE(pm.mmr, 1000) as current_mmr, p.uuid_link
            FROM match_players mp
            LEFT JOIN players p ON mp.user_id = p.user_id
            LEFT JOIN player_mmr pm ON p.uuid_link::uuid = pm.user_id AND pm.game_id = v_game_id
            WHERE mp.match_id::text = p_match_id
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

        -- B. Calculate Expected Scores (Elo formula)
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

        -- D. Update Player MMR
        FOR p_record IN 
            SELECT mp.user_id, mp.team, COALESCE(pm.mmr, 1000) as current_mmr, p.uuid_link
            FROM match_players mp
            LEFT JOIN players p ON mp.user_id = p.user_id
            LEFT JOIN player_mmr pm ON p.uuid_link::uuid = pm.user_id AND pm.game_id = v_game_id
            WHERE mp.match_id::text = p_match_id
        LOOP
            -- Calculate Delta
            IF p_record.team = 1 THEN
                mmr_delta := k_factor * (actual_score_t1 - expected_score_t1);
            ELSE
                mmr_delta := k_factor * (actual_score_t2 - expected_score_t2);
            END IF;

            mmr_change_val := ROUND(mmr_delta);
            new_mmr_val := p_record.current_mmr + mmr_change_val;

            -- Update/Insert Player MMR (Game Specific)
            IF p_record.uuid_link IS NOT NULL THEN
                INSERT INTO player_mmr (user_id, game_id, mmr, updated_at)
                VALUES (p_record.uuid_link::uuid, v_game_id, new_mmr_val, NOW())
                ON CONFLICT (user_id, game_id) DO UPDATE
                SET mmr = EXCLUDED.mmr, updated_at = NOW();

                -- Insert History Log
                INSERT INTO mmr_history (match_id, player_uuid, old_mmr, new_mmr, change)
                VALUES (p_match_id::uuid, p_record.uuid_link::uuid, p_record.current_mmr, new_mmr_val, mmr_change_val);
            END IF;
        END LOOP;

        -- 7. Close Related Lobby
        UPDATE lobbies
        SET status = 'finished'
        WHERE match_id::text = p_match_id;

        -- 8. Record Report
        INSERT INTO match_reports (match_id, reporter_id, result_data, status)
        VALUES (
            p_match_id::uuid,
            reporter_discord_id,
            json_build_object('my_score', p_my_score, 'opponent_score', p_opponent_score, 'reporter_team', reporter_team),
            'RESOLVED'
        );

        RETURN json_build_object('success', true, 'winner_team', winner_team_calc);

    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Transaction Failed: %', SQLERRM;
    END;
END;
$$;

-- =================================================================================
-- 9. TRIGGERS
-- =================================================================================

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply triggers to all tables with updated_at
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

-- =================================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================================

-- Enable RLS on all tables
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobby_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ready_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_mmr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mmr_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Create permissive policies for authenticated users and service role

-- Guilds
CREATE POLICY "guilds_select_authenticated" ON public.guilds FOR SELECT TO authenticated USING (true);
CREATE POLICY "guilds_all_service" ON public.guilds FOR ALL TO service_role USING (true);

-- Games
CREATE POLICY "games_select_authenticated" ON public.games FOR SELECT TO authenticated USING (true);
CREATE POLICY "games_all_service" ON public.games FOR ALL TO service_role USING (true);

-- Players
CREATE POLICY "players_select_authenticated" ON public.players FOR SELECT TO authenticated USING (true);
CREATE POLICY "players_insert_authenticated" ON public.players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "players_update_authenticated" ON public.players FOR UPDATE TO authenticated USING (true);
CREATE POLICY "players_all_service" ON public.players FOR ALL TO service_role USING (true);

-- Server Members
CREATE POLICY "server_members_select_authenticated" ON public.server_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "server_members_all_service" ON public.server_members FOR ALL TO service_role USING (true);

-- Game Modes
CREATE POLICY "game_modes_select_authenticated" ON public.game_modes FOR SELECT TO authenticated USING (true);
CREATE POLICY "game_modes_all_service" ON public.game_modes FOR ALL TO service_role USING (true);

-- Matches
CREATE POLICY "matches_select_authenticated" ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "matches_insert_authenticated" ON public.matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "matches_update_authenticated" ON public.matches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "matches_all_service" ON public.matches FOR ALL TO service_role USING (true);

-- Lobbies
CREATE POLICY "lobbies_select_authenticated" ON public.lobbies FOR SELECT TO authenticated USING (true);
CREATE POLICY "lobbies_insert_authenticated" ON public.lobbies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lobbies_update_authenticated" ON public.lobbies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "lobbies_delete_authenticated" ON public.lobbies FOR DELETE TO authenticated USING (true);
CREATE POLICY "lobbies_all_service" ON public.lobbies FOR ALL TO service_role USING (true);

-- Lobby Players
CREATE POLICY "lobby_players_select_authenticated" ON public.lobby_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "lobby_players_insert_authenticated" ON public.lobby_players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lobby_players_update_authenticated" ON public.lobby_players FOR UPDATE TO authenticated USING (true);
CREATE POLICY "lobby_players_delete_authenticated" ON public.lobby_players FOR DELETE TO authenticated USING (true);
CREATE POLICY "lobby_players_all_service" ON public.lobby_players FOR ALL TO service_role USING (true);

-- Match Players
CREATE POLICY "match_players_select_authenticated" ON public.match_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "match_players_insert_authenticated" ON public.match_players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "match_players_all_service" ON public.match_players FOR ALL TO service_role USING (true);

-- Ready Checks
CREATE POLICY "ready_checks_select_authenticated" ON public.ready_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "ready_checks_insert_authenticated" ON public.ready_checks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ready_checks_update_authenticated" ON public.ready_checks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ready_checks_delete_authenticated" ON public.ready_checks FOR DELETE TO authenticated USING (true);
CREATE POLICY "ready_checks_all_service" ON public.ready_checks FOR ALL TO service_role USING (true);

-- Player MMR
CREATE POLICY "player_mmr_select_authenticated" ON public.player_mmr FOR SELECT TO authenticated USING (true);
CREATE POLICY "player_mmr_all_service" ON public.player_mmr FOR ALL TO service_role USING (true);

-- MMR History
CREATE POLICY "mmr_history_select_authenticated" ON public.mmr_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "mmr_history_all_service" ON public.mmr_history FOR ALL TO service_role USING (true);

-- Match Reports
CREATE POLICY "match_reports_select_authenticated" ON public.match_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "match_reports_insert_authenticated" ON public.match_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "match_reports_all_service" ON public.match_reports FOR ALL TO service_role USING (true);

-- Reports
CREATE POLICY "reports_select_authenticated" ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "reports_insert_authenticated" ON public.reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "reports_all_service" ON public.reports FOR ALL TO service_role USING (true);

-- Guild Bans
CREATE POLICY "guild_bans_select_authenticated" ON public.guild_bans FOR SELECT TO authenticated USING (true);
CREATE POLICY "guild_bans_all_service" ON public.guild_bans FOR ALL TO service_role USING (true);

-- Queues
CREATE POLICY "queues_select_authenticated" ON public.queues FOR SELECT TO authenticated USING (true);
CREATE POLICY "queues_insert_authenticated" ON public.queues FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "queues_delete_authenticated" ON public.queues FOR DELETE TO authenticated USING (true);
CREATE POLICY "queues_all_service" ON public.queues FOR ALL TO service_role USING (true);

-- =================================================================================
-- 11. GRANT PERMISSIONS
-- =================================================================================

-- Grant all permissions on all tables to required roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant function execution permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =================================================================================
-- 12. INDEXES FOR PERFORMANCE
-- =================================================================================

-- Create indexes on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_players_uuid_link ON public.players(uuid_link);
CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON public.server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_server_members_guild_id ON public.server_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON public.lobbies(status);
CREATE INDEX IF NOT EXISTS idx_lobbies_guild_id ON public.lobbies(guild_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_creator_id ON public.lobbies(creator_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby_id ON public.lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_user_id ON public.lobby_players(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON public.match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_user_id ON public.match_players(user_id);
CREATE INDEX IF NOT EXISTS idx_ready_checks_lobby_id ON public.ready_checks(lobby_id);
CREATE INDEX IF NOT EXISTS idx_player_mmr_user_id ON public.player_mmr(user_id);
CREATE INDEX IF NOT EXISTS idx_mmr_history_player_uuid ON public.mmr_history(player_uuid);

-- =================================================================================
-- 13. MISSING LOGIC FIXES (Triggers & Constraints)
-- =================================================================================

-- 1. AUTO-JOIN LOBBY CREATOR (Critical Fix for UI Button Issue)
CREATE OR REPLACE FUNCTION auto_join_lobby_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Automatically add creator to lobby_players for ALL lobby types
    INSERT INTO lobby_players (lobby_id, user_id, status, is_ready)
    VALUES (NEW.id, NEW.creator_id, 'joined', false)
    ON CONFLICT (lobby_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_join_creator
AFTER INSERT ON lobbies
FOR EACH ROW
EXECUTE FUNCTION auto_join_lobby_creator();

-- 2. INITIALIZE MMR FOR NEW PLAYERS (Fix Empty Profile Issue)
CREATE OR REPLACE FUNCTION initialize_player_mmr()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- When uuid_link is set, initialize MMR for all active games
    INSERT INTO player_mmr (user_id, game_id, mmr, updated_at)
    SELECT 
        NEW.uuid_link::uuid,
        g.id,
        1000,  -- Default starting MMR
        NOW()
    FROM games g
    WHERE NEW.uuid_link IS NOT NULL
    ON CONFLICT (user_id, game_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_initialize_mmr
AFTER INSERT OR UPDATE OF uuid_link ON players
FOR EACH ROW
WHEN (NEW.uuid_link IS NOT NULL)
EXECUTE FUNCTION initialize_player_mmr();

-- 3. CLEANUP FINISHED LOBBIES (Prevent Data Bloat)
CREATE OR REPLACE FUNCTION cleanup_finished_lobby()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.status = 'finished' AND OLD.status != 'finished' THEN
        -- Clean up transient ready check data
        DELETE FROM ready_checks WHERE lobby_id = NEW.id;
        -- Keep lobby_players for historical/analytics purposes
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_lobby
AFTER UPDATE OF status ON lobbies
FOR EACH ROW
EXECUTE FUNCTION cleanup_finished_lobby();

-- 4. VALIDATION CONSTRAINTS (Data Integrity)

-- A. Match team assignment (only 1 or 2)
DO $$
BEGIN
    ALTER TABLE match_players
    ADD CONSTRAINT match_players_team_check CHECK (team IN (1, 2));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- B. MMR bounds (0 to 10000)
DO $$
BEGIN
    ALTER TABLE player_mmr
    ADD CONSTRAINT player_mmr_bounds CHECK (mmr >= 0 AND mmr <= 10000);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE players
    ADD CONSTRAINT players_mmr_bounds CHECK (mmr >= 0 AND mmr <= 10000);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- C. Team size limits (1 to 10 players per team)
DO $$
BEGIN
    ALTER TABLE game_modes
    ADD CONSTRAINT game_modes_team_size_check CHECK (team_size >= 1 AND team_size <= 10);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- D. Status validation (lobbies)
DO $$
BEGIN
    ALTER TABLE lobbies
    ADD CONSTRAINT lobbies_status_check 
    CHECK (status IN ('WAITING', 'READY_CHECK', 'starting', 'live', 'finished', 'SCHEDULED'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- E. Status validation (matches)
DO $$
BEGIN
    ALTER TABLE matches
    ADD CONSTRAINT matches_status_check
    CHECK (status IN ('active', 'finished', 'ongoing', 'started', 'pending', 'pending_approval'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- F. Status validation (lobby_players)
DO $$
BEGIN
    ALTER TABLE lobby_players
    ADD CONSTRAINT lobby_players_status_check
    CHECK (status IN ('joined', 'ACCEPTED', 'DECLINED'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- G. Status validation (ready_checks)
DO $$
BEGIN
    ALTER TABLE ready_checks
    ADD CONSTRAINT ready_checks_status_check
    CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =================================================================================
-- 11. ENABLE REALTIME
-- =================================================================================

-- Add tables to the publication to enable client-side subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobbies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lobby_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ready_checks;

-- =================================================================================
-- END OF SCHEMA MIGRATION
-- =================================================================================
-- After running this, verify with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- 
-- Verify triggers:
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';
-- 
-- Verify constraints:
-- SELECT conname, conrelid::regclass FROM pg_constraint WHERE connamespace = 'public'::regnamespace;
--
-- Verify Realtime:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
-- =================================================================================
