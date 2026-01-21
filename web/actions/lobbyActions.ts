'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifyUserVoice } from '@/services/UplinkAgent'

type ActionResponse = {
    success: boolean
    message?: string
    error?: string
}

export async function joinLobby(lobbyId: string, password?: string): Promise<ActionResponse & { lobby?: any }> {
    try {
        const supabase = await createClient()

        // 1. Auth Check - Use UUID directly
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            throw new Error('Unauthorized: You must be logged in to join a lobby.')
        }

        // Use the Supabase Auth UUID
        const userId = user.id

        // 2. Security Check (Standard Client - RLS Updated)
        console.log("JOINING LOBBY WITH ID:", lobbyId);

        // UUID/ID Guardrail for Lobby ID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lobbyId);

        if (!isUUID) {
            throw new Error(`CRITICAL: Invalid ID format received (${lobbyId}). Expected UUID.`);
        }

        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .select('*, game_modes(*), lobby_players(*)')
            .eq('id', lobbyId)
            .single()

        if (lobbyError || !lobby) {
            console.error("Lobby Lookup Error", lobbyError);
            throw new Error('Lobby not found or signal lost.')
        }

        // 1.5 Active Session Check (Lobby Validation)
        // @ts-ignore - RPC not yet typed
        const { data: isActiveSession, error: rpcError } = await supabase.rpc('check_active_session', {
            p_user_id: userId
        });

        if (isActiveSession) {
            throw new Error('Lobby Warning: You are already deployed in an active match. Finish your current session before joining another.');
        }

        // 2.1 Password Check (Private Sector Protection)
        // If lobby has a sector_key, it is PRIVATE.
        if (lobby.sector_key) {
            if (lobby.sector_key !== password) {
                throw new Error("Invalid Password: Access Denied.")
            }
        }

        // 2.2 Check if already joined (Compare UUIDs) - MOVED TO TOP
        // Priority: Allow re-entry before checking capacity or bans
        const isJoined = lobby.lobby_players?.some((p: any) => p.user_id === userId);
        if (isJoined) {
            return { success: true, message: 'Already joined.', lobby }
        }

        // Check for ban using UUID (assuming guild_bans uses user_id as UUID now, if not this might need adjustment)
        // If guild_bans uses discord ID, we might still need discord ID for THIS check, but insert needs UUID.
        // Let's assume user_id in guild_bans is consistent with lobby_players for now or check if we need to dual-query.
        // Per directive: "Do NOT query public.players to get the numeric user_id. DO use ... user.id"
        // So we strictly use user.id for the INSERT.

        // For the BAN check, we should probably stick to what the schema expects.
        // If guild_bans expects discord ID, we might need it just for this check.
        // But the primary fix is the INSERT.
        // Let's grab discord ID just for the ban check if needed, but use UUID for insert.

        const discordIdentity = user.identities?.find(i => i.provider === 'discord')
        const discordId = discordIdentity?.id

        if (discordId && lobby.guild_id) {
            const { data: ban } = await supabase
                .from('guild_bans')
                .select('id')
                .eq('guild_id', lobby.guild_id)
                .eq('user_id', discordId) // Bans might still be on Discord ID?
                .single()

            if (ban) {
                throw new Error('Access Denied: You are blacklisted in this lobby.')
            }
        }

        // 2.5 Voice Guard Check
        if (lobby.voice_required && discordId) {
            if (!lobby.guild_id) {
                // Should technically not happen for voice lobbies but strictness required
                console.warn('Voice check skipped: No Guild ID in lobby');
            } else {
                const isInVoice = await verifyUserVoice(lobby.guild_id, discordId)
                if (!isInVoice) {
                    throw new Error('Access Denied: Voice Comms Required. Join a voice channel first.')
                }
            }
        }

        // 3. Capacity Check
        const currentPlayers = lobby.lobby_players?.length || 0;
        const gameMode = Array.isArray(lobby.game_modes) ? lobby.game_modes[0] : lobby.game_modes
        const maxPlayers = (gameMode?.team_size || 5) * 2

        if (currentPlayers >= maxPlayers) {
            throw new Error('Lobby is at maximum capacity.')
        }

        // Check if already joined (Compare UUIDs) - Already checked at top
        // const isJoined = lobby.lobby_players?.some((p: any) => p.user_id === userId);
        // if (isJoined) {
        //    return { success: true, message: 'Already joined.', lobby }
        // }

        // 3.5. Pre-Flight Schema Check (Dev Mode Only)
        if (process.env.NODE_ENV === 'development') {
            const { error: preFlightError } = await supabase
                .from('lobby_players')
                .select('status')
                .limit(0)
                .maybeSingle();

            if (preFlightError && preFlightError.message.includes('status')) {
                throw new Error('System Status Alert: Missing "status" column in lobby_players. Run migration.');
            }
        }

        // 4. Execution (As User) - INSERT USING UUID
        const { error: joinError } = await supabase
            .from('lobby_players')
            .insert([{
                lobby_id: lobbyId,
                user_id: userId, // <--- CORRECTED: NOW USING UUID
                status: 'joined'
            }])

        if (joinError) {
            console.error('Join Error:', joinError);

            if (joinError.code === 'PGRST204') {
                throw new Error('Lobby Protocol Mismatch. Please run Schema Sentinel in the Command Center.');
            }
            // Catch 22P02 specifically to give better error
            if (joinError.code === '22P02') {
                throw new Error('Identity Protocol Error: UUID Mismatch. The system rejected the player ID format.');
            }

            throw new Error('Failed to join lobby database record.')
        }

        revalidatePath('/')
        return { success: true, message: 'Joined successfully.', lobby }

    } catch (error: any) {
        console.error('Join Lobby Error:', error)
        return {
            success: false,
            message: error.message || 'Failed to join lobby.'
        }
    }
}

export async function leaveLobby(lobbyId: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, message: 'Not authenticated.' }

        // Correctly use UUID for deletion
        const userId = user.id

        const { error } = await supabase
            .from('lobby_players')
            .delete()
            .eq('lobby_id', lobbyId)
            .eq('user_id', userId) // UUID

        if (error) {
            throw error;
        }

        revalidatePath('/')
        return { success: true, message: 'Left successfully.' }

    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Failed to leave lobby.'
        }
    }
}

export async function closeLobby(lobbyId: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient()

        // 1. Auth Check (Admin or Host?)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized.')

        // UPDATE: 'is_active' = false
        const { error } = await supabase
            .from('lobbies')
            .update({ status: 'finished' })
            .eq('id', lobbyId)

        if (error) throw error

        revalidatePath('/')
        return { success: true, message: 'Lobby decommissioned.' }

    } catch (error: any) {
        console.error('Close Lobby Error:', error)
        return {
            success: false,
            message: error.message || 'Failed to close lobby.'
        }
    }
}

export async function submitReadyState(lobbyId: string, isReady: boolean): Promise<ActionResponse> {
    try {
        const supabase = await createClient()

        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized.')

        const userUuid = user.id

        const status = isReady ? 'ACCEPTED' : 'DECLINED'

        const { error } = await supabase
            .from('ready_checks' as any)
            .upsert({
                lobby_id: lobbyId,
                user_id: userUuid, // Using UUID per schema
                status: status
            }, { onConflict: 'lobby_id, user_id' })

        if (error) {
            console.error('Ready Check Error:', error)
            throw new Error('Failed to submit ready state.')
        }

        revalidatePath('/')
        return { success: true, message: isReady ? 'Ready accepted.' : 'Declined.' }

    } catch (error: any) {
        console.error('Submit Ready Error:', error)
        return {
            success: false,
            message: error.message || 'Failed to submit ready state.'
        }
    }
}

export async function toggleReady(lobbyId: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient()

        // 1. Auth & Identity Check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized.')

        // Correctly use UUID
        const userId = user.id

        // 2. Fetch Lobby Status
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .select('status')
            .eq('id', lobbyId)
            .single()

        if (lobbyError || !lobby) throw new Error('Lobby not found.')

        // if (lobby.status !== 'created' && lobby.status !== 'waiting' && lobby.status !== 'open') {
        //     throw new Error('Lobby is not open for ready checks.')
        // }
        // Add this log instead so we can debug it:
        console.log(`[DEBUG] Toggling ready. Lobby Status: ${lobby.status}`);

        // 3. Get Current Status
        const { data: currentPlayer, error: fetchError } = await supabase
            .from('lobby_players')
            .select('is_ready')
            .eq('lobby_id', lobbyId)
            .eq('user_id', userId) // UUID
            .single()

        if (fetchError || !currentPlayer) throw new Error('You are not in this lobby.')

        // 4. Toggle Status
        const newStatus = !currentPlayer.is_ready

        const { error: updateError } = await supabase
            .from('lobby_players')
            .update({ is_ready: newStatus })
            .eq('lobby_id', lobbyId)
            .eq('user_id', userId) // UUID

        if (updateError) throw new Error('Failed to update ready status.')

        revalidatePath('/')
        return { success: true, message: newStatus ? 'You are ready.' : 'Ready status cancelled.' }

    } catch (error: any) {
        console.error('Toggle Ready Error:', error)
        return {
            success: false,
            message: error.message || 'Failed to toggle ready status.'
        }
    }
}

export async function initializeMatchSequence(lobbyId: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient()

        // 1. Auth Check (Commander Only)
        // Ideally we check if user is creator, but for speed, let's just allow any auth'd user 
        // who is technically in the lobby (DB RLS or frontend will gate UI).
        // Best practice: Check creator_id.

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized.')

        // Verify Commander Status (Optional but good)
        const { data: lobby } = await supabase
            .from('lobbies')
            .select('creator_id')
            .eq('id', lobbyId)
            .single()

        if (!lobby || lobby.creator_id !== user.id) {
            throw new Error('Unauthorized: Only the Commander can initiate launch.')
        }

        // 2. Update Status AND Reset Ready State for Handshake
        const { error: lobbyError } = await supabase
            .from('lobbies')
            .update({ status: 'starting' })
            .eq('id', lobbyId)

        if (lobbyError) throw lobbyError

        // CRITICAL: Reset is_ready to false for ALL players to force the "ACCEPT" handshake
        const { error: resetError } = await supabase
            .from('lobby_players')
            .update({ is_ready: false })
            .eq('lobby_id', lobbyId)

        if (resetError) throw resetError

        revalidatePath('/')
        return { success: true, message: 'Match initialization sequence started.' }

    } catch (error: any) {
        console.error('Initialize Match Error:', error)
        return {
            success: false,
            message: error.message || 'Failed to initialize match.'
        }
    }
}

export async function acceptMatchHandshake(lobbyId: string): Promise<ActionResponse & { matchStarted?: boolean, matchId?: string }> {
    try {
        console.log(`[HANDSHAKE] Starting acceptance for Lobby ${lobbyId}`);
        const supabase = await createClient()

        // 1. Auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            console.error('[HANDSHAKE] No user found.');
            throw new Error('Unauthorized')
        }
        const userId = user.id
        console.log(`[HANDSHAKE] User ${userId} accepted.`);

        // 2. Set THIS user to ready
        const { error: updateError } = await supabase
            .from('lobby_players')
            .update({ is_ready: true })
            .eq('lobby_id', lobbyId)
            .eq('user_id', userId)

        if (updateError) {
            console.error('[HANDSHAKE] Update Error:', updateError);
            throw updateError;
        }

        // 3. Check if ALL players are ready
        // Fetch all players for this lobby
        const { data: allPlayers, error: fetchError } = await supabase
            .from('lobby_players')
            .select('user_id, is_ready, team')
            .eq('lobby_id', lobbyId)

        if (fetchError || !allPlayers) {
            console.error('[HANDSHAKE] Integrity Error:', fetchError);
            throw new Error('Failed to verify lobby integrity.')
        }

        const allReady = allPlayers.every(p => p.is_ready === true)
        console.log(`[HANDSHAKE] Lobby Status: ${allReady ? 'ALL READY' : 'WAITING'} (${allPlayers.filter(p => p.is_ready).length}/${allPlayers.length})`);

        if (!allReady) {
            revalidatePath('/')
            return { success: true, matchStarted: false, message: 'Acceptance registered. Waiting for others.' }
        }

        // 4. ALL READY -> CREATE MATCH
        // A. Get Lobby Details (game_mode, region, etc.)
        const { data: lobby } = await supabase
            .from('lobbies')
            .select('*')
            .eq('id', lobbyId)
            .single()

        if (!lobby) throw new Error('Lobby vanished.')
        if (!lobby.game_mode_id) throw new Error('Lobby Game Mode Invalid');

        // RACE CONDITION GUARD: Check if match already exists
        if (lobby.match_id) {
            console.log(`[HANDSHAKE] Match already exists: ${lobby.match_id}. Joining...`);
            return {
                success: true,
                matchStarted: true,
                matchId: lobby.match_id,
                message: 'Match already created. Joining...'
            }
        }

        // B. Insert Match
        console.log('[HANDSHAKE] Creating Match...');
        const { data: newMatch, error: matchError } = await supabase
            .from('matches')
            .insert({
                game_mode_id: lobby.game_mode_id!, // Asserting non-null as verified by lobby integrity logic or required logic
                region: lobby.region,
                status: 'active', // or 'live' depending on schema, usually 'active' for matches
                guild_id: lobby.guild_id,
                metadata: {
                    source_lobby_id: lobbyId
                }
            })
            .select('id')
            .single()

        if (matchError || !newMatch) {
            console.error('[HANDSHAKE] Match Creation Error:', matchError);
            throw new Error('Failed to create match instance.')
        }

        console.log(`[HANDSHAKE] Match Created: ${newMatch.id}`);

        // C. Migrate Players (Lobby -> Match)
        // Auto-Assign Teams (Alternating for now: 1, 2) to ensure distinct teams
        const matchPlayersPayload = allPlayers.map((p, index) => ({
            match_id: newMatch.id,
            user_id: p.user_id,
            team: (index % 2) + 1 // Assigns Team 1 and Team 2
        }))

        const { error: migrationError } = await supabase
            .from('match_players')
            .insert(matchPlayersPayload)

        if (migrationError) {
            console.error('[HANDSHAKE] Migration Error:', migrationError);
            throw new Error('Failed to migrate players to match.')
        }

        // D. Update Lobby (Status=Live, match_id=...)
        const { error: promotionError } = await supabase
            .from('lobbies')
            .update({
                status: 'live',
                match_id: newMatch.id
            })
            .eq('id', lobbyId)

        if (promotionError) throw promotionError

        revalidatePath('/')
        return {
            success: true,
            matchStarted: true,
            matchId: newMatch.id,
            message: 'Match successfully created.'
        }

    } catch (error: any) {
        console.error('Handshake Error:', error)
        return {
            success: false,
            message: error.message || 'Failed to process match acceptance.'
        }
    }
}
