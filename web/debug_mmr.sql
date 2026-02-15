-- Check structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mmr_history';

-- Check sample data
SELECT * FROM mmr_history ORDER BY created_at DESC LIMIT 10;

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'mmr_history';
