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

    if (action === 'BAN') {
        // Ban the user and resolve
        // Call toggleGuildBan - wait, toggleGuildBan toggles. If already banned, it unbans.
        // We need 'ensureBanned' or similar logic.
        // We will call toggleGuildBan but pass the reason.
        // Actually, toggleGuildBan updates: logic in prompt said "If YES: Delete (Unban), If NO: Insert (Ban)".
        // So we strictly want to BAN here.
        // We should check if banned first? toggleGuildBan does that.
        // But if they ARE banned, toggleGuildBan will unban them! That's risky for a "Resolve & Ban" button.
        // I should modify toggleGuildBan to accept an explicit 'action' or 'forceBan' param?
        // Or I just handle the insertion manually here to be safe and explicit.
        // Re-reading prompt: "If action === 'BAN': Call toggleGuildBan (Insert into guild_bans) AND update report status to RESOLVED."
        // I will trust the prompt but I will modify toggleGuildBan to be smarter or I will check myself.
        // Let's modify toggleGuildBan to optionally take a 'force' argument or I'll just do the db op here for clarity and atomicity.
        // Actually, modifying `toggleGuildBan` to take a reason is required anyway.
        // Let's implement the ban logic here properly to ensure we don't accidentally unban.

        // Check if already banned
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
