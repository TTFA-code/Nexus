const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Manage your queue status')
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Join a queue for a game mode')
                .addStringOption(option =>
                    option.setName('mode')
                        .setDescription('The name of the game mode')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Leave your current queue'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View current queues')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const matchmaker = interaction.client.systems.matchmaker;
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        if (subcommand === 'join') {
            const gameModeName = interaction.options.getString('mode');
            await interaction.deferReply({ ephemeral: true });

            const result = await matchmaker.addPlayerToQueue(guildId, userId, gameModeName);

            if (result.success) {
                await interaction.editReply({ content: result.message });
            } else {
                await interaction.editReply({ content: `❌ ${result.message}` });
            }
        } else if (subcommand === 'leave') {
            await interaction.deferReply({ ephemeral: true });

            const result = await matchmaker.removePlayerFromQueue(userId, guildId);

            if (result.success) {
                await interaction.editReply({ content: result.message });
            } else {
                await interaction.editReply({ content: `❌ ${result.message}` });
            }
        } else if (subcommand === 'status') {
            await interaction.deferReply();

            // Fetch all active queues for this guild
            const { data: queues, error } = await interaction.client.supabase
                .from('queues')
                .select('*, game_modes!inner(*)')
                .eq('game_modes.guild_id', guildId);

            if (error) {
                return interaction.editReply('Failed to fetch queue status.');
            }

            if (!queues || queues.length === 0) {
                return interaction.editReply('No active queues right now.');
            }

            // Group by game mode
            const queuesByMode = {};
            queues.forEach(q => {
                const modeName = q.game_modes.name;
                if (!queuesByMode[modeName]) queuesByMode[modeName] = 0;
                queuesByMode[modeName]++;
            });

            const embed = new EmbedBuilder()
                .setTitle('Current Queues')
                .setColor(0x0099FF);

            for (const [mode, count] of Object.entries(queuesByMode)) {
                // We could also fetch the max size here if we had it easily available in the loop
                // For now, just showing count
                embed.addFields({ name: mode, value: `${count} player(s) waiting`, inline: true });
            }

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
