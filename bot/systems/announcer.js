const { EmbedBuilder } = require('discord.js');

class AnnouncementManager {
    constructor(client) {
        this.client = client;
    }

    async getChannel(guildId) {
        // Fetch club settings to find the announcement channel
        const { data: club } = await this.client.supabase
            .from('clubs')
            .select('announcement_channel_id')
            .eq('guild_id', guildId)
            .single();

        if (club && club.announcement_channel_id) {
            return this.client.channels.fetch(club.announcement_channel_id).catch(() => null);
        }

        // Fallback: System channel
        const guild = this.client.guilds.cache.get(guildId);
        return guild?.systemChannel;
    }

    async announceMatchFound(gameMode, players) {
        const channel = await this.getChannel(gameMode.guild_id);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle('MATCH FOUND')
            .setDescription(`**Protocol:** ${gameMode.name}\n\nPilots have been selected and are currently initializing systems.`)
            .setColor('#ccff00')
            .addFields(
                { name: 'Pilots', value: players.map(p => `<@${p}>`).join(', ') }
            )
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }

    async announceMatchStarted(match, gameMode, team1, team2) {
        const channel = await this.getChannel(gameMode.guild_id);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle('OPERATION LAUNCHED')
            .setDescription(`**Match #${match.id}** is now active!`)
            .setColor('#00ffff')
            .addFields(
                { name: 'Team Alpha', value: team1.map(id => `<@${id}>`).join('\n'), inline: true },
                { name: 'Team Bravo', value: team2.map(id => `<@${id}>`).join('\n'), inline: true },
                { name: 'Map/Mode', value: gameMode.name, inline: false }
            )
            .setImage('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2J5YjB6YjB6YjB6YjB6YjB6LzM/3o7TKr3nzbh5WgCF8I/giphy.gif') // Placeholder sci-fi gif
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }

    async announceMatchResult(match, gameMode, winnerTeam, mvpId) {
        const channel = await this.getChannel(gameMode.guild_id);
        if (!channel) return;

        const winners = await this.client.supabase
            .from('match_players')
            .select('user_id')
            .eq('match_id', match.id)
            .eq('team', winnerTeam);

        const winnerIds = winners.data.map(w => w.user_id);

        const embed = new EmbedBuilder()
            .setTitle('MISSION COMPLETE')
            .setDescription(`**Match #${match.id}** has concluded.`)
            .setColor(winnerTeam === 1 ? '#00ffff' : '#ff00ff') // Cyan vs Magenta
            .addFields(
                { name: 'Victor', value: `Team ${winnerTeam === 1 ? 'Alpha' : 'Bravo'}`, inline: true },
                { name: 'MVP', value: mvpId ? `<@${mvpId}>` : 'N/A', inline: true },
                { name: 'Roster', value: winnerIds.map(id => `<@${id}>`).join(', '), inline: false }
            )
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    }
}

module.exports = AnnouncementManager;
