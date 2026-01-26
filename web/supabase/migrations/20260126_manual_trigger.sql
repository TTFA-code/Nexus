-- =================================================================================
-- MANUAL TRIGGER
-- =================================================================================

-- 1. Run Matchmaker
SELECT public.find_match() as matches_found;

-- 2. Check if Match was just created
SELECT id, status, created_at 
FROM public.matches 
ORDER BY created_at DESC 
LIMIT 1;
