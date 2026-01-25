import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export const revalidate = 0;
export const dynamic = 'force-dynamic';

let BOT_API_URL = process.env.NEXT_PUBLIC_BOT_URL || 'http://localhost:3001';
if (process.env.NODE_ENV === 'production' && !BOT_API_URL.startsWith('http')) {
    BOT_API_URL = `https://${BOT_API_URL}`;
}
const BOT_API_KEY = process.env.BOT_API_KEY;

if (process.env.NODE_ENV === 'production' && BOT_API_URL.includes('localhost')) {
    console.warn('⚠️  WARNING: Using localhost for BOT_API_URL in production environment!');
}

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ lobbies: [] })
    }

    try {
        // 1. Get User's Guilds
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
                console.error('Failed to fetch user guilds:', e)
            }
        }

        // 2. Fetch Lobbies (Global + Guild Specific)
        console.log("Querying Lobbies with Join (API)...");

        interface LobbyWithRelations {
            id: string
            created_at: string
            status: string
            game_mode_id: string | null
            guild_id: string | null
            creator_id: string
            is_private: boolean
            voice_required: boolean
            is_tournament: boolean
            sector_key: string | null
            scheduled_start: string | null
            notes: string | null
            match_id: string | null
            region: string | null
            game_modes: {
                id: string
                name: string
                team_size: number
                games: {
                    name: string
                    icon_url: string | null
                } | null
            } | null
            creator: {
                username: string | null
                avatar_url: string | null
            } | null
            lobby_players: {
                user_id: string
                status: string
                is_ready: boolean
                team: number | null
            }[]
        }

        const { data: lobbiesData, error } = await supabase
            .from('lobbies')
            .select('*, game_modes(*, games(name, icon_url)), lobby_players(*)')
            .neq('status', 'finished')
            .or(`guild_id.is.null,guild_id.in.(${allowedGuilds.length ? allowedGuilds.join(',') : '000'})`)
            .order('created_at', { ascending: false })

        if (error) {
            console.dir(error, { depth: null });
            console.error('Lobby Fetch Error:', error)
            return NextResponse.json({ lobbies: [] })
        }

        const lobbies = lobbiesData as unknown as LobbyWithRelations[];

        // Fetch creator data separately (creator_id is TEXT, not a foreign key)
        const creatorIds = [...new Set(lobbies.map(l => l.creator_id))];
        const { data: creatorsData } = await supabase
            .from('players')
            .select('user_id, username, avatar_url')
            .in('user_id', creatorIds);

        const creatorMap = new Map(creatorsData?.map(c => [c.user_id, c]) || []);

        // Transform data
        const safeLobbies = lobbies.map(lobby => ({
            ...lobby,
            creator: creatorMap.get(lobby.creator_id) || null, // ← Populate from separate query
            players: undefined,
            player_count: lobby.lobby_players?.length || 0,
            displayProtocol: lobby.game_modes?.games?.name || 'Unknown Protocol', // Flattened for UI
            game_name: lobby.game_modes?.games?.name || 'Unknown Protocol',
            game_icon: lobby.game_modes?.games?.icon_url || null
        }))

        return NextResponse.json({ lobbies: safeLobbies })
    } catch (error) {
        console.error('Lobby API Internal Error:', error)
        return NextResponse.json({ lobbies: [] })
    }
}
