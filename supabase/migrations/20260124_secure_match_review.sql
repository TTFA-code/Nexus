-- Migration: Secure Match Review Function
-- Description: Replaces the insecure/simple 'admin_match_review' view with a secure RPC function 'get_matches_for_review'.
-- Use Case: Admin dashboard fetching pending matches for a specific guild.
-- Security: SECURITY DEFINER, Explicit Role Check (nexus-admin), Search Path set.

BEGIN;

-- 1. Drop the existing view
DROP VIEW IF EXISTS public.admin_match_review;

-- 2. Create the secure function
CREATE OR REPLACE FUNCTION get_matches_for_review(target_guild_id text)
RETURNS TABLE (
    match_id text,
    status text,
    guild_id text,
    game_mode_name text,
    reporter_name text,
    winner_team integer,
    finished_at timestamptz,
    started_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_user_discord_id text;
    v_is_admin boolean;
BEGIN
    -- A. Get the executing user's Discord ID from their Auth UUID
    -- We assume the user is authenticated via Supabase Auth
    SELECT user_id INTO v_user_discord_id
    FROM public.players
    WHERE uuid_link = auth.uid()::text;

    IF v_user_discord_id IS NULL THEN
        RAISE EXCEPTION 'Access Denied: User account is not linked to a player profile.';
    END IF;

    -- B. Verify "nexus-admin" role for the TARGET guild
    -- The user must be a member of the guild AND have the 'nexus-admin' role.
    SELECT EXISTS (
        SELECT 1 
        FROM public.server_members sm
        WHERE sm.guild_id = target_guild_id
        AND sm.user_id = v_user_discord_id
        AND sm.role = 'nexus-admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Access Denied: You do not have nexus-admin privileges for this guild.';
    END IF;

    -- C. Return the Match Data
    -- Matches pending approval for this guild
    RETURN QUERY
    SELECT 
        m.id::text AS match_id,
        m.status,
        m.guild_id,
        gm.name AS game_mode_name,
        p.username AS reporter_name,
        m.winner_team,
        m.finished_at,
        m.started_at
    FROM public.matches m
    LEFT JOIN public.game_modes gm ON m.game_mode_id = gm.id
    -- Joining on user_id (Discord ID) as per new standard
    LEFT JOIN public.players p ON m.mvp_user_id = p.user_id 
    WHERE m.guild_id = target_guild_id
    AND m.status = 'pending_approval'
    ORDER BY m.finished_at DESC;

END;
$$;

-- 3. Set Permissions
-- Revoke from everyone by default
REVOKE EXECUTE ON FUNCTION get_matches_for_review(text) FROM public;
REVOKE EXECUTE ON FUNCTION get_matches_for_review(text) FROM anon;
REVOKE EXECUTE ON FUNCTION get_matches_for_review(text) FROM authenticated;

-- Grant to Service Role (always safe)
GRANT EXECUTE ON FUNCTION get_matches_for_review(text) TO service_role;

-- Grant to Authenticated Users
-- We GRANT to authenticated so they can CALL the function via RPC.
-- The Security is enforced INSIDE the function (Step B).
GRANT EXECUTE ON FUNCTION get_matches_for_review(text) TO authenticated;

COMMIT;
