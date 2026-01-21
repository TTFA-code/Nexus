-- Seed Game Modes
-- Standardizes modes for eFootball, EAFC, Rocket League, Football Manager, etc.

DO \$\$
DECLARE
    v_efootball_id uuid;
    v_eafc_id uuid;
    v_rl_id uuid;
    v_fm_id uuid;
    v_efootball_mobile_id uuid;
BEGIN
    -- 1. Lookup Game IDs (Adjust slugs if yours differ, e.g. 'rocket-league' vs 'rocket_league')
    -- Using ILIKE for flexibility
    SELECT id INTO v_efootball_id FROM public.games WHERE slug ILIKE 'efootball%' AND slug NOT ILIKE '%mobile%' LIMIT 1;
    SELECT id INTO v_eafc_id FROM public.games WHERE slug ILIKE 'eafc%' LIMIT 1;
    SELECT id INTO v_rl_id FROM public.games WHERE slug ILIKE 'rocket%' LIMIT 1;
    SELECT id INTO v_fm_id FROM public.games WHERE slug ILIKE 'football-manager%' OR slug ILIKE 'fm%' LIMIT 1;
    SELECT id INTO v_efootball_mobile_id FROM public.games WHERE slug ILIKE 'efootball-mobile%' LIMIT 1;

    -- 2. Insert eFootball Modes
    IF v_efootball_id IS NOT NULL THEN
        INSERT INTO public.game_modes (guild_id, game_id, name, team_size)
        VALUES 
            (NULL, v_efootball_id, '1v1 Competitive', 1),
            (NULL, v_efootball_id, '2v2 Co-op', 2)
        ON CONFLICT DO NOTHING; -- Avoid duplicates if running multiple times
    ELSE
        RAISE NOTICE 'Game eFootball not found, skipping modes.';
    END IF;

    -- 3. Insert EAFC Modes
    IF v_eafc_id IS NOT NULL THEN
        INSERT INTO public.game_modes (guild_id, game_id, name, team_size)
        VALUES 
            (NULL, v_eafc_id, '1v1 Competitive', 1),
            (NULL, v_eafc_id, '2v2 Co-op', 2)
        ON CONFLICT DO NOTHING;
    ELSE
        RAISE NOTICE 'Game EAFC not found, skipping modes.';
    END IF;

    -- 4. Insert Rocket League Modes
    IF v_rl_id IS NOT NULL THEN
        INSERT INTO public.game_modes (guild_id, game_id, name, team_size)
        VALUES 
            (NULL, v_rl_id, '1v1 Duel', 1),
            (NULL, v_rl_id, '2v2 Doubles', 2),
            (NULL, v_rl_id, '3v3 Standard', 3)
        ON CONFLICT DO NOTHING;
    ELSE
         RAISE NOTICE 'Game Rocket League not found, skipping modes.';
    END IF;

    -- 5. Insert Football Manager Modes
    IF v_fm_id IS NOT NULL THEN
        INSERT INTO public.game_modes (guild_id, game_id, name, team_size)
        VALUES 
            (NULL, v_fm_id, '1v1 Draft', 1)
        ON CONFLICT DO NOTHING;
    ELSE
        RAISE NOTICE 'Game Football Manager not found, skipping modes.';
    END IF;

    -- 6. Insert eFootball Mobile Modes
    IF v_efootball_mobile_id IS NOT NULL THEN
        INSERT INTO public.game_modes (guild_id, game_id, name, team_size)
        VALUES 
            (NULL, v_efootball_mobile_id, 'Mobile 1v1', 1)
        ON CONFLICT DO NOTHING;
    ELSE
        RAISE NOTICE 'Game eFootball Mobile not found, skipping modes.';
    END IF;

END;
\$\$;
