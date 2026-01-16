'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCustomGameMode(guildId: string, gameId: string, name: string, teamSize: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        const { error } = await supabase
            .from('game_modes')
            .insert({
                guild_id: guildId,
                game_id: gameId,
                name: name,
                team_size: teamSize,
                is_active: true,
                picking_method: 'RANDOM', // Default
                description: 'Custom Guild Protocol'
            })

        if (error) throw error

        revalidatePath(`/dashboard/${guildId}/admin/operations`)
        return { success: true, message: 'Protocol established.' }

    } catch (error: any) {
        console.error('Create Mode Error:', error)
        return { success: false, message: error.message || 'Failed to create protocol.' }
    }
}
