import { createClient } from '@/utils/supabase/server';
import { AdminInbox } from '@/components/admin/AdminInbox';

export default async function AdminInboxPage() {
    const supabase = await createClient();

    // Fetch the active guild context. 
    // Ideally this comes from the URL or User Profile.
    // For now, we select the first available guild from clubs.
    const { data: guild } = await supabase
        .from('guilds')
        .select('guild_id')
        .limit(1)
        .single();

    // Fallback if no guild found (e.g. fresh install)
    const guildId = guild?.guild_id || 'default_guild';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">COMMAND CENTER // INBOX</h1>
                    <p className="text-zinc-400 text-sm">Review pending match reports and verify evidence.</p>
                </div>
            </div>

            <AdminInbox guildId={guildId as string} />
        </div>
    );
}
