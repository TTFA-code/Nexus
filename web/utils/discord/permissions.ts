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

// Global Helper for 429 Handling
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);

            if (res.status === 429) {
                const retryAfter = res.headers.get('Retry-After');
                // Default to 1s if header missing, else parse (header is usually in seconds)
                const waitMs = retryAfter ? (parseFloat(retryAfter) * 1000) : 1000 * (i + 1);
                console.warn(`[DiscordAPI] Rate Limited (429). Retrying in ${waitMs}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(r => setTimeout(r, waitMs));
                continue;
            }

            return res;
        } catch (e) {
            console.error('[DiscordAPI] Network Error:', e);
            if (i === retries - 1) return null; // Return null on final failure
            await new Promise(r => setTimeout(r, 1000)); // Standard backoff for network err
        }
    }
    return null;
}

export async function getDiscordPermissions(guildId: string, accessToken: string): Promise<DiscordMember | null> {
    const url = `${DISCORD_API_BASE}/users/@me/guilds/${guildId}/member`;
    const res = await fetchWithRetry(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        next: { revalidate: 60 }
    });

    if (!res) return null;

    if (res.status === 403 || res.status === 401 || res.status === 404) {
        console.warn(`[DiscordPermissions] User not in guild or access denied (${res.status}).`);
        return null; // Graceful fail
    }

    if (!res.ok) {
        console.error(`[DiscordPermissions] Failed to fetch member: ${res.status} ${res.statusText}`);
        return null;
    }

    return await res.json();
}

export async function getGuildRoles(guildId: string): Promise<DiscordRole[]> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
        console.error('[DiscordPermissions] DISCORD_BOT_TOKEN not configured');
        return [];
    }

    const url = `${DISCORD_API_BASE}/guilds/${guildId}/roles`;
    const res = await fetchWithRetry(url, {
        headers: { Authorization: `Bot ${token}` },
        next: { revalidate: 300 }
    });

    if (!res || !res.ok) {
        console.error('[DiscordPermissions] Failed to fetch roles (likely 403 or network).');
        return [];
    }

    return await res.json();
}

export async function getGuildOwner(guildId: string): Promise<string | null> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) return null;

    const url = `${DISCORD_API_BASE}/guilds/${guildId}`;
    const res = await fetchWithRetry(url, {
        headers: { Authorization: `Bot ${token}` },
        next: { revalidate: 300 }
    });

    if (!res || !res.ok) return null;
    const guild = await res.json();
    return guild.owner_id;
}
