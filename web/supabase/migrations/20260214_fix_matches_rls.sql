-- Fix RLS for Matches and Match Players
-- Using the security definer function is_chat_participant to avoid recursion and handle uuid/text casting

-- 1. Enable RLS (Idempotent)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "matches_select" ON public.matches;
DROP POLICY IF EXISTS "match_players_select" ON public.match_players;
DROP POLICY IF EXISTS "matches_insert" ON public.matches; -- Usually only server inserts, but good to clean
DROP POLICY IF EXISTS "matches_update" ON public.matches;

-- 3. Create SELECT Policies
-- Allow user to see a match if they are a participant
CREATE POLICY "matches_select" ON public.matches
FOR SELECT TO authenticated
USING (
    public.is_chat_participant(null, id, auth.uid())
);

-- Allow user to see match_players if they are in that match
CREATE POLICY "match_players_select" ON public.match_players
FOR SELECT TO authenticated
USING (
    public.is_chat_participant(null, match_id, auth.uid())
);

-- 4. Grant Permissions (Just in case they are missing)
GRANT SELECT ON public.matches TO authenticated;
GRANT SELECT ON public.match_players TO authenticated;
