const DISCORD_API_BASE = 'https://discord.com/api/v10';

export interface DiscordChannel {
    id: string;
    name: string;
    type: number;
}

// Channel Types: 0 = GUILD_TEXT, 5 = GUILD_ANNOUNCEMENT
const ALLOWED_CHANNEL_TYPES = [0, 5];

export async function getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        console.error('[DiscordChannels] DISCORD_BOT_TOKEN not configured');
        return [];
    }

    try {
        const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
            headers: {
                Authorization: `Bot ${token}`,
            },
            next: { revalidate: 60 }, // Cache for 60s
        });

        if (!res.ok) {
            console.error(`[DiscordChannels] Failed to fetch channels: ${res.status} ${res.statusText}`);
            return [];
        }

        const channels: DiscordChannel[] = await res.json();

        // Filter for Text and Announcement channels
        return channels
            .filter(ch => ALLOWED_CHANNEL_TYPES.includes(ch.type))
            .map(ch => ({
                id: ch.id,
                name: ch.name,
                type: ch.type
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
        console.error('[DiscordChannels] Exception fetching channels:', error);
        return [];
    }
}
