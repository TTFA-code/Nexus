-- Enable RLS on lobbies table
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to create a lobby
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON lobbies;

CREATE POLICY "Enable insert for authenticated users only"
ON lobbies FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to see all lobbies (needed for the dashboard)
DROP POLICY IF EXISTS "Enable read access for all users" ON lobbies;

CREATE POLICY "Enable read access for all users"
ON lobbies FOR SELECT
TO authenticated
USING (true);

-- Allow creator to update their own lobby
DROP POLICY IF EXISTS "Enable update for creators" ON lobbies;

CREATE POLICY "Enable update for creators"
ON lobbies FOR UPDATE
TO authenticated
USING (auth.uid()::text = creator_id)
WITH CHECK (auth.uid()::text = creator_id);

-- Allow creator to delete their own lobby
DROP POLICY IF EXISTS "Enable delete for creators" ON lobbies;

CREATE POLICY "Enable delete for creators"
ON lobbies FOR DELETE
TO authenticated
USING (auth.uid()::text = creator_id);
