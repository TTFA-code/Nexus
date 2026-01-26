-- =================================================================================
-- FIX: Matchmaking Queue RLS
-- =================================================================================

-- Ensure RLS is enabled
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts (clean slate for this table)
DROP POLICY IF EXISTS "queue_select_own" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "queue_insert_own" ON public.matchmaking_queue;
DROP POLICY IF EXISTS "queue_delete_own" ON public.matchmaking_queue;

-- 1. SELECT: Users can see their own queue entry (essential for "Already searching" check)
CREATE POLICY "queue_select_own"
ON public.matchmaking_queue
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. INSERT: Users can join queue (via RPC mainly, but if direct insert is used)
-- Note: RPC `join_queue` uses `SECURITY DEFINER` so it bypasses RLS, but for read we need policy.
CREATE POLICY "queue_insert_own"
ON public.matchmaking_queue
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. DELETE: Users can leave queue
CREATE POLICY "queue_delete_own"
ON public.matchmaking_queue
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. SERVICE ROLE: Full Access
CREATE POLICY "queue_service_full"
ON public.matchmaking_queue
FOR ALL
TO service_role
USING (true);
