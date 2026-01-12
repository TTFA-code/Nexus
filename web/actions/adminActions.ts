'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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
    const { data, error } = await supabase.rpc('approve_match', {
        match_id_input: matchId
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
    revalidatePath('/dashboard/admin')

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

    const { data, error } = await supabase.rpc('approve_all_server_matches', {
        target_guild_id: guildId
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/admin')
    return { success: true, count: (data as any)?.processed_count }
}
