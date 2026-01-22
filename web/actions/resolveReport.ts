'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { toggleGuildBan } from './manageBans'

export async function resolveReport(reportId: string, action: 'BAN' | 'DISMISS') {
    const supabase = await createClient()

    // Fetch the report to get details
    const { data: report, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single()


    if (fetchError || !report) {
        throw new Error('Report not found')
    }

    // Safety Guard: Narrow the type for TypeScript
    if (!report.guild_id || !report.reported_id) {
        return { error: 'Invalid report data: Missing guild or player ID' }
    }

    if (action === 'BAN') {
        // Check if already banned using verified IDs
        const { data: existingBan } = await supabase
            .from('guild_bans')
            .select('user_id')
            .eq('guild_id', report.guild_id)
            .eq('user_id', report.reported_id)
            .single()

        if (!existingBan) {
            await toggleGuildBan(report.guild_id, report.reported_id, report.reason)
        }
        // If already banned, update reason? existing logic in toggle might just unban. 
        // I'll update `toggleGuildBan` to handle specific intent better in the next step.
    }

    // Update report status
    const status = action === 'BAN' ? 'RESOLVED' : 'DISMISSED';

    const { error: updateError } = await supabase
        .from('reports')
        .update({ status: status })
        .eq('id', reportId)

    if (updateError) {
        throw new Error('Failed to update report status')
    }

    revalidatePath(`/admin/${report.guild_id}`)
}
