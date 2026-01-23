import { createClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

interface DiscordMember {
    user: {
        id: string;
        username: string;
        discriminator: string;
    };
    roles: string[];
}

interface DiscordRole {
    id: string;
    name: string;
    permissions: string;
}

interface DiscordGuild {
    owner_id: string;
}

async function getDiscordMember(guildId: string, userId: string): Promise<DiscordMember | null> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error('DISCORD_BOT_TOKEN not configured');

    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}`, {
        headers: {
            Authorization: `Bot ${token}`,
        },
        next: { revalidate: 300 }, // Cache for 5 mins
    });

    if (!res.ok) {
        console.error(`Failed to fetch member ${userId} in guild ${guildId}: ${res.statusText}`);
        return null;
    }

    return res.json();
}

async function getGuildRoles(guildId: string): Promise<DiscordRole[]> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error('DISCORD_BOT_TOKEN not configured');

    try {
        const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, {
            headers: {
                Authorization: `Bot ${token}`,
            },
            next: { revalidate: 300 }, // Cache for 5 mins
        });

        if (!res.ok) {
            console.error(`Failed to fetch roles for guild ${guildId}: ${res.statusText}`);
            return [];
        }

        return res.json();
    } catch (error) {
        console.error(`Error fetching guild roles: ${error}`);
        return [];
    }
}

async function getGuild(guildId: string): Promise<DiscordGuild | null> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error('DISCORD_BOT_TOKEN not configured');

    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}`, {
        headers: {
            Authorization: `Bot ${token}`,
        },
        next: { revalidate: 300 }, // Cache for 5 mins
    });

    if (!res.ok) {
        // It's possible the bot isn't in the guild, or other error
        console.error(`Failed to fetch guild ${guildId}: ${res.statusText}`);
        return null;
    }

    return res.json();
}


async function checkAdminStatus(guildId: string, discordUserId: string): Promise<boolean> {
    // 1. Fetch data in parallel
    const [member, roles, guild] = await Promise.all([
        getDiscordMember(guildId, discordUserId),
        getGuildRoles(guildId),
        getGuild(guildId)
    ]);

    if (!member || !guild) {
        console.warn(`[Gatekeeper] Check failed: Member or Guild not found (Guild: ${guildId}, User: ${discordUserId})`);
        return false;
    }

    // 2. (REMOVED) Check Owner - PURE BADGE PROTOCOL
    // Owner status no longer grants admin access. Must have @nexus-admin role.

    // 3. (REMOVED) Filter Roles
    const userRoles = roles.filter(r => member.roles.includes(r.id));

    // 4. Check "Nexus Admin" role Name
    const hasNexusAdminRole = userRoles.some(r =>
        r.name.toLowerCase() === 'nexus-admin' ||
        r.name.toLowerCase() === 'nexus admin'
    );

    if (hasNexusAdminRole) return true;

    return false;
}

// 1. This function handles ONLY the Discord API (Cachable)
const getDiscordStatus = unstable_cache(
    async (guildId: string, discordId: string) => {
        // Reuse existing check logic
        return await checkAdminStatus(guildId, discordId);
    },
    ['discord-admin-check'], // User-provided key
    {
        revalidate: 300,
        tags: ['admin-check']
    }
);

// 2. This function handles the User Session (Dynamic)
// ... (Keep imports and helpers if needed, but verifyNexusAdmin is main target)

// 2. This function handles the User Session (Dynamic)
export async function verifyNexusAdmin(guildId: string): Promise<{ isAuthorized: boolean; reason?: string }> {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        console.log('Gatekeeper: No Supabase user found');
        return { isAuthorized: false, reason: "No User Session" };
    }

    // EMERGENCY BYPASS (Keep this for Local Dev if needed, strictly for Guild 547362530826125313 if strictness is required? 
    // The prompt asked for "Iron Clad". I will remove implicit bypasses unless documented.
    // The user rules did NOT mention bypassing. I will stick to DB logic.

    try {
        // Query server_members
        console.log('Checking member role for:', { userId: user.id, guildId })
        const { data: member, error: dbError } = await supabase
            .from('server_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('guild_id', guildId)
            .single();

        if (dbError || !member) {
            console.warn(`[Gatekeeper] Access Denied: User ${user.id} not found in guild ${guildId} members.`);
            return { isAuthorized: false, reason: "Not a Guild Member" };
        }

        console.log("[Gatekeeper] Role found in DB:", member.role);
        const allowedRoles = ['nexus-admin'];
        if (allowedRoles.includes(member.role)) {
            console.log(`[Gatekeeper] Access Granted: User ${user.id} is ${member.role}`);
            return { isAuthorized: true };
        }

        return { isAuthorized: false, reason: `Insufficient Role: ${member.role}` };

    } catch (err) {
        console.error('Gatekeeper DB Error:', err);
        return { isAuthorized: false, reason: "System Error" };
    }
}
