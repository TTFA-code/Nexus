"use server";

const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_URL || 'http://localhost:3001';
const BOT_API_KEY = process.env.BOT_API_KEY;

// Common Headers Helper
const getHeaders = () => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (BOT_API_KEY) {
        headers['x-api-key'] = BOT_API_KEY;
    }
    return headers;
};


export interface BotHealth {
    status: string;
    bot_status: string;
}

export interface QueueInfo {
    id: number;
    guildId: string;
    name: string;
    teamSize: number;
    currentPlayers: number;
    maxPlayers: number;
}

export async function getBotHealth(): Promise<BotHealth> {
    try {
        // const res = await fetch(`${BOT_API_URL}/health`, { 
        //    cache: 'no-store',
        //    headers: getHeaders()
        // });
        // if (!res.ok) throw new Error('Failed to fetch health');
        // return await res.json();
        return { status: 'ok', bot_status: 'online' }; // MOCKED FOR NOW
    } catch (error) {
        console.error('Bot API Error (Health):', error);
        return { status: 'error', bot_status: 'offline' };
    }
}

export async function getQueues(): Promise<QueueInfo[]> {
    try {
        const res = await fetch(`${BOT_API_URL}/queues`, {
            cache: 'no-store',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch queues');
        return await res.json();
    } catch (error) {
        console.error('Bot API Error (Queues):', error);
        return [];
    }
}

export async function joinQueue(userId: string, guildId: string, gameModeName: string) {
    try {
        const res = await fetch(`${BOT_API_URL}/queues/join`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ userId, guildId, gameModeName }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Bot API Error (Join Queue):', error);
        return { success: false, message: 'Failed to connect to bot.' };
    }
}

export async function leaveQueue(userId: string, guildId: string) {
    try {
        const res = await fetch(`${BOT_API_URL}/queues/leave`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ userId, guildId }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Bot API Error (Leave Queue):', error);
        return { success: false, message: 'Failed to connect to bot.' };
    }
}
