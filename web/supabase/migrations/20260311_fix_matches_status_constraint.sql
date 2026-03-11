-- Fix matches status constraint to allow 'disputed'
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check
CHECK (status = ANY (ARRAY[
    'active'::text, 
    'finished'::text, 
    'ongoing'::text, 
    'started'::text, 
    'pending'::text, 
    'pending_approval'::text, 
    'disputed'::text
]));
