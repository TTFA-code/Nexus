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

    const discordIdentity = user.identities?.find(i => i.provider === 'discord');
    const discordId = discordIdentity?.id;

    if (!discordId) {
        return { error: 'Unauthorized: No Discord Link' };
    }

    console.log(`[MATCH_SUBMIT] User ${discordId} submitting for Match ${matchId}`);

    // 2. Participant Check (Security)
    const { data: participation, error: partError } = await supabase
        .from('match_players')
        .select('user_id')
        .eq('match_id', matchId)
        .eq('user_id', discordId) // Use Discord ID
        .single();

    if (partError || !participation) {
        console.error(`[MATCH_SUBMIT] Security Warning: User ${discordId} attempted to submit for match ${matchId} but is not a participant.`);
        return { error: 'Unauthorized: You are not a player in this match.' };
    }

    // 3. Call RPC (Transaction)
    const { data, error } = await supabase.rpc('submit_match_report', {
        p_match_id: matchId,
        p_reporter_id: discordId, // Use Discord ID
        p_my_score: myScore,
        p_opponent_score: opponentScore
    });

    console.log(`[MATCH_SUBMIT] RPC Called. Match: ${matchId}, Reporter: ${discordId}, MyScore: ${myScore}, OppScore: ${opponentScore}`);

    if (error) {
        console.error("Submit Result RPC Error:", error);
        return { error: error.message };
    }

    if (data && (data as any).error) {
        console.error("Submit Result RPC Logic Error:", (data as any).error);
        return { error: (data as any).error };
    }

    // 4. Status Check & Cleanup
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
    revalidatePath('/dashboard/play');
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

        // 3. Create Lobby (Use Discord ID for creator_id)
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .insert({
                game_mode_id: gameModeData.id,
                guild_id: gameModeData.guild_id,
                status: status,
                creator_id: hostId, // Discord ID
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

        // 4. Auto-Join (Using Discord ID)
        if (!is_tournament) {
            const { error: joinError } = await supabase
                .from('lobby_players')
                .insert([{
                    lobby_id: lobby.id,
                    user_id: hostId, // Discord ID
                    status: 'joined',
                    is_ready: false
                }]);

            if (joinError) {
                console.error('Auto-Join Error:', joinError);
            }
        }

        revalidatePath('/dashboard/play');
        return { success: true, lobbyId: lobby.id, sectorKey: lobby.sector_key, lobby };

    } catch (error) {
        console.error('Create Lobby Action Error:', error);
        return { error: 'Internal Server Error' };
    }
}
