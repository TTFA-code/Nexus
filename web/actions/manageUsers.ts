'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleUserBan(userId: string, shouldBan: boolean, guildId: string) {
    const supabase = await createClient()

    // 1. Authenticate Admin
    // Ideally we check if the user is an admin of the guild or a global admin.
    // For now, we just ensure they are logged in as this is an internal tool.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, message: 'Unauthorized' }
    }

    // TODO: Add robust Admin Role check here relative to guildId

    // 2. Update Profile
    const { error } = await supabase
        .from('players')
        .update({ is_banned: shouldBan })
        .eq('user_id', userId)

    if (error) {
        console.error('Error updating profile:', error)
        return { success: false, message: 'Database Error' }
    }

    // 3. Revalidate Path
    revalidatePath(`/admin/${guildId}`)

    return { success: true, message: shouldBan ? 'Operative Banned' : 'Operative Reinstated' }
}
