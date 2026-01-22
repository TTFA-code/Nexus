const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        // Sync guilds to database to ensure foreign key constraints are met
        const supabase = client.supabase;
        const guilds = client.guilds.cache;

        console.log(`Syncing ${guilds.size} guilds to database...`);

        for (const [guildId, guild] of guilds) {
            try {
                // We use upsert to ensure we have the record, but don't overwrite existing configs if we can avoid it.
                // However, basic info like name should be kept up to date.
                const { error } = await supabase
                    .from('guilds')
                    .upsert({
                        guild_id: guildId,
                        name: guild.name,
                        // defined schema has premium_tier default 0
                    }, { onConflict: 'guild_id' });

                if (error) {
                    if (error.code === '42501') {
                        console.error("CRITICAL: Permission denied on 'guilds' table. Ensure 'GRANT ALL ON TABLE guilds TO service_role' has been run in Supabase SQL Editor.");
                    } else {
                        console.error(`[DB Sync] Failed to sync guild ${guild.name} (${guildId}):`, error);
                    }
                } else {
                    console.log(`[DB Sync] Verified guild: ${guild.name}`);
                }
            } catch (err) {
                console.error(`[DB Sync] Unexpected error syncing guild ${guild.name}:`, err);
            }
        }
        console.log('[DB Sync] Guild sync complete.');
    },
};
