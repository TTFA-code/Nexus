
import { Events, Interaction } from 'discord.js';
import { syncMemberToDatabase } from '../utility/memberSync';

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (!interaction.guildId || !interaction.user) return;

        // Sync on every interaction to ensure data validity
        // This acts as a self-healing mechanism for any missed join events
        const supabase = interaction.client.supabase;

        // We don't await this to avoid blocking the interaction response time
        // Fire and forget
        syncMemberToDatabase(supabase, interaction.guildId, interaction.user.id).catch(err => {
            console.error('[InteractionSync] Background sync failed:', err);
        });
    },
};
