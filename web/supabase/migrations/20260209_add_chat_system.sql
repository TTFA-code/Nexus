-- Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lobby_id uuid REFERENCES public.lobbies(id) ON DELETE CASCADE,
    match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
    user_id text NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT messages_context_check CHECK (
        (lobby_id IS NOT NULL AND match_id IS NULL) OR 
        (lobby_id IS NULL AND match_id IS NOT NULL)
    )
);

-- RLS Policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Select: Allow if user is participant
-- Helper function to check participation (Bypasses RLS on lookups)
CREATE OR REPLACE FUNCTION public.is_chat_participant(
    _lobby_id uuid,
    _match_id uuid,
    _user_uuid uuid
) RETURNS boolean AS $$
BEGIN
    -- Explicitly cast uuid_link to text to match _user_uuid::text comparison safely
    IF _lobby_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM lobby_players lp
            JOIN players p ON p.user_id = lp.user_id
            WHERE lp.lobby_id = _lobby_id
            AND p.uuid_link::text = _user_uuid::text
        );
    ELSIF _match_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM match_players mp
            JOIN players p ON p.user_id = mp.user_id
            WHERE mp.match_id = _match_id
            AND p.uuid_link::text = _user_uuid::text
        );
    END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Explicitly Grant Permissions (Fixes possible 403 due to missing usage)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_chat_participant TO authenticated;

-- Select: Allow if user is participant
-- Drop existing policies to allow re-runs
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;

CREATE POLICY "messages_select" ON public.messages
    FOR SELECT TO authenticated
    USING (
        public.is_chat_participant(lobby_id, match_id, auth.uid())
    );

-- Insert: Allow if user is participant
CREATE POLICY "messages_insert" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_chat_participant(lobby_id, match_id, auth.uid())
    );

-- Enable Realtime (Idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
