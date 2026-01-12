const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            const { customId } = interaction;
            const matchmaker = interaction.client.systems.matchmaker;
            const supabase = interaction.client.supabase;
            const guildId = interaction.guild.id;
            const userId = interaction.user.id;

            if (customId === 'join_queue') {
                await interaction.deferReply({ ephemeral: true });

                // Fetch the default (first) game mode for the guild since CustomID doesn't carry ID
                // In a more advanced version, we might encode ID in CustomID.
                const { data: gameMode, error } = await supabase
                    .from('game_modes')
                    .select('name')
                    .eq('guild_id', guildId)
                    .limit(1)
                    .single();

                if (error || !gameMode) {
                    return interaction.editReply('❌ No game mode found to join.');
                }

                const result = await matchmaker.addPlayerToQueue(guildId, userId, gameMode.name);

                if (result.success) {
                    await interaction.editReply({ content: '✅ You have joined the queue! Waiting for opponent...' });
                } else {
                    await interaction.editReply({ content: `❌ ${result.message}` });
                }

            } else if (customId === 'leave_queue') {
                await interaction.deferReply({ ephemeral: true });

                const result = await matchmaker.removePlayerFromQueue(userId, guildId);

                if (result.success) {
                    await interaction.editReply({ content: '👋 You have left the queue.' });
                } else {
                    await interaction.editReply({ content: `❌ ${result.message}` });
                }

            } else if (customId === 'my_stats') {
                await interaction.deferReply({ ephemeral: true });

                const { data: ratings, error } = await supabase
                    .from('player_ratings')
                    .select('*')
                    .eq('user_id', userId);

                if (error || !ratings || ratings.length === 0) {
                    return interaction.editReply('📈 Your MMR: 1200 | Wins: 0 | Losses: 0');
                }

                const rating = ratings[0];
                await interaction.editReply(`📈 Your MMR: ${rating.mmr} | Wins: ${rating.wins} | Losses: ${rating.losses}`);

            } else if (customId.startsWith('ready_accept_') || customId.startsWith('ready_decline_')) {
                const parts = customId.split('_');
                // ready_accept_123 -> ['ready', 'accept', '123']
                const action = parts[1];
                const lobbyId = parts[2];

                await interaction.client.systems.readyCheck.handleResponse(interaction, lobbyId, action);
            }
        }
    },
};
