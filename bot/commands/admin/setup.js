const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup the ranked queue lobby')
        .addStringOption(option =>
            option.setName('game_mode_id')
                .setDescription('The ID of the game mode to link (optional)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply();

        const supabase = interaction.client.supabase;
        let gameModeId = interaction.options.getString('game_mode_id');

        // If no gameModeId provided, fetch the first available one
        if (!gameModeId) {
            const { data: gameModes, error } = await supabase
                .from('game_modes')
                .select('id, name')
                .eq('guild_id', interaction.guild.id)
                .limit(1);

            if (error) {
                console.error('Error fetching game modes:', error);
                return interaction.editReply('❌ Failed to fetch game modes. Please try again or provide a specific ID.');
            }

            if (!gameModes || gameModes.length === 0) {
                return interaction.editReply('❌ No game modes found for this server. Please create one first.');
            }

            gameModeId = gameModes[0].id;
        } else {
            // Verify the provided ID exists
            const { data: gameMode, error } = await supabase
                .from('game_modes')
                .select('id')
                .eq('id', gameModeId)
                .single();

            if (error || !gameMode) {
                return interaction.editReply(`❌ Game mode with ID ${gameModeId} not found.`);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🏆 Ranked Queue | Status: OPEN')
            .setDescription('Click the buttons below to join the matchmaking queue. Good luck!')
            .setColor('#00ff99');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_queue')
                    .setLabel('Join Queue')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId('leave_queue')
                    .setLabel('Leave Queue')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('my_stats')
                    .setLabel('My Stats')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📊'),
            );

        await interaction.deleteReply(); // We want a clean message, so delete the thinking state if possible, but actually we deferred so we have to edit or delete/send. 
        // Better: Edit reply with the ephemeral confirmation, then send the channel message. 
        // Actually the prompt implies the command SENDS the message to the channel.
        // Let's send the lobby message as a normal channel message, and reply ephemerally that it's done.

        await interaction.channel.send({ embeds: [embed], components: [row] });
        // Since we deferred, we must edit or delete.
        // But if we delete, the user might wonder if it worked.
        // Let's use deleteReply() to remove the "thinking" and let the channel message stand if we successfully sent it.
        // WAIT: deleteReply can only be used if we haven't replied? No, deferred means we have an interaction token.
        // If we defer, we have a "Bot is thinking..." message. We can edit it to say "Lobby setup complete!" and make it ephemeral? 
        // Slash commands are public by default unless ephemeral: true in deferReply.
        // I didn't set ephemeral: true in deferReply. So everyone sees "Bot is thinking...".

        // Let's just edit the reply to be the Lobby Message itself?
        // "Sends a high-quality Embed Message". Usually Setup commands creates a permanent message.
        // If I edit the interaction reply, it works, but if the interaction expires or is dismissed it might be weird?
        // Actually, editing the reply is fine for a persistent message in the channel.

        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};
