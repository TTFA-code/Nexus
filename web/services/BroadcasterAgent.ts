
const DISCORD_API_BASE = 'https://discord.com/api/v10';
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;

// Channel ID to broadcast match start events to.
// Priority: Env Var -> Hardcoded fallback (e.g. general) -> Error/Log only
// For now, we'll try to use a specific MATCH_LOG channel, or fall back to a known channel if available.
const MATCH_LOG_CHANNEL_ID = process.env.DISCORD_MATCH_LOG_CHANNEL_ID || process.env.DISCORD_GENERAL_CHANNEL_ID;

export const BroadcasterAgent = {
    async announceLobby(lobby: any) {
        if (!BOT_TOKEN || !MATCH_LOG_CHANNEL_ID) return;

        try {
            // Resolve UUID -> Discord Snowflake
            // We use a separate direct supabase client or fetch? 
            // BroadcasterAgent is usually server-side, so we can use createClient if imported, or pass it in.
            // But here we are in a 'service' object which might be used in server actions.
            // We'll trust the user provided v_discord_sync exists.

            // Note: SentinelCore used createClient() from utils. We should probably do the same if we need DB access.
            // But BroadcasterAgent doesn't import createClient currently.
            // We'll try to rely on passed `lobby.creator` if it has the info, OR we need to fetch it.
            // If the lobby object passed has creator: { ... }, maybe it has the link? 
            // The prompt says "have it query the v_discord_sync view".

            // We need to import createClient dynamically or at top lvl if this file is server-only.
            // Assuming server-only.
            const { createClient } = await import('@/utils/supabase/server');
            const supabase = await createClient();

            const { data: syncData } = await supabase
                .from('v_discord_sync')
                .select('discord_id')
                .eq('user_id', lobby.creator_id)
                .single();

            const discordId = syncData?.discord_id;
            const ping = discordId ? `<@${discordId}>` : lobby.creator?.username || 'Operator';

            const gameName = lobby.game_modes?.games?.name || "Unknown Protocol";
            const variantName = lobby.game_modes?.name || "Standard";
            const region = lobby.region || "Global";
            const iconUrl = lobby.game_modes?.games?.icon_url;

            const embed = {
                title: "📡 NEW SECTOR SIGNAL DETECTED",
                description: `**Protocol:** ${gameName} (${variantName})\n**Host:** ${ping}\n**Region:** ${region}`,
                color: 0xffaa00, // Neon Orange
                footer: { text: `Lobby ID: ${lobby.id.split('-')[0]}...` },
                timestamp: new Date().toISOString(),
                thumbnail: iconUrl ? { url: iconUrl } : undefined
            };

            await fetch(`${DISCORD_API_BASE}/channels/${MATCH_LOG_CHANNEL_ID}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: `**[LOBBY]** New Operation Initialized by ${ping}`,
                    embeds: [embed]
                })
            });

        } catch (error) {
            console.error('[BroadcasterAgent] Announcement Error:', error);
        }
    },

    /**
     * notifyMatchStart
     * Sends a rich embed to the configured Discord channel when a match goes LIVE.
     */
    async notifyMatchStart(lobby: any) {
        if (!BOT_TOKEN) {
            console.warn('[BroadcasterAgent] No Bot Token found. Skipping notification.');
            return;
        }

        if (!MATCH_LOG_CHANNEL_ID) {
            console.warn('[BroadcasterAgent] No Channel ID configured (DISCORD_MATCH_LOG_CHANNEL_ID). Skipping notification.');
            return;
        }

        console.log(`[BroadcasterAgent] Preparing match start notification for Lobby ${lobby.id}...`);

        const gameName = lobby.game_modes?.games?.name || "Unknown Protocol";
        const variantName = lobby.game_modes?.name || "Standard";
        const region = lobby.region || "Global";
        const iconUrl = lobby.game_modes?.games?.icon_url;

        // Construct Embed
        const embed = {
            title: "⚔️ MATCH STARTED",
            description: `**Protocol:** ${gameName} (${variantName})\n**Region:** ${region}\n\n*Alpha Team vs Omega Team*`,
            color: 0x00f3ff, // Neon Cyan
            footer: {
                text: `Lobby ID: ${lobby.id.split('-')[0]}...`
            },
            timestamp: new Date().toISOString(),
            thumbnail: iconUrl ? { url: iconUrl } : undefined
        };

        try {
            const res = await fetch(`${DISCORD_API_BASE}/channels/${MATCH_LOG_CHANNEL_ID}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: "🚨 **OPERATIONS UPDATE** 🚨",
                    embeds: [embed]
                })
            });

            if (!res.ok) {
                const err = await res.json();
                console.error('[BroadcasterAgent] Discord API Error:', res.status, err);
            } else {
                const data = await res.json();
                console.log(`[BroadcasterAgent] Notification dispatched. Message ID: ${data.id}`);
            }
        } catch (error) {
            console.error('[BroadcasterAgent] Network/System Error:', error);
        }
    }
};
