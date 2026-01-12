import { createClient } from '@supabase/supabase-js'
import { BroadcasterAgent } from './BroadcasterAgent'

// Initialize Admin Client for System Actions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Fallback to anon key if service key is missing (dev mode mainly), but warn.
if (!supabaseServiceKey) {
    console.warn('MatchmakerAgent: SUPABASE_SERVICE_ROLE_KEY is missing. Using ANON key. Permissions may fail.')
}

const adminDb = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export const MatchmakerAgent = {
    /**
     * checkLobbyReadiness
     * Checks if lobby has reached capacity. If so, triggers Ready Check.
     */
    async checkLobbyReadiness(lobbyId: string) {
        console.log(`[MatchmakerAgent] Checking readiness for Lobby ${lobbyId}...`)

        // 1. Fetch Lobby & Game Mode details
        const { data: lobby, error: lobbyError } = await adminDb
            .from('lobbies')
            .select(`
        *,
        game_modes (
          team_size
        )
      `)
            .eq('id', lobbyId)
            .single()

        if (lobbyError || !lobby) {
            console.error('[MatchmakerAgent] Error fetching lobby:', lobbyError)
            return
        }

        const teamSize = lobby.game_modes?.team_size || 0
        const maxPlayers = teamSize * 2 // 5v5 = 10 players

        if (maxPlayers === 0) {
            console.warn('[MatchmakerAgent] Team size is 0, skipping.')
            return
        }

        // 2. Count Members
        const { count, error: countError, data: members } = await adminDb
            .from('lobby_players')
            .select('user_id', { count: 'exact' })
            .eq('lobby_id', lobbyId)

        if (countError) {
            console.error('[MatchmakerAgent] Error counting members:', countError)
            return
        }

        console.log(`[MatchmakerAgent] Lobby ${lobbyId}: ${count}/${maxPlayers} players.`)

        if ((count || 0) >= maxPlayers) {
            console.log(`[MatchmakerAgent] Lobby ${lobbyId} is FULL. Initiating Ready Check...`)

            // 3. Update Lobby Status
            const { error: updateError } = await adminDb
                .from('lobbies')
                .update({ status: 'READY_CHECK' })
                .eq('id', lobbyId)

            if (updateError) {
                console.error('[MatchmakerAgent] Failed to update lobby status:', updateError)
                return
            }

            // 4. Create Ready Checks for ALL members
            if (members && members.length > 0) {
                const readyChecks = members.map(m => ({
                    lobby_id: lobbyId,
                    user_id: m.user_id,
                    accepted: false
                }))

                const { error: insertError } = await adminDb
                    .from('ready_checks')
                    .insert(readyChecks)

                if (insertError) {
                    console.error('[MatchmakerAgent] Failed to create ready checks:', insertError)
                } else {
                    console.log(`[MatchmakerAgent] Created ${members.length} ready checks.`)
                }
            }
        }
    },

    /**
     * handleReadyResponse
     * Processes a user's Accept/Decline. Transitions lobby to LIVE or WAITING.
     */
    async handleReadyResponse(lobbyId: string, userId: string, accepted: boolean) {
        console.log(`[MatchmakerAgent] User ${userId} responded ${accepted ? 'ACCEPT' : 'DECLINE'} for Lobby ${lobbyId}`)

        if (!accepted) {
            // User DECLINED
            // 1. Remove user from lobby
            await adminDb.from('lobby_players').delete().eq('lobby_id', lobbyId).eq('user_id', userId)

            // 2. Reset lobby to WAITING
            await adminDb.from('lobbies').update({ status: 'WAITING' }).eq('id', lobbyId)

            // 3. Clear all ready checks
            await adminDb.from('ready_checks').delete().eq('lobby_id', lobbyId)

            console.log(`[MatchmakerAgent] Lobby ${lobbyId} reset to WAITING due to decline.`)
            return
        }

        // User ACCEPTED
        // 1. Update their ready check
        const { error: updateError } = await adminDb
            .from('ready_checks')
            .update({ accepted: true, responded_at: new Date().toISOString() })
            .eq('lobby_id', lobbyId)
            .eq('user_id', userId)

        if (updateError) {
            console.error('[MatchmakerAgent] Failed to update ready check:', updateError)
            return
        }

        // 2. Check if EVERYONE is ready
        // We need to know max players again, or just check if unaccepted count is 0
        // But better to be explicit: Count accepted rows vs total rows
        const { count: totalCount } = await adminDb
            .from('ready_checks')
            .select('*', { count: 'exact', head: true })
            .eq('lobby_id', lobbyId)

        const { count: acceptedCount } = await adminDb
            .from('ready_checks')
            .select('*', { count: 'exact', head: true })
            .eq('lobby_id', lobbyId)
            .eq('accepted', true)

        if (totalCount === acceptedCount && totalCount && totalCount > 0) {
            console.log(`[MatchmakerAgent] All ${totalCount} players are READY! Launching Lobby...`)

            // 3. Live Transition
            const { error: liveError, data: lobby } = await adminDb
                .from('lobbies')
                .update({ status: 'LIVE' })
                .eq('id', lobbyId)
                .select('*, game_modes(*, games(icon_url))')
                .single()

            if (!liveError && lobby) {
                await this.announceLobby(lobby)
            }
        }
    },

    /**
     * announceLobby
     * Mocks a Discord announcement via Broadcaster
     */
    async announceLobby(lobby: any) {
        console.log(`[MatchmakerAgent] Announcing Lobby ${lobby.id} via Broadcaster...`)
        await BroadcasterAgent.notifyMatchStart(lobby)
    }
}
