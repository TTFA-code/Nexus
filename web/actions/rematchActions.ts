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

        // 1. Record the vote in match_players
        const { error: updateError } = await supabase
            .from('match_players')
            .update({ rematch_status: vote })
            .eq('match_id', matchId)
            .eq('user_id', discordId)

        if (updateError) throw new Error('Failed to submit rematch vote.')

        // Broadcast the individual vote so UI can update (e.g., "Player X is ready")
        await supabase.channel(`match:${matchId}`).send({
            type: 'broadcast',
            event: 'rematch_vote_cast',
            payload: {
                userId: discordId,
                vote: vote
            }
        })

        // 2. Check if all players have voted
        const { data: players, error: playersError } = await supabase
            .from('match_players')
            .select('user_id, team, rematch_status')
            .eq('match_id', matchId)

        if (playersError || !players) throw new Error('Failed to fetch match players.')

        const pendingPlayers = players.filter(p => p.rematch_status === 'pending' || !p.rematch_status)

        // If there are still pending players, we just return
        if (pendingPlayers.length > 0) {
            return { success: true, isResolved: false, message: 'Vote recorded.' }
        }

        // 3. All players have voted. Resolve the rematch.
        const acceptedPlayers = players.filter(p => p.rematch_status === 'accepted')

        // If less than 2 players want to rematch, the rematch fails
        if (acceptedPlayers.length < 2) {
            // Broadcast failure
            await supabase.channel(`match:${matchId}`).send({
                type: 'broadcast',
                event: 'rematch_resolved',
                payload: {
                    success: false,
                    message: 'Not enough players requested a rematch.',
                    newLobbyId: null
                }
            })
            return { success: true, isResolved: true, message: 'Rematch cancelled - not enough players.' }
        }

        // 4. Create a new LOBBY for the players who accepted
        const { data: oldMatch } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single()

        if (!oldMatch) throw new Error('Original match data lost.')

        const { data: newLobby, error: createLobbyError } = await supabase
            .from('lobbies')
            .insert({
                creator_id: acceptedPlayers[0].user_id, // First accepted player is host
                game_mode_id: oldMatch.game_mode_id,
                region: oldMatch.region,
                guild_id: oldMatch.guild_id,
                status: 'open',
                is_private: false
            })
            .select('id')
            .single()

        if (createLobbyError || !newLobby) throw new Error('Failed to create new lobby for rematch players.')

        // 5. Migrate accepted players to the new lobby
        const newLobbyPlayers = acceptedPlayers.map(p => ({
            lobby_id: newLobby.id,
            user_id: p.user_id,
            status: 'joined',
            team: p.team // Maintain their old team if possible
        }))

        const { error: migrationError } = await supabase
            .from('lobby_players')
            .insert(newLobbyPlayers)

        if (migrationError) throw new Error('Failed to migrate players to new lobby.')

        // 6. Broadcast successful resolution
        await supabase.channel(`match:${matchId}`).send({
            type: 'broadcast',
            event: 'rematch_resolved',
            payload: {
                success: true,
                newLobbyId: newLobby.id,
                acceptedUserIds: acceptedPlayers.map(p => p.user_id)
            }
        })

        return {
            success: true,
            isResolved: true,
            newLobbyId: newLobby.id
        }

    } catch (e: any) {
        console.error("Submit Rematch Vote Error:", e)
        return { success: false, message: e.message }
    }
}
