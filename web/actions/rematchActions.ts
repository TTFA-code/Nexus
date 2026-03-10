'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionResponse = {
    success: boolean
    message?: string
}

// New Rematch Logic for 2v2/Multiplayer

export async function submitRematchVote(matchId: string, vote: 'accepted' | 'declined'): Promise<ActionResponse & { newLobbyId?: string, isResolved?: boolean }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error('Unauthorized')

        const discordIdentity = user.identities?.find(i => i.provider === 'discord')
        const discordId = discordIdentity?.id
        if (!discordId) throw new Error('No Discord Link')

        // Fetch Admin Client to bypass RLS for match_players update
        const { getAdminClient } = await import('@/utils/supabase/admin');
        const adminSupabase = getAdminClient();
        if (!adminSupabase) throw new Error('System configuration error: Admin client not available');

        // 1. Record the vote in match_players using Admin client
        const { error: updateError } = await adminSupabase
            .from('match_players')
            .update({ rematch_status: vote })
            .eq('match_id', matchId)
            .eq('user_id', discordId)

        if (updateError) throw new Error('Failed to submit rematch vote.')

        // 2. Broadcast the individual vote so UI can update
        await adminSupabase.channel(`match:${matchId}`).send({
            type: 'broadcast',
            event: 'rematch_vote_cast',
            payload: {
                userId: discordId,
                vote: vote
            }
        })

        // 3. Fetch all players using Admin client
        const { data: players, error: playersError } = await adminSupabase
            .from('match_players')
            .select(`
                user_id, 
                team, 
                rematch_status, 
                player:players!match_players_user_id_fkey(username, avatar_url, uuid_link)
            `)
            .eq('match_id', matchId)

        if (playersError || !players) throw new Error('Failed to fetch match players.')

        if (vote === 'accepted') {
            const currentUser = players.find(p => p.user_id === discordId);
            const pendingPlayers = players.filter(p => p.rematch_status === 'pending' || !p.rematch_status);

            // Broadcast to pending players to show the global popup
            for (const p of pendingPlayers) {
                const pUuid = (p.player as any)?.uuid_link;
                if (pUuid) {
                    await adminSupabase.channel(`user:${pUuid}:requests`).send({
                        type: 'broadcast',
                        event: 'rematch_request',
                        payload: {
                            requesterId: discordId,
                            requesterName: (currentUser?.player as any)?.username || 'Opponent',
                            requesterAvatar: (currentUser?.player as any)?.avatar_url,
                            matchId: matchId
                        }
                    });
                }
            }

            // Check if there is already a formed lobby for this match
            const { data: existingLobby } = await adminSupabase
                .from('lobbies')
                .select('id')
                .eq('notes', `rematch:${matchId}`)
                .maybeSingle();

            if (existingLobby) {
                // Lobby already formed! Join it using Admin client
                await adminSupabase
                    .from('lobby_players')
                    .insert({
                        lobby_id: existingLobby.id,
                        user_id: discordId,
                        status: 'joined',
                        is_ready: false,
                        team: currentUser?.team || 1
                    });

                return { success: true, isResolved: true, newLobbyId: existingLobby.id };
            } else {
                // Check if we reached 2 acceptances
                const acceptedPlayers = players.filter(p => p.rematch_status === 'accepted');
                if (acceptedPlayers.length >= 2) {
                    // Form the lobby!
                    const { data: oldMatch } = await adminSupabase
                        .from('matches')
                        .select('*')
                        .eq('id', matchId)
                        .single();

                    if (!oldMatch) throw new Error('Original match data lost.')

                    const { data: newLobby, error: createLobbyError } = await adminSupabase
                        .from('lobbies')
                        .insert({
                            creator_id: acceptedPlayers[0].user_id!, // First accepted player is host
                            game_mode_id: oldMatch.game_mode_id,
                            region: oldMatch.region,
                            guild_id: oldMatch.guild_id,
                            status: 'open',
                            is_private: false,
                            notes: `rematch:${matchId}`
                        })
                        .select('id')
                        .single();

                    if (createLobbyError || !newLobby) throw new Error(`Failed to create new lobby for rematch players: ${createLobbyError.message}`);

                    // Creator is auto-joined by trigger. Manually join other accepted players.
                    const otherAcceptedPlayers = acceptedPlayers.filter(p => p.user_id !== acceptedPlayers[0].user_id);
                    if (otherAcceptedPlayers.length > 0) {
                        const newLobbyPlayers = otherAcceptedPlayers.map(p => ({
                            lobby_id: newLobby.id,
                            user_id: p.user_id,
                            status: 'joined',
                            is_ready: false,
                            team: p.team || 1
                        }));
                        await adminSupabase.from('lobby_players').insert(newLobbyPlayers);
                    }

                    // Tell everyone currently on the match page that the lobby is formed
                    await adminSupabase.channel(`match:${matchId}`).send({
                        type: 'broadcast',
                        event: 'rematch_resolved',
                        payload: {
                            success: true,
                            newLobbyId: newLobby.id,
                            acceptedUserIds: acceptedPlayers.map(p => p.user_id)
                        }
                    });

                    return { success: true, isResolved: true, newLobbyId: newLobby.id };
                }
            }
        } else {
            // Vote is declined
            const pendingPlayers = players.filter(p => p.rematch_status === 'pending' || !p.rematch_status);
            const acceptedPlayers = players.filter(p => p.rematch_status === 'accepted');

            // If everyone has voted and not enough for a lobby
            if (pendingPlayers.length === 0 && acceptedPlayers.length < 2) {
                await adminSupabase.channel(`match:${matchId}`).send({
                    type: 'broadcast',
                    event: 'rematch_resolved',
                    payload: {
                        success: false,
                        message: 'Not enough players requested a rematch.',
                        newLobbyId: null
                    }
                });
            }
        }

        return { success: true, isResolved: false, message: 'Vote recorded.' };

    } catch (e: any) {
        console.error("Submit Rematch Vote Error:", e)
        return { success: false, message: e.message }
    }
}
