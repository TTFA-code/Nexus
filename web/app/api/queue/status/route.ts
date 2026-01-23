import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const revalidate = 0

let BOT_API_URL = process.env.NEXT_PUBLIC_BOT_URL || 'http://localhost:3001';
if (process.env.NODE_ENV === 'production' && !BOT_API_URL.startsWith('http')) {
    BOT_API_URL = `https://${BOT_API_URL}`;
}
const BOT_API_KEY = process.env.BOT_API_KEY;

export async function GET() {
    const supabase = await createClient()

    try {
        // 1. Get User
        const { data: { user } } = await supabase.auth.getUser()

        // Strict Filter: No user = No queues
        if (!user) {
            return NextResponse.json({ queues: [], game_modes: [] })
        }

        // 2. Get User's Guilds from Bot
        const discordId = user.identities?.find(i => i.provider === 'discord')?.id
        let allowedGuilds: string[] = []

        if (discordId) {
            try {
                const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                if (BOT_API_KEY) headers['x-api-key'] = BOT_API_KEY;

                const res = await fetch(`${BOT_API_URL}/user/${discordId}/guilds`, {
                    cache: 'no-store',
                    headers
                })
                if (res.ok) {
                    const data = await res.json()
                    allowedGuilds = data.guilds || []
                }
            } catch (e) {
                console.error('Failed to fetch user guilds from bot:', e)
            }
        }

        // If not in any shared guilds, return empty (triggers "Systems Idle")
        if (allowedGuilds.length === 0) {
            return NextResponse.json({ queues: [], game_modes: [] })
        }

        // 3. Fetch Game Modes (Strict)
        let gameModes: any[] = []

        const { data, error } = await supabase
            .from('game_modes')
            .select('*, games(*)')
            .eq('is_active', true)
            .or(`guild_id.is.null,guild_id.in.(${allowedGuilds.join(',')})`)
            .order('guild_id', { ascending: true, nullsFirst: true })
            .order('name', { ascending: true })

        if (error) {
            console.error("Failed to fetch game modes:", error)
            return NextResponse.json({ queues: [], game_modes: [] })
        }

        gameModes = data || []

        // 4. Fetch Queues
        const gameModeIds = gameModes?.map(gm => gm.id) || []
        let queues: any[] = []

        if (gameModeIds.length > 0) {
            const { data: qData, error: qError } = await supabase
                .from('queues')
                .select('*')
                .in('game_mode_id', gameModeIds)

            if (qError) throw qError
            queues = qData || []
        }

        return NextResponse.json({
            queues: queues,
            game_modes: gameModes || []
        })

    } catch (error) {
        console.error('Queue Status Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
