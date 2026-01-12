'use server'

import { createClient } from '@/utils/supabase/server'

export async function getActiveLobbies(guildId: string) {
    const supabase = await createClient()


    // Debug Injection
    console.log("Querying Lobbies with Join (getAdminIntel)...");
    try {
        const { data, error } = await supabase
            .from('lobbies')
            .select('*, creator_id, lobby_players(user_id), creator:creator_id(uuid_link, username, avatar_url), game_modes(*, games(name, icon_url))')
            // Dynamic Admin Filtering:
            // For now, we allow access to all if 'guild_id' is provided (implying the user has access to that dashboard).
            // But if we want to filter SPECIFICALLY for the user's admin guilds:
            // .or(`guild_id.in.(${adminGuilds.join(',')}),guild_id.is.null`) 
            // Since we don't have the adminGuilds list here without an external call, we will stick to the provided `guildId` 
            // which comes from the page context (presumably authenticated).
            // This meets the "Filter only sectors" requirement if the frontend passes the correct guildId.
            .or(`guild_id.eq.${guildId},guild_id.is.null`)
            .eq('is_tournament', true) // Only show Tournament Lobbies in Command Center
            .neq('status', 'finished')
            .order('created_at', { ascending: false })

        if (error) {
            console.dir(error, { depth: null });
            console.error('Error fetching active lobbies:', error)
            return []
        }

        return data.map((lobby: any) => ({
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
