-- Test is_chat_participant Function Logic

WITH vars AS (
    SELECT 
        'c34d1347-9858-4179-84d5-8577fdd941b4'::uuid as v_user_uuid,
        '37cc6f13-9bbe-4763-b513-09b2b645fc1d'::uuid as v_match_id
)
SELECT 
    public.is_chat_participant(NULL, v.v_match_id, v.v_user_uuid) as is_participant,
    v.v_match_id,
    v.v_user_uuid
FROM vars v;
