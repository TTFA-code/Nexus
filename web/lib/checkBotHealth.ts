export async function checkBotHealth() {
    const BOT_API_URL = process.env.NEXT_PUBLIC_BOT_URL;
    if (!BOT_API_URL) return false;

    try {
        const res = await fetch(`${BOT_API_URL}/health`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(3000) // 3s timeout
        });
        return res.ok;
    } catch (error) {
        console.error('Bot Health Check Failed:', error);
        return false;
    }
}
