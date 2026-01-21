'use server'

import { createClient } from '@/utils/supabase/server'

export async function getActiveLobbies(guildId: string) {
    const supabase = await createClient()


    // Debug Injection
    console.log("Querying Lobbies with Join (getAdminIntel)...");
    try {
        interface AdminLobby {
            id: string
            created_at: string
            status: string
            game_mode_id: string | null
            guild_id: string | null
            creator_id: string
            is_private: boolean
            voice_required: boolean
            is_tournament: boolean
            sector_key: string | null
            scheduled_start: string | null
            notes: string | null
            match_id: string | null
            region: string | null
            creator: {
                username: string | null
                avatar_url: string | null
            } | null
            lobby_players: {
                user_id: string
            }[]
            game_modes: {
                id: string
                name: string
                team_size: number
                games: {
                    name: string
                    icon_url: string | null
                } | null
            } | null
        }

        const { data, error } = await supabase
            .from('lobbies')
            .select('*, creator_id, lobby_players(user_id), creator:creator_id(username, avatar_url), game_modes(*, games(name, icon_url))')
            // Dynamic Admin Filtering:
            .or(`guild_id.eq.${guildId},guild_id.is.null`)
            .eq('is_tournament', true) // Only show Tournament Lobbies in Command Center
            .neq('status', 'finished')
            .order('created_at', { ascending: false })

        if (error) {
            console.dir(error, { depth: null });
            console.error('Error fetching active lobbies:', error)
            return []
        }

        const lobbies = data as unknown as AdminLobby[];

        return lobbies.map((lobby) => ({
            ...lobby,
            host_name: lobby.creator?.username || 'Unknown Host',
            host_avatar: lobby.creator?.avatar_url || null,
            player_count: lobby.lobby_players?.length || 0,
            displayProtocol: lobby.game_modes?.games?.name || 'Unknown Protocol',
            game_name: lobby.game_modes?.games?.name || 'Unknown Game',
            game_icon: lobby.game_modes?.games?.icon_url || null,
            mode_name: lobby.game_modes?.name || 'Unknown Mode'
        }))

    } catch (e) {
        console.dir(e, { depth: null });
        return [];
    }
}


export async function getRecentReports(guildId: string) {
    const supabase = await createClient()

    // Assuming reports link to players via reporter_id and reported_id
    // And assuming players table has username/avatar_url
    const { data, error } = await supabase
        .from('reports')
        .select(`
            id,
            reason,
            status,
            created_at,
            reporter_id,
            reported_id,
            details,
            reporter:players!reporter_id(user_id, username, avatar_url),
            reported:players!reported_id(user_id, username, avatar_url)
        `)
        .eq('guild_id', guildId)
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('Error fetching reports:', error)
        return []
    }

    return data.map((r: any) => ({
        ...r,
        reporter: Array.isArray(r.reporter) ? r.reporter[0] : r.reporter,
        reported: Array.isArray(r.reported) ? r.reported[0] : r.reported
    }))
}
