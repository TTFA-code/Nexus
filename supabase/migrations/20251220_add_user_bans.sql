-- Add is_banned column to players table
-- Note: User requested 'profiles' but codebase uses 'players' for user data.
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
