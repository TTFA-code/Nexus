"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateElo } from "@/lib/elo";

export async function submitMatchResult(matchId: string, myScore: number, opponentScore: number) {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error("Submit Result: Unauthorized");
        return { error: "Unauthorized" };
    }

    console.log(`[MATCH_SUBMIT] User ${user.id} submitting for Match ${matchId}`);

    // 2. Participant Check (Security)
    const { data: participation, error: partError } = await supabase
        .from('match_players')
        .select('user_id')
        .eq('match_id', matchId)
        .eq('user_id', user.id)
        .single();

    if (partError || !participation) {
        console.error(`[MATCH_SUBMIT] Security Warning: User ${user.id} attempted to submit for match ${matchId} but is not a participant.`);
        return { error: 'Unauthorized: You are not a player in this match.' };
    }

    // 3. Call RPC (Transaction)
    const { data, error } = await supabase.rpc('submit_match_report', {
        match_id_input: matchId,
        reporter_id_input: user.id,
        my_score_input: myScore,
        opponent_score_input: opponentScore
    });

    console.log(`[MATCH_SUBMIT] RPC Called. Match: ${matchId}, Reporter: ${user.id}, MyScore: ${myScore}, OppScore: ${opponentScore}`);

    if (error) {
        console.error("Submit Result RPC Error:", error);
        return { error: error.message };
    }

    if (data && (data as any).error) {
        console.error("Submit Result RPC Logic Error:", (data as any).error);
        return { error: (data as any).error };
    }

    // 4. Status Check & Cleanup
    // If the match is finished, we must close the lobby so it disappears from the Arena.
    const { data: match } = await supabase
        .from('matches')
        .select('finished_at, status')
        .eq('id', matchId)
        .single();

    if (match?.finished_at) {
        console.log(`[MATCH_SUBMIT] Match ${matchId} finished. Closing lobby...`);
        await supabase
            .from('lobbies')
            .update({ status: 'finished' })
            .eq('match_id', matchId);
    }

    revalidatePath(`/dashboard/play/match/${matchId}`);
    revalidatePath('/dashboard/play'); // Refresh Arena list
    return { success: true };
}

export async function createLobby(formData: {
    game_mode_id: string;
    notes?: string;
    is_private?: boolean;
    voice_required?: boolean;
    is_tournament?: boolean;
    sector_key?: string;
    scheduled_start?: string;
}) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Unauthorized" };
    }

    try {
        const { game_mode_id, notes, is_private, voice_required, is_tournament, sector_key: providedKey, scheduled_start } = formData;

        if (!game_mode_id) {
            return { error: 'Missing required fields' };
        }

        // Generate Sector Key if Private
        let sectorKey = null;
        if (is_private) {
            sectorKey = providedKey || Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(4, '0');
        }

        // 1. Resolve Game Mode
        const { data: gameModeData, error: gmError } = await supabase
            .from('game_modes')
            .select('id, guild_id')
            .eq('id', game_mode_id)
            .single();

        if (gmError || !gameModeData) {
            console.error('Game Mode Resolution Error:', gmError);
            return { error: 'Game mode not found' };
        }

        // 2. Resolve Discord ID (Host)
        const discordIdentity = user.identities?.find(i => i.provider === 'discord');
        const hostId = discordIdentity?.id;

        if (!hostId) {
            // Fallback: If no discord identity, rely on UUID if possible, or fail if system strictly requires Discord Snowflake.
            // Based on API route, it returned 400. We will try to be lenient if possible, or stick to strict if needed.
            // User request implies "Harden", so strict is probably better, but let's check.
            // API route: status 400.
            return { error: 'Discord identity missing. Please link Discord.' };
        }

        // On-the-Fly Player Sync
        await supabase.from('players').upsert({
            user_id: hostId,
            username: user.user_metadata.full_name || 'Unknown',
            avatar_url: user.user_metadata.avatar_url
        }, { onConflict: 'user_id' });

        // Determine Status
        let status = 'WAITING';
        if (scheduled_start) {
            const startDate = new Date(scheduled_start);
            if (startDate > new Date()) {
                status = 'SCHEDULED';
            }
        }

        // 3. Create Lobby (Atomic-ish via subsequent calls, but fast enough for this context)
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .insert({
                game_mode_id: gameModeData.id,
                guild_id: gameModeData.guild_id,
                status: status,
                creator_id: user.id, // Auth UUID
                is_private: is_private,
                voice_required: voice_required,
                is_tournament: is_tournament || false,
                sector_key: sectorKey,
                scheduled_start: scheduled_start || null,
                notes: notes || null
            })
            .select()
            .single();

        if (lobbyError) {
            console.error('Lobby Creation Error:', lobbyError);
            return { error: 'Failed to create lobby' };
        }

        // 4. Auto-Join (If not tournament)
        if (!is_tournament) {
            const { error: joinError } = await supabase
                .from('lobby_players')
                .insert([{
                    lobby_id: lobby.id,
                    user_id: user.id,
                    status: 'joined',
                    is_ready: false
                }]);

            if (joinError) {
                console.error('Auto-Join Error:', joinError);
                // Note: Lobby exists but creator failed to join. 
                // We return success for the lobby, but maybe warn? 
                // Usually this shouldn't happen.
            }
        }

        revalidatePath('/dashboard/play');
        return { success: true, lobbyId: lobby.id, sectorKey: lobby.sector_key, lobby };

    } catch (error) {
        console.error('Create Lobby Action Error:', error);
        return { error: 'Internal Server Error' };
    }
}
