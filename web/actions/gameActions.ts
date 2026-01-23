'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

type ActionResponse = {
    success: boolean
    message?: string
    error?: string
    game?: any
}

export async function createGame(formData: FormData): Promise<ActionResponse> {
    const supabase = await createClient()

    // 1. Authenticate
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: 'Unauthorized' }
    }

    // 2. Resolve Discord ID
    const discordIdentity = user.identities?.find(i => i.provider === 'discord')
    const discordId = discordIdentity?.id

    if (!discordId) {
        return { success: false, error: 'Unauthorized: No Discord Link' }
    }

    // 3. Extract Data
    const name = formData.get('name') as string
    const iconUrl = formData.get('icon_url') as string
    const guildId = formData.get('guild_id') as string

    if (!name || !guildId) {
        return { success: false, error: 'Missing required fields (Name or Guild ID)' }
    }

    try {
        // 4. Insert Game
        const { data, error } = await supabase
            .from('games')
            .insert({
                name: name,
                icon_url: iconUrl || null,
                guild_id: guildId,
                created_by: discordId
            } as any)
            .select()
            .single()

        if (error) {
            console.error('Create Game Error:', error)
            if (error.code === '23505') { // Unique violation
                return { success: false, error: 'A game with this name already exists.' }
            }
            return { success: false, error: 'Failed to create game.' }
        }

        revalidatePath(`/dashboard/${guildId}/admin/operations`)
        revalidatePath(`/admin/${guildId}`)

        return { success: true, message: 'Game initialized.', game: data }

    } catch (e: any) {
        console.error('Create Game Exception:', e)
        return { success: false, error: e.message || 'System Error' }
    }
}
