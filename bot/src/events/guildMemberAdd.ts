
import { Events, GuildMember } from 'discord.js';
import { syncMemberToDatabase } from '../utility/memberSync';

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member: GuildMember) {
        console.log(`[MemberJoin] User ${member.user.tag} joined guild ${member.guild.name}. Syncing...`);
        const supabase = member.client.supabase;

        await syncMemberToDatabase(supabase, member.guild.id, member.user.id);
    },
};
