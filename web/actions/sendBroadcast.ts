'use server';

import { verifyNexusAdmin } from '@/utils/discord/gatekeeper';

interface BroadcastPayload {
    guildId: string;
    channelId: string;
    title: string;
    message: string;
}

export async function sendBroadcast({ guildId, channelId, title, message }: BroadcastPayload) {
    console.log(`[Broadcast] Init: Guild=${guildId} Channel=${channelId}`);

    // 1. Auth Check
    // 1. Auth Check
    const { isAuthorized, reason } = await verifyNexusAdmin(guildId);
    if (!isAuthorized) {
        throw new Error(`Unauthorized: ${reason || 'You do not have permission to broadcast.'}`);
    }

    if (!process.env.DISCORD_BOT_TOKEN) {
        throw new Error('Server Error: Bot Token missing.');
    }

    // 2. Prepare Payload
    const body = {
        embeds: [{
            title: title,
            description: message,
            color: 0x00ff00, // Matrix Green
            footer: { text: "Nexus Command // Official Broadcast" }
        }]
    };

    // 3. Send to Discord
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    // 4. Handle Response
    if (!res.ok) {
        let errorMsg = `Discord API Error: ${res.statusText}`;

        if (res.status === 403) {
            errorMsg = "Bot lacks permission to speak in that channel.";
        } else if (res.status === 404) {
            errorMsg = "Channel ID not found.";
        }

        console.error(`[Broadcast] Failed: ${res.status} ${res.statusText}`);
        const errorData = await res.json().catch(() => ({}));
        console.error(errorData);

        throw new Error(errorMsg);
    }

    const data = await res.json();
    console.log(`[Broadcast] Success: Message ID ${data.id}`);

    return { success: true, messageId: data.id };
}
