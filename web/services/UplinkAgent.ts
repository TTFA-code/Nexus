
// UplinkAgent (Voice Guard)
// Verifies if a user is in a Discord voice channel.

export async function verifyUserVoice(guildId: string, userId: string): Promise<boolean> {
    const token = process.env.DISCORD_BOT_TOKEN;

    if (!token) {
        console.error('UplinkAgent: DISCORD_BOT_TOKEN is not defined');
        return false;
    }

    try {
        const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bot ${token}`,
            },
        });

        if (response.status === 404) {
            console.warn(`UplinkAgent: User ${userId} not found in guild ${guildId}`);
            return false;
        }

        if (!response.ok) {
            console.error(`UplinkAgent: Discord API error ${response.status}: ${response.statusText}`);
            const errorText = await response.text();
            console.error('Error body:', errorText);
            return false;
        }

        const data = await response.json();

        // Check for voice property as requested.
        // Note: Standard Discord Member object may not contain 'voice' or 'voice.channel_id' directly via REST
        // unless there are specific API updates or undocumented behaviors relying on specific intents/scopes?
        // We strictly follow the logic requested: "Check the voice.channel_id property in the response."

        // Safe access
        // user instruction: "Check the voice.channel_id property in the response."
        // We treat 'data' as 'any' to allow access to potentially non-standard 'voice' property.
        const member: any = data;

        if (member.voice && member.voice.channel_id) {
            return true;
        }

        // Also checking strict top-level property just in case logic meant that? No, "voice.channel_id" implies nested.
        // Assuming structure is { ...Member, voice: { channel_id: "..." } }

        return false;

    } catch (error) {
        console.error('UplinkAgent: Exception during verification', error);
        return false;
    }
}
