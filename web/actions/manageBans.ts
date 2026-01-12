'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleGuildBan(guildId: string, userId: string, reason?: string) {
    const supabase = await createClient()

    // Check if ban exists
    const { data: existingBan, error: fetchError } = await supabase
        .from('guild_bans')
        .select('*')
        .eq('guild_id', guildId)
        .eq('user_id', userId)
        .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "Row not found" - ignore that, but throw others
        console.error('Error checking ban status:', JSON.stringify(fetchError, null, 2))
        throw new Error(`Failed to check ban status: ${fetchError.message} (${fetchError.code})`)
    }

    if (existingBan) {
        // UNBAN: Delete the record
        const { error: deleteError } = await supabase
            .from('guild_bans')
            .delete()
            .eq('guild_id', guildId)
            .eq('user_id', userId)

        if (deleteError) {
            console.error('Error removing ban:', deleteError)
            throw new Error('Failed to remove ban')
        }
    } else {
        // BAN: Insert the record
        const { error: insertError } = await supabase
            .from('guild_bans')
            .insert({
                guild_id: guildId,
                user_id: userId,
                reason: reason || null
            })

        if (insertError) {
            console.error('Error applying ban:', insertError)
            throw new Error('Failed to apply ban')
        }
    }

    revalidatePath(`/admin/${guildId}`)
}
