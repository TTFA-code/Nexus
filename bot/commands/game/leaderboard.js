const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the top players')
        .addStringOption(option =>
            option.setName('game_mode_id')
                .setDescription('Filter by game mode (optional)')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();
        const supabase = interaction.client.supabase;
        const guildId = interaction.guild.id;
        let gameModeId = interaction.options.getString('game_mode_id');

        // If no ID provided, try to find the "active" or "main" game mode, or just list global?
        // Actually, ratings are per game_mode. If no game_mode is specified, we might want to default to the most popular one 
        // OR ask the user to specify.
        // For better UX: If only one game mode exists, use that. If multiple, ask or show global (if feasible, but ratings are split).

        let gameModeName = 'Unknown Mode';

        if (!gameModeId) {
            const { data: modes, error } = await supabase
                .from('game_modes')
                .select('id, name')
                .eq('guild_id', guildId)
                .limit(2);

            if (modes && modes.length > 0) {
                gameModeId = modes[0].id;
                gameModeName = modes[0].name;

                // If there were multiple, maybe warn/suggest filtering?
                // For now, defaulting to the first one found is a safe bet.
            } else {
                return interaction.editReply('❌ No game modes found in this server.');
            }
        } else {
            // Verify and get name
            const { data: mode, error } = await supabase
                .from('game_modes')
                .select('name')
                .eq('id', gameModeId)
                .single();

            if (error || !mode) {
                return interaction.editReply(`❌ Game mode with ID ${gameModeId} not found.`);
            }
            gameModeName = mode.name;
        }

        // Fetch Top 10
        const { data: ratings, error } = await supabase
            .from('player_ratings')
            .select(`
                mmr,
                wins,
                losses,
                players (username)
            `)
            .eq('game_mode_id', gameModeId)
            .order('mmr', { ascending: false })
            .limit(10);

        if (error) {
            console.error(error);
            return interaction.editReply('❌ Failed to fetch leaderboard.');
        }

        if (!ratings || ratings.length === 0) {
            return interaction.editReply(`No ranked players found for **${gameModeName}** yet.`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`🏆 Leaderboard: ${gameModeName}`)
            .setColor(0xFFD700)
            .setTimestamp();

        let description = '';
        ratings.forEach((r, index) => {
            const username = r.players?.username || 'Unknown User';
            const winRate = (r.wins + r.losses) > 0
                ? Math.round((r.wins / (r.wins + r.losses)) * 100)
                : 0;

            // Emoji for top 3
            let rank = `${index + 1}.`;
            if (index === 0) rank = '🥇';
            if (index === 1) rank = '🥈';
            if (index === 2) rank = '🥉';

            description += `${rank} **${username}** - **${r.mmr}** MMR (${r.wins}W-${r.losses}L, ${winRate}%)\n`;
        });

        embed.setDescription(description);

        await interaction.editReply({ embeds: [embed] });
    },
};
