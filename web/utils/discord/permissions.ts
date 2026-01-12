const DISCORD_API_BASE = 'https://discord.com/api/v10';

export interface DiscordMember {
    roles: string[];
    user: {
        id: string;
        username: string;
    };
    permissions: string; // Bitmask string
    // ... other fields
}

export interface DiscordRole {
    id: string;
    name: string;
    permissions: string;
}

export async function getDiscordPermissions(guildId: string, accessToken: string, retry = false): Promise<DiscordMember | null> {
    try {
        const res = await fetch(`${DISCORD_API_BASE}/users/@me/guilds/${guildId}/member`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            next: { revalidate: 60 } // Cache for 60s
        });

        if (res.status === 429) {
            if (!retry) {
                const retryAfter = res.headers.get('Retry-After');
                const wait = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
                console.warn(`[DiscordPermissions] Rate Limited (429). Retrying in ${wait}ms...`);
                await new Promise(r => setTimeout(r, wait));
                return getDiscordPermissions(guildId, accessToken, true);
            } else {
                console.error(`[DiscordPermissions] Rate Limited (429) - Retry failed.`);
                return null;
            }
        }

        if (res.status === 403 || res.status === 401 || res.status === 404) {
            console.warn(`[DiscordPermissions] User not in guild or access denied (${res.status}). Defaulting to null (Player).`);
            return null;
        }

        if (!res.ok) {
            console.error(`[DiscordPermissions] Failed to fetch member: ${res.status} ${res.statusText}`);
            return null;
        }

        return await res.json();
    } catch (error) {
        console.error('[DiscordPermissions] Exception fetching member:', error);
        return null;
    }
}

export async function getGuildRoles(guildId: string): Promise<DiscordRole[]> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        console.error('[DiscordPermissions] DISCORD_BOT_TOKEN not configured');
        return [];
    }

    try {
        const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, {
            headers: {
                Authorization: `Bot ${token}`,
            },
            next: { revalidate: 300 }, // Cache somewhat
        });

        if (!res.ok) {
            // If 403/404, bot likely not in guild
            return [];
        }

        return await res.json();
    } catch (error) {
        console.error('[DiscordPermissions] Error fetching roles:', error);
        return [];
    }
}

export async function getGuildOwner(guildId: string): Promise<string | null> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) return null;

    try {
        const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
            headers: {
                Authorization: `Bot ${token}`,
            },
            next: { revalidate: 300 },
        });

        if (!res.ok) return null;
        const guild = await res.json();
        return guild.owner_id;

    } catch (error) {
        return null;
    }
}
