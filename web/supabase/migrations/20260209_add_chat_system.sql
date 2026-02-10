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
-- Drop existing policies to allow re-runs
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;

-- Select: Allow if user is participant (Lobby or Match)
CREATE POLICY "messages_select" ON public.messages
    FOR SELECT TO authenticated
    USING (
        (lobby_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM lobby_players lp
            JOIN players p ON p.user_id = lp.user_id
            WHERE lp.lobby_id = messages.lobby_id
            AND p.uuid_link = auth.uid()::text
        ))
        OR
        (match_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM match_players mp
            JOIN players p ON p.user_id = mp.user_id
            WHERE mp.match_id = messages.match_id
            AND p.uuid_link = auth.uid()::text
        ))
    );

-- Insert: Allow if user is participant (Lobby or Match)
CREATE POLICY "messages_insert" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        (lobby_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM lobby_players lp
            JOIN players p ON p.user_id = lp.user_id
            WHERE lp.lobby_id = messages.lobby_id
            AND p.uuid_link = auth.uid()::text
        ))
        OR
        (match_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM match_players mp
            JOIN players p ON p.user_id = mp.user_id
            WHERE mp.match_id = messages.match_id
            AND p.uuid_link = auth.uid()::text
        ))
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
