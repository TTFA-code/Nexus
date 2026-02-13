-- =================================================================================
-- FIX: Matchmaking Queue Permissions (Definitive)
-- =================================================================================

-- 1. Explicitly Grant Permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.matchmaking_queue TO authenticated;

-- 2. Reset RLS Policies (Drop ALL to ensure no conflicts)
DROP POLICY IF EXISTS "queue_select_own" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "queue_insert_own" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "queue_delete_own" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "matchmaking_queue_select_policy" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "matchmaking_queue_insert_policy" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "matchmaking_queue_delete_policy" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "Users can view queue (for counts)" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "Users can insert their own queue entry" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "Users can delete their own queue entry" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "queue_service_full" ON public.matchmaking_queue;

-- Ensure RLS is enabled
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- 3. Create New Policies

-- SELECT: Users can see their own entry (needed for "Already searching" check)
CREATE POLICY "queue_select_own"
ON public.matchmaking_queue
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Users can join queue
CREATE POLICY "queue_insert_own"
ON public.matchmaking_queue
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can leave queue
CREATE POLICY "queue_delete_own"
ON public.matchmaking_queue
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Service Role Bypass (Just in case)
CREATE POLICY "queue_service_full"
ON public.matchmaking_queue
FOR ALL
TO service_role
USING (true);
