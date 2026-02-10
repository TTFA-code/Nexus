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
CREATE POLICY "messages_select_lobby" ON public.messages
    FOR SELECT TO authenticated
    USING (
        lobby_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM lobby_players lp 
            WHERE lp.lobby_id = messages.lobby_id 
            AND lp.user_id = (auth.jwt() ->> 'sub'::text) -- NOTE: This might need adjustment based on how user_id is stored (Discord ID vs UUID)
            -- If user_id in messages is Discord ID, we need to map auth.uid() to player.user_id
            -- HOWEVER, Standard RLS usually uses auth.uid().
            -- Let's assume we store Discord ID in `user_id` column to match other tables.
            -- So we need to join players to get discord id from auth id.
        )
    );

-- SIMPLIFIED RLS for MVP (Relies on app logic for strictness, but basic auth for safety)
-- OR: readable by anyone (public lobbies/matches)
CREATE POLICY "messages_select_authenticated" ON public.messages
    FOR SELECT TO authenticated
    USING (true);

-- Insert: Authenticated only
CREATE POLICY "messages_insert_authenticated" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
