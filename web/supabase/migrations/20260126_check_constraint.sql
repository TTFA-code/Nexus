-- =================================================================================
-- DEBUG: Check Status Constraint
-- =================================================================================

SELECT pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conname = 'matches_status_check';
