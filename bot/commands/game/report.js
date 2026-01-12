const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report the result of a match')
        .addIntegerOption(option =>
            option.setName('match_id')
                .setDescription('The ID of the match')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('winner')
                .setDescription('The winning team (1 or 2)')
                .setRequired(true)
                .addChoices(
                    { name: 'Team 1', value: 1 },
                    { name: 'Team 2', value: 2 }
                ))
        .addUserOption(option =>
            option.setName('mvp')
                .setDescription('The MVP of the match (optional)')
                .setRequired(false)),
    async execute(interaction) {
        const matchId = interaction.options.getInteger('match_id');
        const mvp = interaction.options.getUser('mvp');
        const mmrSystem = interaction.client.systems.mmr;

        await interaction.deferReply();

        const result = await mmrSystem.processMatchResult(matchId, winner, mvp ? mvp.id : null);

        if (result.success) {
            const embed = new EmbedBuilder()
                .setTitle('Match Reported')
                .setDescription(result.message)
                .addFields(
                    { name: 'Winner MMR Change', value: result.changes.winnerChange, inline: true },
                    { name: 'Loser MMR Change', value: result.changes.loserChange, inline: true }
                )
                .setColor(0x00FF00); // Green

            await interaction.editReply({ embeds: [embed] });
        } else {
            await interaction.editReply({ content: `❌ ${result.message}` });
        }
    },
};
