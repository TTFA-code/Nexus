-- Enable RLS on mmr_history
ALTER TABLE public.mmr_history ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own history
CREATE POLICY "view_own_mmr_history" ON public.mmr_history
    FOR SELECT TO authenticated
    USING (auth.uid() = player_uuid);

-- Grant access
GRANT SELECT ON public.mmr_history TO authenticated;
GRANT SELECT ON public.mmr_history TO service_role;
