'use server';

import { createClient } from '@/utils/supabase/server';
import { getDiscordPermissions, getGuildRoles, getGuildOwner } from '@/utils/discord/permissions';

import { createAdminClient } from '@/utils/supabase/admin';

export async function syncUserPermissions(guildId: string): Promise<{ success: boolean, message?: string, role?: string }> {
    const supabase = await createClient(); // Keep for Auth Session
    const adminDb = createAdminClient(); // Service Role for Upsert

    if (!adminDb) {
        console.warn('[AuthActions] Service Role Key missing. Skipping permission sync.');
        return { success: false, message: "System Error: Service Role Key missing. Check server logs." };
    }

    // 1. Get Session & Token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.provider_token) {
        return { success: false, message: "Unauthorized: No session or provider token." };
    }
    const user = session.user;

    // 2. Fetch Data
    const [member, guildRoles, ownerId] = await Promise.all([
        getDiscordPermissions(guildId, session.provider_token),
        getGuildRoles(guildId),
        getGuildOwner(guildId)
    ]);

    // Handle Graceful Failure (User not in guild or didn't grant access)
    // If member is null, we STILL generally want to ensure they are recorded as a player if they are interacting?
    // But if we can't verify them, maybe strictly return?
    // The previous logic returned. The prompt doesn't explicitly say to change this behavior, 
    // just "Authorize if...". If we can't fetch member, we can't authorize.
    if (!member) {
        // Only if we REALLY can't verify anything. 
        // But what if they are Owner but not in guild (impossible)?
        // If fetch failed, we can't sync.
        return { success: false, message: "Could not verify Discord membership." };
    }

    // 3. Determine Role (PURE BADGE PROTOCOL)
    // "One Role to Rule Them All" - No Owner/Bitmask overrides.
    let role = 'player';

    // We need to map role IDs from member.roles to names in guildRoles
    const nexusAdminRole = guildRoles.find(r =>
        r.name.toLowerCase() === 'nexus-admin' ||
        r.name.toLowerCase() === 'nexus admin'
    );

    if (nexusAdminRole && member.roles.includes(nexusAdminRole.id)) {
        role = 'nexus-admin';
    }

    // 4. Upsert with Service Role
    try {
        const discordIdentity = user.identities?.find(i => i.provider === 'discord');
        const discordId = discordIdentity?.id;

        if (!discordId) {
            console.error('[AuthActions] No Discord Identity found for user:', user.id);
            return { success: false, message: "No Discord Identity found." };
        }

        const { error } = await adminDb
            .from('server_members')
            .upsert({
                user_id: discordId, // Use Discord ID (Text)
                guild_id: guildId,
                role: role
            }, { onConflict: 'user_id,guild_id' });

        if (error) {
            console.error('[AuthActions] Failed to upsert server_member:', error);
            return { success: false, message: "Database sync failed." };
        } else {
            console.log(`[Auth Success] Service Role successfully provisioned @nexus-admin pass for user: ${discordId} (UUID: ${user.id})`);
            return { success: true, message: `Synced as ${role}`, role };
        }
    } catch (err) {
        console.error('[AuthActions] DB Error:', err);
        return { success: false, message: "Internal Server Error during sync." };
    }
}

export async function disconnectAdmin(guildId: string): Promise<{ success: boolean, message?: string }> {
    const supabase = await createClient();
    const adminDb = createAdminClient();

    if (!adminDb) return { success: false, message: "System Error: Service Role Key missing." };

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { success: false, message: "Unauthorized" };

    try {
        const discordIdentity = session.user.identities?.find(i => i.provider === 'discord');
        const discordId = discordIdentity?.id;

        if (!discordId) return { success: false, message: "No Discord ID found" };

        const { error } = await adminDb
            .from('server_members')
            .update({ role: 'player' })
            .eq('user_id', discordId)
            .eq('guild_id', guildId);

        if (error) {
            console.error('[AuthActions] Failed to disconnect admin:', error);
            return { success: false, message: "Database update failed." };
        }

        return { success: true, message: "Server disconnected." };
    } catch (err: any) {
        console.error('[AuthActions] Disconnect Error:', err);
        return { success: false, message: "Internal Error" };
    }
}
