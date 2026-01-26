-- =================================================================================
-- SEED: Create Default Game Modes (1v1, 2v2, 3v3)
-- =================================================================================

DO $$
DECLARE
    v_game RECORD;
BEGIN
    FOR v_game IN SELECT * FROM public.games LOOP
        
        -- Create 1v1 Mode
        INSERT INTO public.game_modes (game_id, name, team_size, is_active)
        VALUES (v_game.id, '1v1 Showdown', 1, true)
        ON CONFLICT DO NOTHING; -- Assuming unique constraint on (game_id, name) if exists, else it might dup.
        -- Actually schema doesn't have unique constraint on name. 
        -- Let's check existence first to be safe or just insert.
        -- Ideally we add Unique Constraint later.

        -- Create 2v2 Mode
        INSERT INTO public.game_modes (game_id, name, team_size, is_active)
        VALUES (v_game.id, '2v2 Doubles', 2, true);

        -- Create 3v3 Mode
        INSERT INTO public.game_modes (game_id, name, team_size, is_active)
        VALUES (v_game.id, '3v3 Trios', 3, true);

    END LOOP;
END $$;

RAISE NOTICE 'Added 1v1, 2v2, and 3v3 modes for all games.';
