const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        console.log(`Joined new guild: ${guild.name} (${guild.id})`);
        const supabase = guild.client.supabase;

        try {
            const { error } = await supabase.rpc('ensure_guild_exists', {
                gid: guild.id,
                gname: guild.name
            });

            if (error) {
                console.error('Error ensuring club exists:', error);
            } else {
                console.log(`Club check-in complete for ${guild.name}`);
            }
        } catch (err) {
            console.error('Unexpected error in guildCreate:', err);
        }
    },
};
