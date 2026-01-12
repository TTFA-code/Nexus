-- Create a view to safely expose Discord IDs linked to UUIDs
CREATE OR REPLACE VIEW public.v_discord_sync AS
SELECT 
    u.id as user_id,
    i.provider_id as discord_id,
    i.email
FROM auth.users u
JOIN auth.identities i ON u.id = i.user_id
WHERE i.provider = 'discord';

GRANT SELECT ON public.v_discord_sync TO service_role;
GRANT SELECT ON public.v_discord_sync TO postgres;
GRANT SELECT ON public.v_discord_sync TO anon;
GRANT SELECT ON public.v_discord_sync TO authenticated;
