const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

class ReadyCheckManager {
    constructor(client) {
        this.client = client;
        this.supabase = client.supabase;
    }

    async createLobby(gameMode, players) {
        const guildId = gameMode.guild_id;

        // 1. Create Lobby in DB
        const { data: lobby, error } = await this.supabase
            .from('lobbies')
            .insert({
                game_mode_id: gameMode.id,
                guild_id: guildId,
                status: 'ready_check',
                expires_at: new Date(Date.now() + 60000).toISOString() // 60s
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating lobby:', error);
            return;
        }

        // 2. Add Players to Lobby
        const lobbyPlayers = players.map(p => ({
            lobby_id: lobby.id,
            user_id: p,
            status: 'pending'
        }));

        await this.supabase.from('lobby_players').insert(lobbyPlayers);

        // 3. Send Ready Check Message
        const guild = this.client.guilds.cache.get(guildId);
        // Find a channel to post in. Ideally configured, defaulting to system channel or first text channel
        const channelId = this.client.config?.match_channel_id || guild.systemChannelId;
        const channel = guild.channels.cache.get(channelId);

        if (!channel) {
            console.error('No match channel found for ready check.');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`MATCH FOUND: ${gameMode.name}`)
            .setDescription(`**${players.length} Pilots Selected.**\n\nInitialize systems? You have 60 seconds.`)
            .setColor('#ccff00')
            .addFields(
                { name: 'Status', value: `0/${players.length} Ready` }
            );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`ready_accept_${lobby.id}`)
                    .setLabel('ACCEPT MISSION')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`ready_decline_${lobby.id}`)
                    .setLabel('DECLINE')
                    .setStyle(ButtonStyle.Danger)
            );

        const message = await channel.send({
            content: players.map(p => `<@${p}>`).join(' '), // Ping players
            embeds: [embed],
            components: [row]
        });

        // Update DB with message ID for tracking
        await this.supabase
            .from('lobbies')
            .update({ message_id: message.id, channel_id: channel.id })
            .eq('id', lobby.id);

        // 4. Start Timer
        setTimeout(() => this.finalizeLobby(lobby.id), 60000);
    }

    async handleResponse(interaction, lobbyId, action) {
        const userId = interaction.user.id;

        // Verify user is in this lobby
        const { data: player } = await this.supabase
            .from('lobby_players')
            .select('*')
            .eq('lobby_id', lobbyId)
            .eq('user_id', userId)
            .single();

        if (!player) {
            return interaction.reply({ content: 'You are not part of this operation.', ephemeral: true });
        }

        if (player.status !== 'pending') {
            return interaction.reply({ content: `You have already ${player.status} this match.`, ephemeral: true });
        }

        // Update Status
        await this.supabase
            .from('lobby_players')
            .update({ status: action === 'accept' ? 'accepted' : 'declined' })
            .eq('lobby_id', lobbyId)
            .eq('user_id', userId);

        await interaction.deferUpdate(); // Acknowledge button press

        // Check if everyone responded
        this.checkLobbyStatus(lobbyId, interaction.message);
    }

    async checkLobbyStatus(lobbyId, message) {
        const { data: players } = await this.supabase
            .from('lobby_players')
            .select('*')
            .eq('lobby_id', lobbyId);

        const accepted = players.filter(p => p.status === 'accepted').length;
        const declined = players.filter(p => p.status === 'declined').length;
        const total = players.length;

        // Update Embed
        const embed = EmbedBuilder.from(message.embeds[0]);
        embed.setFields([{ name: 'Status', value: `${accepted}/${total} Ready` }]);

        if (declined > 0) {
            // Early fail if someone declines
            this.cancelLobby(lobbyId, 'Player declined.');
            // Note: In real implementation we'd trigger cancelLobby logic immediately
        }

        if (accepted === total) {
            // Start Match!
            this.startMatchFromLobby(lobbyId);
        } else {
            // Just update message
            await message.edit({ embeds: [embed] });
        }
    }

    async finalizeLobby(lobbyId) {
        // Called by timer. Check if complete.
        const { data: lobby } = await this.supabase
            .from('lobbies')
            .select('status')
            .eq('id', lobbyId)
            .single();

        if (lobby.status !== 'ready_check') return; // Already handled

        // Timeout logic
        this.cancelLobby(lobbyId, 'Ready check timed out.');
    }

    async cancelLobby(lobbyId, reason) {
        const { data: lobby } = await this.supabase
            .from('lobbies')
            .update({ status: 'failed' })
            .eq('id', lobbyId)
            .select()
            .single();

        if (!lobby) return;

        // Fetch channel and message to update
        try {
            const channel = await this.client.channels.fetch(lobby.channel_id);
            const message = await channel.messages.fetch(lobby.message_id);

            const embed = EmbedBuilder.from(message.embeds[0]);
            embed.setTitle('MISSION ABORTED')
                .setDescription(`Reason: ${reason}\n\nReturning accepted pilots to queue...`)
                .setColor('#ff3333');

            await message.edit({ embeds: [embed], components: [] });

            // Re-queue logic would go here (update `queues` table)
            // For now, users just have to join again.

        } catch (e) {
            console.error('Error updating lobby message:', e);
        }
    }

    async startMatchFromLobby(lobbyId) {
        const { data: lobby } = await this.supabase
            .from('lobbies')
            .update({ status: 'converted_to_match' })
            .eq('id', lobbyId)
            .select('*, game_modes(*)')
            .single();

        if (!lobby) return;

        const { data: players } = await this.supabase
            .from('lobby_players')
            .select('user_id')
            .eq('lobby_id', lobbyId)
            .eq('status', 'accepted');

        // Use the existing Matchmaker logic to actually create the match
        // But we bypass the queue check since we have the players.
        // We need to call `matchmaker.createMatch` but modify it to accept a player list, 
        // OR add a new method `createMatchFromList`.

        // Ideally, we import matchmaker or access it via client
        this.client.systems.matchmaker.createMatchFromList(lobby.game_modes, players.map(p => p.user_id));

        // Update Discord Message
        try {
            const channel = await this.client.channels.fetch(lobby.channel_id);
            const message = await channel.messages.fetch(lobby.message_id);
            await message.delete(); // Or update to "MATCH STARTED"
        } catch (e) { }
    }
}

module.exports = ReadyCheckManager;
