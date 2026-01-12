const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('club')
        .setDescription('Manage club settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View current club settings'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-premium')
                .setDescription('Set the premium tier for the club')
                .addIntegerOption(option =>
                    option.setName('tier')
                        .setDescription('Premium Tier (0=Free, 1=Pro)')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Free', value: 0 },
                            { name: 'Pro', value: 1 }
                        ))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const supabase = interaction.client.supabase;
        const guildId = interaction.guild.id;

        if (subcommand === 'info') {
            await interaction.deferReply();

            const { data: club, error } = await supabase
                .from('clubs')
                .select('*')
                .eq('guild_id', guildId)
                .single();

            if (error) {
                console.error(error);
                return interaction.editReply('❌ Failed to fetch club info.');
            }

            if (!club) {
                // Auto-register if missing (similar to gamemode logic)
                await supabase.from('clubs').upsert({
                    guild_id: guildId,
                    name: interaction.guild.name,
                    premium_tier: 0
                });
                return interaction.editReply('🆕 Club registered! Run the command again to see info.');
            }

            const embed = new EmbedBuilder()
                .setTitle(`Club Info: ${club.name}`)
                .addFields(
                    { name: 'Premium Tier', value: club.premium_tier === 1 ? '🌟 Pro' : 'Free', inline: true },
                    { name: 'Registered At', value: new Date(club.created_at).toLocaleDateString(), inline: true }
                )
                .setColor(club.premium_tier === 1 ? 0xFFD700 : 0x0099FF);

            await interaction.editReply({ embeds: [embed] });

        } else if (subcommand === 'set-premium') {
            const tier = interaction.options.getInteger('tier');

            await interaction.deferReply({ ephemeral: true });

            const { error } = await supabase
                .from('clubs')
                .update({ premium_tier: tier })
                .eq('guild_id', guildId);

            if (error) {
                console.error(error);
                return interaction.editReply(`❌ Failed to update premium tier: ${error.message}`);
            }

            await interaction.editReply(`✅ Club premium tier set to **${tier === 1 ? 'Pro' : 'Free'}**.`);
        }
    },
};
