
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const supabase = await createClient();
    const { data: { user: viewer } } = await supabase.auth.getUser();

    // If no viewer, we can't show shared sectors properly (or show nothing)
    // But maybe we show public ones? Requirement says "mutual". So empty if no viewer.
    if (!viewer) {
        return NextResponse.json({ sectors: [] });
    }

    const { userId } = await params;

    // 1. Get Target User's Discord ID
    // If params.userId is 'me', use viewer.id
    const targetUuid = userId === 'me' ? viewer.id : userId;

    // Fetch target user's profile to get Discord ID
    // Assuming 'players' table maps uuid -> discord_id? Or 'users' metadata?
    // Let's try fetching from auth first via admin client if possible, but we don't have service role key here usually exposed safely?
    // Actually, we can fetch from 'players' table if it exists.
    // In matchmaker.js it upserted to 'players' with just user_id.
    // Let's assume there is a 'discord_id' column or we get it from public profile.
    // For MVP, if we can't find it, we return empty.

    // NOTE: For 'me', we have viewer.user_metadata.sub or provider_id (identities)
    let targetDiscordId: string | null = null;

    if (targetUuid === viewer.id) {
        const identities = viewer.identities;
        const discordIdentity = identities?.find((i) => i.provider === 'discord');
        targetDiscordId = discordIdentity?.id || null;
    } else {
        // Look up public user profile
        // Assuming a 'profiles' or 'players' table has this info publicly accessible?
        // If not, we might be blocked on "Hide UUIDs" / Privacy.
        // But "Dossier" implies public visibility.
        // Let's query 'players' table which usually has public info.
        const { data: player, error } = await supabase
            .from('players')
            .select('user_id') // fetch the Discord ID
            .or(`user_id.eq.${targetUuid},uuid_link.eq.${targetUuid}`)
            .single();

        if (player) {
            targetDiscordId = player.user_id;
        }
    }

    if (!targetDiscordId) {
        // Fallback for simulation or if no discord ID found
        // If we are testing with mock users, we might not have real Discord IDs.
        // Return empty for now to be safe.
        return NextResponse.json({ sectors: [] });
    }

    // 2. Fetch Nexus Guilds (Guilds)
    const { data: guilds } = await supabase
        .from('guilds')
        .select('guild_id, name');

    if (!guilds || guilds.length === 0) {
        return NextResponse.json({ sectors: [] });
    }

    // 3. Check Discord Membership
    // logic: 
    // - mutual = viewer is member AND target is member
    // - joinable = target is member AND viewer is NOT member

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
        console.warn('DISCORD_BOT_TOKEN not set');
        return NextResponse.json({ sectors: [] });
    }

    // Get Viewer's Guilds (using user's provider token if available, or just intersection if we only have bot token)
    // It's hard to get Viewer's full guild list without their OAuth token.
    // Supabase Auth stores provider ID but not always the access token unless configured.
    // ALTERNATIVE: Use Bot to check Viewer membership in EACH Nexus Guild.
    // This is slower but works without extra auth scopes.

    // Prepare results
    const sectors = [];

    // We can run these in parallel
    const checks = guilds.map(async (guild) => {
        try {
            // Check Target Membership
            const targetRes = await fetch(`https://discord.com/api/v10/guilds/${guild.guild_id}/members/${targetDiscordId}`, {
                headers: { Authorization: `Bot ${botToken}` }
            });

            if (targetRes.status !== 200) return null; // Target not in this guild

            // Target IS in guild. Now check Viewer.
            // Viewer Discord ID:
            const viewerDiscordId = viewer.identities?.find((i) => i.provider === 'discord')?.id;

            let isViewerMember = false;
            if (viewerDiscordId) {
                if (targetUuid === viewer.id) {
                    isViewerMember = true; // Viewing own profile
                } else {
                    const viewerRes = await fetch(`https://discord.com/api/v10/guilds/${guild.guild_id}/members/${viewerDiscordId}`, {
                        headers: { Authorization: `Bot ${botToken}` }
                    });
                    isViewerMember = viewerRes.status === 200;
                }
            }

            return {
                id: guild.guild_id,
                name: guild.name || 'Unknown Server',
                icon: null, // icon_url removed from schema
                isMember: isViewerMember,
                inviteUrl: null // invite_url removed from schema
            };
        } catch (e) {
            console.error('Error checking guild membership', e);
            return null;
        }
    });

    const results = await Promise.all(checks);
    // Filter out nulls (where target wasn't found)
    const validSectors = results.filter((s) => s !== null);

    return NextResponse.json({ sectors: validSectors });
}
