'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReport(formData: FormData) {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('Unauthorized')
    }

    // 2. Extract Data
    const guildId = formData.get('guildId') as string
    const reportedId = formData.get('reportedId') as string
    const reason = formData.get('reason') as string
    const details = formData.get('details') as string

    if (!guildId || !reportedId || !reason) {
        return { success: false, message: "Missing required fields." }
    }

    // 3. Insert into reports
    const { error } = await supabase
        .from('reports')
        .insert({
            guild_id: guildId,
            reporter_id: user.id, // Authenticated user is the reporter. 
            // Note: Schema says references profiles(id). Usually profiles.id == auth.users.id.
            reported_id: reportedId,
            reason: reason,
            details: details,
            status: 'PENDING'
        })

    if (error) {
        console.error('Error submitting report:', error)
        return { success: false, message: "Failed to transmit report." }
    }

    return { success: true, message: "Report transmitted to Nexus Command." }
}
