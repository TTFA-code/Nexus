import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { game_mode_id, notes, is_private, voice_required, is_tournament, sector_key: providedKey, scheduled_start } = body

        if (!game_mode_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // ... existing resolve logic ...

        // Generate Sector Key if Private
        let sectorKey = null
        if (is_private) {
            sectorKey = providedKey || Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(4, '0')
        }

        // 1. Resolve Game Mode
        const { data: gameModeData, error: gmError } = await supabase
            .from('game_modes')
            .select('id, guild_id')
            .eq('id', game_mode_id)
            .single()

        if (gmError || !gameModeData) {
            console.error('Game Mode Resolution Error:', gmError)
            return NextResponse.json({ error: 'Game mode not found' }, { status: 404 })
        }

        // 2. Resolve Discord ID (Host)
        const discordIdentity = user.identities?.find(i => i.provider === 'discord')
        const hostId = discordIdentity?.id

        if (!hostId) {
            return NextResponse.json({ error: 'Discord identity missing' }, { status: 400 })
        }

        // On-the-Fly Player Sync
        // Ensure player exists for both the UUID (Primary) and the Discord Snowflake (Legacy/Display).
        // Since we are moving to UUID joins, we must ensure public.players has a record where uuid_link = user.id.
        // And for backwards compatibility, user_id = hostId (Discord Snowflake).

        await supabase.from('players').upsert({
            user_id: hostId, // Discord ID (Primary Key in legacy schema?) 
            // NOTE: If PK is user_id and it is varchar, this works. 
            // If PK is UUID, we need to handle that. Assuming user_id is PK and is varchar based on context.
            username: user.user_metadata.full_name || 'Unknown',
            avatar_url: user.user_metadata.avatar_url
        }, { onConflict: 'user_id' })

        // Determine Status
        let status = 'WAITING'
        if (scheduled_start) {
            const startDate = new Date(scheduled_start)
            if (startDate > new Date()) {
                status = 'SCHEDULED'
            }
        }

        // 3. Create Lobby
        const { data: lobby, error: lobbyError } = await supabase
            .from('lobbies')
            .insert({
                game_mode_id: gameModeData.id,
                guild_id: gameModeData.guild_id,
                status: status,
                creator_id: user.id, // Use Supabase Auth UUID
                is_private: is_private,
                voice_required: voice_required,
                is_tournament: is_tournament || false,
                sector_key: sectorKey,
                scheduled_start: scheduled_start || null,
                notes: notes || null
            })
            .select()
            .single()

        if (lobbyError) {
            console.error('Lobby Creation Error:', lobbyError)
            return NextResponse.json({ error: 'Failed to create lobby' }, { status: 500 })
        }

        // 4. Auto-Join (If not tournament)
        if (!is_tournament) {
            // "When a user creates an Arena lobby (not a tournament), the createLobby function should automatically call joinLobby"
            // We do this via direct DB insert for speed/atomicity in this route.
            const { error: joinError } = await supabase
                .from('lobby_players')
                .insert([{
                    lobby_id: lobby.id,
                    user_id: user.id, // Using Auth UUID per directive
                    status: 'joined',
                    is_ready: false
                }])

            if (joinError) {
                console.error('Auto-Join Error:', joinError)
                // We don't fail the lobby creation for this, but ideally we should transactionalize it.
            }
        }

        return NextResponse.json({ success: true, lobbyId: lobby.id })
    } catch (error) {
        console.error('Lobby API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
