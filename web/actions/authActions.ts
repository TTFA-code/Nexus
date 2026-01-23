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
        const discordId = String(discordIdentity?.id); // Strict String Cast

        if (!discordId || discordId === 'undefined') {
            console.error('[AuthActions] No Discord Identity found for user:', user.id);
            return { success: false, message: "No Discord Identity found." };
        }

        console.log('[AuthActions] Syncing with Service Role...');

        // STEP A: Ensure Player Exists First
        // We upsert the player to ensure the Foreign Key in server_members will satisfy
        const { error: playerError } = await adminDb
            .from('players')
            .upsert({
                user_id: discordId,
                uuid_link: String(user.id), // Link Supabase Auth UUID
                // We could sync avatar/username here too if we have it from metadata
                username: user.user_metadata?.full_name || user.user_metadata?.name || 'Unknown',
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
            }, { onConflict: 'user_id' });

        if (playerError) {
            console.error('[AuthActions] Failed to upsert player record:', playerError.message, playerError.hint);
            return { success: false, message: `Database Sync Failed (Player): ${playerError.message}` };
        }

        // STEP B: Upsert Server Member
        const { error: memberError } = await adminDb
            .from('server_members')
            .upsert({
                user_id: discordId,
                guild_id: String(guildId), // Strict String Cast
                role: role
            }, { onConflict: 'user_id,guild_id' });

        if (memberError) {
            console.error('[AuthActions] Failed to upsert server_member:', memberError.message, memberError.hint);
            return { success: false, message: `Database Sync Failed (Member): ${memberError.message}` };
        } else {
            console.log(`[Auth Success] Service Role successfully provisioned @nexus-admin pass for user: ${discordId} (UUID: ${user.id})`);
            return { success: true, message: `Synced as ${role}`, role };
        }
    } catch (err: any) {
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
