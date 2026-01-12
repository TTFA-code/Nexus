'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTournament(formData: FormData) {
    const supabase = await createClient()

    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Unauthorized' }
    }

    // 2. Extract Data
    const guildId = formData.get('guildId') as string
    const gameModeId = formData.get('game_mode_id')
    const bracketType = formData.get('bracket_type')
    const startTimeRaw = formData.get('start_time') as string
    const scheduledStart = startTimeRaw === "" ? null : new Date(startTimeRaw).toISOString()
    const roleRestriction = formData.get('role_restriction')

    if (!guildId || !gameModeId) {
        return { success: false, message: 'Missing required fields' }
    }



    // 3. Resolve Discord ID & Ensure Player Exists
    const discordIdentity = user.identities?.find(i => i.provider === 'discord')
    const hostId = discordIdentity?.id

    if (!hostId) {
        return { success: false, message: 'Discord Identity Not Found' }
    }

    // Ensure player exists to satisfy foreign key constraint
    const { error: playerError } = await supabase.from('players').upsert({
        user_id: hostId,
        username: user.user_metadata.full_name || 'Unknown',
        avatar_url: user.user_metadata.avatar_url
    })

    if (playerError) {
        console.error('Player Sync Error:', playerError)
        // We continue, as it might just be a duplicate key error or similar, 
        // though upsert should handle it. If it's a real error, the next insert might fail.
    }

    // 4. Insert into DB
    const { data, error: dbError } = await supabase
        .from('lobbies')
        .insert({
            guild_id: guildId,
            game_mode_id: gameModeId as string,
            creator_id: user.id, // Use Supabase Auth UUID
            status: 'SCHEDULED',
            is_tournament: true,
            is_private: false,
            voice_required: true, // Hardcoded for Command Center
            scheduled_start: scheduledStart,
            notes: (formData.get('notes') as string) || null
        })
        .select()
        .single()

    if (dbError) {
        console.error('Error creating tournament:', dbError)
        return { success: false, message: 'Database Error' }
    }

    // 5. Revalidate
    revalidatePath(`/admin/${guildId}`)

    return { success: true, message: 'Operation Initialized', lobby: data }
}
