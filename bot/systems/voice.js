const { ChannelType, PermissionFlagsBits } = require('discord.js');

class VoiceSystem {
    constructor(client) {
        this.client = client;
    }

    async createMatchChannels(guild, match, team1Ids, team2Ids) {
        // 1. Create Category if needed (or just use the first one found/configured)
        // For now, we'll create them under a specific category "Nexus Matches" if it exists, or create it.
        let category = guild.channels.cache.find(c => c.name === 'Nexus Matches' && c.type === ChannelType.GuildCategory);

        if (!category) {
            category = await guild.channels.create({
                name: 'Nexus Matches',
                type: ChannelType.GuildCategory,
            });
        }

        // 2. Create Team 1 Channel
        const channel1 = await guild.channels.create({
            name: `Match #${match.id} - Team 1`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.Connect], // Deny everyone
                },
                ...team1Ids.map(id => ({
                    id: id,
                    allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.ViewChannel],
                })),
            ],
        });

        // 3. Create Team 2 Channel
        const channel2 = await guild.channels.create({
            name: `Match #${match.id} - Team 2`,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.Connect],
                },
                ...team2Ids.map(id => ({
                    id: id,
                    allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.ViewChannel],
                })),
            ],
        });

        // 4. Move Players (Best effort)
        await this.movePlayersToChannel(guild, team1Ids, channel1);
        await this.movePlayersToChannel(guild, team2Ids, channel2);

        return { team1ChannelId: channel1.id, team2ChannelId: channel2.id };
    }

    async movePlayersToChannel(guild, userIds, channel) {
        for (const userId of userIds) {
            try {
                const member = await guild.members.fetch(userId);
                if (member.voice.channel) {
                    await member.voice.setChannel(channel);
                }
            } catch (err) {
                console.error(`Failed to move user ${userId}:`, err);
            }
        }
    }
    async deleteMatchChannels(guild, match) {
        // We look for channels with names `Match #{id} - Team X`
        // Or we could have stored them in the match record if we wanted to be perfectly safe, but finding by name is 'good enough' for this iteration 
        // considering we used a standard naming convention. 

        const team1ChannelName = `Match #${match.id} - Team 1`;
        const team2ChannelName = `Match #${match.id} - Team 2`;

        const channels = guild.channels.cache.filter(c =>
            (c.name === team1ChannelName || c.name === team2ChannelName) && c.type === ChannelType.GuildVoice
        );

        for (const [id, channel] of channels) {
            try {
                await channel.delete();
            } catch (err) {
                console.error(`Failed to delete channel ${channel.name}:`, err);
            }
        }
    }
}

module.exports = VoiceSystem;
