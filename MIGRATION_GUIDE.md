# Manual Data Migration Guide

## 1. Schema Migration (SQL Editor)
Since connection is refused, use the `generate_schema.sql` file content in your OLD project's SQL Editor to get the table definitions. Copy the output and run it in the NEW project's SQL Editor.

## 2. API-Based Migration (Recommended)
Use the `migrate_data.js` script.
1.  Open the file and update `NEW_SERVICE_KEY` with your new project's service role key.
2.  Run `npm install @supabase/supabase-js dotenv`.
3.  Run `node migrate_data.js`.
4.  **Benefits**: Preserves User UUIDs (critical) and handles JSON data better than CSV.

## 3. Manual CSV Migration (via seed.sql)
If you prefer CSVs:
1.  Download CSVs from the Supabase Dashboard (Table Editor -> "Extract as CSV").
2.  `seed.sql` DOES NOT strictly import CSV files path-wise. It runs SQL.
3.  **Procedure**:
    *   Place CSVs in `supabase/seeds/`.
    *   You must convert CSV rows to SQL `INSERT` statements.
    *   **Pro Tip**: Use a tool or online converter to turn CSV into INSERT statements, then paste those into `supabase/seed.sql`.
    *   Example `seed.sql` format:
    ```sql
    INSERT INTO public.lobbies (id, name, created_at) VALUES 
    ('uuid-1', 'Lobby A', '2024-01-01'),
    ('uuid-2', 'Lobby B', '2024-01-02');
    ```
4.  Run `npx supabase db reset` to apply seeds (Warning: This resets the local DB).

## 4. Verifying Foreign Keys
*   The `migrate_data.js` script migrates tables in a specific order:
    1.  `auth.users` (Must exist first!)
    2.  `guilds`
    3.  `lobbies` (Refers to users and guilds)
    4.  `matches` (Refers to lobbies)
*   If a Foreign Key check fails, the API will return an error explicitly stating `insert or update on table "x" violates foreign key constraint`.
