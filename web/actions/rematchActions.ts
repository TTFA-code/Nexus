'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionResponse = {
    success: boolean
    message?: string
}

export async function submitRematchVote(matchId: string, vote: 'accepted' | 'declined'): Promise<ActionResponse & { newLobbyId?: string, newMatchId?: string, destination?: 'match' | 'lobby', isResolved?: boolean }> {
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

            // Check if there is already a formed lobby or match for this rematch
            const { data: existingLobby } = await adminSupabase
                .from('lobbies')
                .select('id')
                .eq('notes', `rematch:${matchId}`)
                .maybeSingle();

            const { data: existingMatch } = await adminSupabase
                .from('matches')
                .select('id')
                .eq('metadata->source_rematch_id', matchId)
                .maybeSingle();

            if (existingMatch) {
                // Return immediate match join
                return { success: true, isResolved: true, destination: 'match', newMatchId: existingMatch.id };
            } else if (existingLobby) {
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

                return { success: true, isResolved: true, destination: 'lobby', newLobbyId: existingLobby.id };
            } else {
                // Check if we reached 2 acceptances
                const acceptedPlayers = players.filter(p => p.rematch_status === 'accepted');
                if (acceptedPlayers.length >= 2) {

                    const { data: oldMatch } = await adminSupabase
                        .from('matches')
                        .select('*')
                        .eq('id', matchId)
                        .single();

                    if (!oldMatch) throw new Error('Original match data lost.')

                    // FULL REMATCH: All players from the previous match have accepted
                    if (acceptedPlayers.length === players.length) {

                        // 1. Create the Match directly
                        const { data: newMatch, error: matchErr } = await adminSupabase
                            .from('matches')
                            .insert({
                                guild_id: oldMatch.guild_id,
                                game_mode_id: oldMatch.game_mode_id,
                                region: oldMatch.region,
                                status: 'active',
                                creator_id: acceptedPlayers[0].user_id,
                                metadata: { source_rematch_id: matchId }
                            })
                            .select('id')
                            .single();

                        if (matchErr || !newMatch) throw new Error('Failed to create direct match.');

                        // 2. Insert all players keeping original teams
                        const newMatchPlayers = acceptedPlayers.map(p => ({
                            match_id: newMatch.id,
                            user_id: p.user_id,
                            team: p.team || 1,
                            rematch_status: 'pending' // reset for the new match
                        }));

                        await adminSupabase.from('match_players').insert(newMatchPlayers);

                        // 3. Broadcast Resolution
                        await adminSupabase.channel(`match:${matchId}`).send({
                            type: 'broadcast',
                            event: 'rematch_resolved',
                            payload: {
                                success: true,
                                destination: 'match',
                                newMatchId: newMatch.id,
                                acceptedUserIds: acceptedPlayers.map(p => p.user_id)
                            }
                        });

                        return { success: true, isResolved: true, destination: 'match', newMatchId: newMatch.id };

                    } else {
                        // PARTIAL REMATCH: Only some players accepted (e.g. 2 out of 4)

                        // 1. Form the lobby!
                        const { data: newLobby, error: createLobbyError } = await adminSupabase
                            .from('lobbies')
                            .insert({
                                creator_id: acceptedPlayers[0].user_id!, // First accepted player is host
                                game_mode_id: oldMatch.game_mode_id,
                                region: oldMatch.region,
                                guild_id: oldMatch.guild_id,
                                status: 'WAITING',
                                is_private: false,
                                notes: `rematch:${matchId}`
                            })
                            .select('id')
                            .single();

                        if (createLobbyError || !newLobby) throw new Error(`Failed to create new lobby for rematch players: ${createLobbyError.message}`);

                        // 2. Join the accepted players
                        // (Creator is auto-joined by trigger. Manually join other accepted players.)
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

                        // 3. Broadcast Resolution
                        await adminSupabase.channel(`match:${matchId}`).send({
                            type: 'broadcast',
                            event: 'rematch_resolved',
                            payload: {
                                success: true,
                                destination: 'lobby',
                                newLobbyId: newLobby.id,
                                acceptedUserIds: acceptedPlayers.map(p => p.user_id)
                            }
                        });

                        return { success: true, isResolved: true, destination: 'lobby', newLobbyId: newLobby.id };
                    }
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
