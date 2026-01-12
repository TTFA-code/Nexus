'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createGameMode(formData: FormData) {
    const supabase = await createClient()

    // 1. Authenticate User (Basic check)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Unauthorized' }
    }

    // 2. Extract Data
    const name = formData.get('name') as string // Variant Name
    const gameId = formData.get('game_id') as string
    const guildId = formData.get('guildId') as string

    // Optional: Get team size if provided or default 
    const teamSize = formData.get('team_size') ? parseInt(formData.get('team_size') as string) : 5

    const { error } = await supabase
        .from('game_modes')
        .insert({
            game_id: gameId,
            name: name,
            guild_id: guildId,
            team_size: teamSize,
            is_active: true
        })

    if (error) {
        console.error('Error creating game mode:', error)
        return { error: 'Failed to create game mode' }
    }

    revalidatePath(`/admin/${guildId}`)
    return { success: true }
}

export async function deleteGameMode(formData: FormData) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Unauthorized' }
    }

    const modeId = formData.get('modeId') as string
    const guildId = formData.get('guildId') as string

    // Security check: Ensure this mode actually belongs to this guild (is Custom)
    const { error } = await supabase
        .from('game_modes')
        .delete()
        .eq('id', modeId)
        .eq('guild_id', guildId) // Critical security check

    if (error) {
        return { error: 'Failed to delete mode' }
    }

    revalidatePath(`/admin/${guildId}`)
    return { success: true }
}
