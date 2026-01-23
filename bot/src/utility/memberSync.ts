
import { SupabaseClient } from '@supabase/supabase-js';

export async function syncMemberToDatabase(
    supabase: SupabaseClient,
    guildId: string,
    userId: string,
    role: string = 'player'
) {
    try {
        const { error } = await supabase
            .from('server_members')
            .upsert({
                guild_id: guildId,
                user_id: userId,
                role: role
            }, { onConflict: 'guild_id,user_id' });

        if (error) {
            if (error.code === '42P01') {
                console.error("CRITICAL: 'server_members' table missing from Supabase.");
            } else {
                console.error(`[Sync] Failed to sync member ${userId} for guild ${guildId}:`, error.message);
            }
        }
    } catch (err) {
        console.error('[Sync] Unexpected error during member sync:', err);
    }
}
