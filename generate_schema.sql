-- Run this in the Supabase SQL Editor to generate CREATE TABLE statements
-- Note: This is a basic generator and might need manual tweaking for complex constraints/types.

SELECT 'CREATE TABLE ' || table_name || ' (' || string_agg(column_def, ', ') || ');' as create_statement
FROM (
    SELECT 
        table_name,
        column_name || ' ' || data_type || 
        (CASE WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')' ELSE '' END) ||
        (CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END) ||
        (CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END) as column_def
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY ordinal_position
) as columns
GROUP BY table_name;

-- Standard foreign keys generator
SELECT 'ALTER TABLE ' || kcu.table_name || ' ADD CONSTRAINT ' || kcu.constraint_name || 
       ' FOREIGN KEY (' || kcu.column_name || ') REFERENCES ' || ccu.table_name || ' (' || ccu.column_name || ');'
FROM information_schema.key_column_usage kcu
JOIN information_schema.constraint_column_usage ccu ON kcu.constraint_name = ccu.constraint_name
JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
