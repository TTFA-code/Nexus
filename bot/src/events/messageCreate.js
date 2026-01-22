const { Events } = require('discord.js');
const { ShimmedInteraction, ShimmedOptions } = require('../utility/interactionShim');
const config = require('../config');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bots
        if (message.author.bot) return;

        // Check prefix
        // console.log(`[DEBUG] Message received: ${message.content}`);
        if (!message.content.startsWith(config.prefix)) return;

        // Parse command and args
        // e.g. "!queue join Valorant" -> command="queue", args=["join", "Valorant"]
        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase(); // "queue"

        const client = message.client;
        const command = client.commands.get(commandName);

        if (!command) return;

        // Create Shim
        const interaction = new ShimmedInteraction(message, client);
        interaction.commandName = commandName;
        interaction.options = new ShimmedOptions(args);

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await message.channel.send('There was an error while executing this command!');
        }
    },
};
