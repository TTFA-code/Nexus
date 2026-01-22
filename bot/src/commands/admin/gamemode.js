const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gamemode')
        .setDescription('Manage game modes')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new game mode')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name of the game mode')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('team_size')
                        .setDescription('Team size (e.g. 5 for 5v5)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('update')
                .setDescription('Update a game mode')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the game mode')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('voice_enabled')
                        .setDescription('Enable/Disable Voice Channels')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('team_size')
                        .setDescription('New Team Size')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a game mode')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the game mode to delete')
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const supabase = interaction.client.supabase;
        const guildId = interaction.guild.id;

        if (subcommand === 'create') {
            const name = interaction.options.getString('name');
            const teamSize = interaction.options.getInteger('team_size');

            await interaction.deferReply();

            let { data, error } = await supabase
                .from('game_modes')
                .insert({
                    guild_id: guildId,
                    name: name,
                    team_size: teamSize,
                    picking_method: 'RANDOM', // Default
                    voice_enabled: true,      // Default
                    is_active: true           // Default
                })
                .select();

            // Self-healing: If guild is missing (FK violation), register it and retry
            if (error && error.code === '23503') {
                console.log(`[GameMode] Guild ${guildId} missing from DB. Attempting to register...`);

                const { error: guildError } = await supabase
                    .from('clubs')
                    .upsert({
                        guild_id: guildId,
                        name: interaction.guild.name,
                        premium_tier: 0
                    });

                if (!guildError) {
                    console.log(`[GameMode] Successfully registered guild ${guildId}. Retrying game mode creation...`);
                    // Retry the game mode creation
                    const retryResult = await supabase
                        .from('game_modes')
                        .insert({
                            guild_id: guildId,
                            name: name,
                            team_size: teamSize,
                            picking_method: 'RANDOM',
                            voice_enabled: true,
                            is_active: true
                        })
                        .select();

                    data = retryResult.data;
                    error = retryResult.error;
                } else {
                    console.error(`[GameMode] Failed to auto-register guild: ${guildError.message}`);
                }
            }

            if (error) {
                console.error(error);
                return interaction.editReply(`❌ Failed to create game mode: ${error.message}`);
            }

            const embed = new EmbedBuilder()
                .setTitle('Game Mode Created')
                .setDescription(`Successfully created game mode **${name}** (ID: ${data[0].id})`)
                .addFields(
                    { name: 'Team Size', value: `${teamSize}`, inline: true },
                    { name: 'Picking Method', value: 'RANDOM', inline: true }
                )
                .setColor(0x00FF00);

            await interaction.editReply({ embeds: [embed] });

        } else if (subcommand === 'list') {
            await interaction.deferReply();

            const { data: gameModes, error } = await supabase
                .from('game_modes')
                .select('*')
                .eq('guild_id', guildId)
                .order('id', { ascending: true });

            if (error) {
                console.error(error);
                return interaction.editReply('❌ Failed to fetch game modes.');
            }

            if (!gameModes || gameModes.length === 0) {
                return interaction.editReply('No game modes found. Create one with `/gamemode create`.');
            }

            const embed = new EmbedBuilder()
                .setTitle('Game Modes')
                .setColor(0x0099FF);

            const description = gameModes.map(gm =>
                `**ID: ${gm.id}** | **${gm.name}** | ${gm.team_size}v${gm.team_size} | ${gm.picking_method}`
            ).join('\n');

            embed.setDescription(description);

            await interaction.editReply({ embeds: [embed] });

        } else if (subcommand === 'delete') {
            const id = interaction.options.getInteger('id');

            await interaction.deferReply();

            // First check if it belongs to this guild
            const { data: existing } = await supabase
                .from('game_modes')
                .select('id')
                .eq('id', id)
                .eq('guild_id', guildId)
                .single();

            if (!existing) {
                return interaction.editReply(`❌ Game mode with ID ${id} not found in this server.`);
            }

            const { error } = await supabase
                .from('game_modes')
                .delete()
                .eq('id', id);

            if (error) {
                console.error(error);
                return interaction.editReply(`❌ Failed to delete game mode: ${error.message}`);
            }

            await interaction.editReply(`✅ Successfully deleted game mode ID ${id}.`);

        } else if (subcommand === 'update') {
            const id = interaction.options.getInteger('id');
            const voiceEnabled = interaction.options.getBoolean('voice_enabled');
            const teamSize = interaction.options.getInteger('team_size');

            if (voiceEnabled === null && teamSize === null) {
                return interaction.reply({ content: '❌ You must provide at least one setting to update.', ephemeral: true });
            }

            await interaction.deferReply();

            // Build update object dynamically
            const updates = {};
            if (voiceEnabled !== null) updates.voice_enabled = voiceEnabled;
            if (teamSize !== null) updates.team_size = teamSize;

            const { data, error } = await supabase
                .from('game_modes')
                .update(updates)
                .eq('id', id)
                .eq('guild_id', guildId)
                .select()
                .single();

            if (error) {
                console.error(error);
                return interaction.editReply(`❌ Failed to update game mode: ${error.message}`);
            }

            if (!data) {
                return interaction.editReply(`❌ Game mode #${id} not found.`);
            }

            await interaction.editReply({
                content: `✅ Game Mode **${data.name}** updated!`,
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`**Voice Enabled:** ${data.voice_enabled}\n**Team Size:** ${data.team_size}`)
                        .setColor(0x00FF00)
                ]
            });
        }
    },
};
