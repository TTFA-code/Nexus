'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cancelMatchAction(matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    if (typeof matchId !== 'string') return { error: 'Invalid match ID format' }

    const { error } = await supabase.rpc('cancel_match', {
        p_match_id: matchId
    })

    if (error) {
        console.error('Cancel Match RPC Error:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/admin/operations')
    return { success: true, message: 'Match cancelled.' }
}

export async function rejectMatchAction(matchId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    if (typeof matchId !== 'string') return { error: 'Invalid match ID format' }

    const { error } = await supabase.rpc('reject_match', {
        p_match_id: matchId
    })

    if (error) {
        console.error('Reject Match RPC Error:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/admin/operations')
    return { success: true, message: 'Match rejected (voided).' }
}

export async function approveMatchAction(matchId: string) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Optional: Check Admin Role if strictly enforced here, 
    // but usually RPC or RLS handles data safety, and middleware handles route access.

    console.log(`[ADMIN_ACTION] Approving Match ${matchId} by ${user.id}`);

    // 2. Call RPC
    // Ensure matchId is a string
    if (typeof matchId !== 'string') {
        return { error: 'Invalid match ID format' }
    }

    const { data, error } = await supabase.rpc('approve_match', {
        p_match_id: matchId
    })

    if (error) {
        console.error('Approve Match RPC Error:', error)
        return { error: error.message }
    }

    if (data && (data as any).error) {
        const errorMsg = (data as any).error
        // Structured Error Handling
        if (errorMsg.includes('already processed') || errorMsg.includes('approved')) {
            return { success: false, code: 'ALREADY_PROCESSED', error: errorMsg }
        }
        return { error: errorMsg }
    }

    // 3. Revalidate
    revalidatePath('/dashboard/admin') // Keep existing
    revalidatePath('/admin/operations') // Add requested path

    return {
        success: true,
        message: 'Match approved. MMR recalculation complete.',
        details: data
    }
}

export async function approveAllMatchesAction(guildId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    console.log(`[ADMIN_ACTION] Approving ALL Pending Matches for Guild ${guildId}`);

    // TODO: Add approve_all_server_matches to types/supabase.ts to remove cast
    const { data, error } = await (supabase.rpc as any)('approve_all_server_matches', {
        p_target_guild_id: guildId
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin')
    return { success: true, count: (data as any)?.processed_count }
}

export async function getGuildMatchHistory(guildId: string) {
    const supabase = await createClient()

    // Query matches linked to game_modes for this guild
    // Limitations: This primarily finds matches from Custom Game Modes created by this guild.
    // Global games might not be captured if they aren't linked to a guild-specific mode.
    const { data: matches, error } = await supabase
        .from('matches')
        .select(`
            id,
            status,
            created_at: started_at,
            finished_at,
            winner_team,
            game_modes!matches_game_mode_id_fkey!inner (
                name,
                guild_id,
                games (
                    name,
                    icon_url
                )
            )
        `)
        .eq('game_modes.guild_id', guildId)
        .order('started_at', { ascending: false })
        .limit(50) // Cap for performance for now

    if (error) {
        console.error('Error fetching guild match history:', error)
        return []
    }

    // Map to a cleaner format
    return matches.map((m: any) => {
        let gameName = m.game_modes?.games?.name || 'Unknown';
        const modeName = m.game_modes?.name || 'Unknown';

        // Explicitly distinguish Mobile if implied by Mode but not Game Name (e.g. "eFootball" game + "Mobile 1v1" mode)
        if (modeName.toLowerCase().includes('mobile') && !gameName.toLowerCase().includes('mobile')) {
            gameName = `${gameName} (Mobile)`;
        }

        return {
            id: m.id,
            status: m.status,
            date: m.created_at || m.finished_at,
            gameName: gameName,
            modeName: modeName,
            winner: m.winner_team,
            icon: m.game_modes?.games?.icon_url
        };
    })
}

export async function getGuildMemberActivity(guildId: string) {
    const supabase = await createClient()

    // Cast to any to bypass strict RPC typing until types are regenerated
    const { data, error } = await (supabase.rpc as any)('get_guild_member_matches', { p_guild_id: guildId })

    if (error) {
        console.error('Error fetching guild member activity:', error)
        return []
    }

    const matches = (data || []) as any[]

    // Map to a cleaner format
    return matches.map((m: any) => ({
        id: m.id,
        status: m.status,
        date: m.created_at || m.finished_at,
        gameName: m.game_name || 'Unknown',
        modeName: m.mode_name || 'Unknown',
        winner: m.winner_team,
        icon: m.game_icon,
        // RPC returns player details too, we could show "Played by [User]"
        playedBy: m.player_username,
        playerAvatar: m.player_avatar
    }))
}
