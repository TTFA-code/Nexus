const { EmbedBuilder } = require('discord.js');

class ShimmedOptions {
    constructor(args, schema) {
        this.args = args;
        this.schema = schema || {}; // Not fully used yet, but good for future expansion
    }

    getSubcommand() {
        // Simple logic: if the first arg matches a known subcommand structure, return it.
        // For now, we assume the command handler strips the main command name.
        // e.g. !queue join -> args=['join']
        return this.args[0] || null;
    }

    getString(name) {
        // This is a naive implementation. 
        // Real slash commands use named options. Message commands use positional.
        // We really need a mapping strategy.
        // For 'queue join [mode]', mode is index 1 (index 0 is subcommand).

        // This shim assumes specific command knowledge or simple positional mapping.
        // To make this generic is hard without the command definition.
        // We will pass the commandData to the ShimmedInteraction to help.

        // Quick dirty fix for current known commands:
        if (name === 'mode') {
            // For `queue join <mode>`, mode is the second argument (index 1) if index 0 is subcommand
            return this.args[1];
        }
        return this.args.find(arg => arg !== this.args[0]); // Fallback
    }

    getUser(name) {
        // Extract user ID from mention <@!123456789>
        const mention = this.args.find(arg => arg.startsWith('<@') && arg.endsWith('>'));
        if (mention) {
            const id = mention.replace(/[<@!>]/g, '');
            return { id: id, toString: () => `<@${id}>` };
        }
        return null;
    }
}

class ShimmedInteraction {
    constructor(message, client) {
        this.message = message;
        this.client = client;
        this.user = message.author;
        this.guild = message.guild;
        this.channel = message.channel;
        this.replied = false;
        this.deferred = false;

        // This will be set by the handler before executing
        this.commandName = '';
        this.options = null; // Will be instance of ShimmedOptions
    }

    isChatInputCommand() { return true; }
    isButton() { return false; }

    async reply(options) {
        this.replied = true;
        return await this.message.channel.send(options);
    }

    async deferReply(options) {
        this.deferred = true;
        if (options && options.ephemeral) {
            // Can't really do ephemeral in text, maybe DM? 
            // For now just ignore or react
            await this.message.react('⏳');
        } else {
            await this.message.channel.sendTyping();
        }
    }

    async editReply(options) {
        // In slash commands, editReply updates the original response.
        // In text, we can't easily edit a "loading" state unless we saved the message we sent.
        // But since we didn't save the return of deferReply (which was just typing/react), we just send a new message.
        // IMPROVEMENT: If we sent a "Processing..." message in deferReply, we should edit that.

        return await this.message.channel.send(options);
    }

    async followUp(options) {
        return await this.message.channel.send(options);
    }
}

module.exports = { ShimmedInteraction, ShimmedOptions };
