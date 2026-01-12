-- Add reason to guild_bans
ALTER TABLE public.guild_bans ADD COLUMN IF NOT EXISTS reason TEXT;

-- Create report status enum
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL REFERENCES public.clubs(guild_id) ON DELETE CASCADE,
    reporter_id VARCHAR(20) NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
    reported_id VARCHAR(20) NOT NULL REFERENCES public.players(user_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policies
-- Authenticated users can create reports
CREATE POLICY "Allow authenticated insert" ON public.reports
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Authenticated users (admins ideally) can view reports
-- For now, allowing authenticated read to simplify. Real permissions would be tighter.
CREATE POLICY "Allow authenticated read" ON public.reports
    FOR SELECT TO authenticated
    USING (true);

-- Allow updates (resolving/dismissing)
CREATE POLICY "Allow authenticated update" ON public.reports
    FOR UPDATE TO authenticated
    USING (true);
