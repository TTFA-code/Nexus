
import { Events, Guild } from 'discord.js';

module.exports = {
    name: Events.GuildCreate,
    async execute(guild: Guild) {
        console.log(`Joined new guild: ${guild.name} (${guild.id})`);
        const supabase = guild.client.supabase;

        try {
            // 1. Ensure Guild Exists (Legacy Check)
            const { error } = await supabase.rpc('ensure_guild_exists', {
                gid: guild.id,
                gname: guild.name
            });

            if (error) {
                console.error('Error ensuring guild exists:', error);
            } else {
                console.log(`Guild check-in complete for ${guild.name}`);
            }

            // 2. Bulk Sync Members
            console.log(`[GuildCreate] Fetching members for ${guild.name}...`);
            const members = await guild.members.fetch();
            console.log(`[GuildCreate] Found ${members.size} members. Syncing...`);

            const updates = members.map(m => ({
                guild_id: guild.id,
                user_id: m.id,
                role: 'player'
            }));

            // Supabase supports bulk upsert
            const { error: syncError } = await supabase
                .from('server_members')
                .upsert(updates, { onConflict: 'guild_id,user_id' });

            if (syncError) {
                if (syncError.code === '42P01') {
                    console.error("CRITICAL: 'server_members' table missing from Supabase.");
                } else {
                    console.error('[GuildCreate] Bulk sync failed:', syncError.message);
                }
            } else {
                console.log(`[GuildCreate] Successfully synced ${updates.length} members.`);
            }

        } catch (err) {
            console.error('Unexpected error in guildCreate:', err);
        }
    },
};
