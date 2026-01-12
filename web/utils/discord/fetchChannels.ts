import { unstable_cache } from "next/cache";

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export interface DiscordChannel {
    id: string;
    name: string;
    type: number;
}

// Channel Types: 0 = GUILD_TEXT, 5 = GUILD_ANNOUNCEMENT
const ALLOWED_CHANNEL_TYPES = [0, 5];

async function fetchChannels(guildId: string): Promise<DiscordChannel[]> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        console.error("DISCORD_BOT_TOKEN missing");
        return [];
    }

    try {
        // 2. Fetch Channels
        const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
            headers: {
                Authorization: `Bot ${token}`,
            },
            next: { revalidate: 60 } // Cache for 60s as requested
        });

        if (!res.ok) {
            console.error(`[FetchChannels] Failed to fetch channels: ${res.statusText}`);
            return [];
        }

        const channels: DiscordChannel[] = await res.json();

        // 3. Filter & Map
        return channels
            .filter(c => ALLOWED_CHANNEL_TYPES.includes(c.type))
            .map(c => ({
                id: c.id,
                name: c.name,
                type: c.type
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

    } catch (error) {
        console.error("[FetchChannels] Error:", error);
        return [];
    }
}

export const getGuildChannels = unstable_cache(
    async (guildId: string) => fetchChannels(guildId),
    ['guild-channels'],
    {
        revalidate: 60,
        tags: ['discord-channels']
    }
);
