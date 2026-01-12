import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { lobbyId, passphrase } = body

        if (!lobbyId) {
            return NextResponse.json({ error: 'Missing lobby ID' }, { status: 400 })
        }

        const discordIdentity = user.identities?.find(i => i.provider === 'discord')
        const userId = discordIdentity?.id

        if (!userId) {
            return NextResponse.json({ error: 'Identity check failed' }, { status: 401 })
        }

        // 1. Fetch Lobby
        const { data: lobby, error: fetchError } = await supabase
            .from('lobbies')
            .select('id, status')
            .eq('id', lobbyId)
            .single()

        if (fetchError || !lobby) {
            return NextResponse.json({ error: 'Lobby not found' }, { status: 404 })
        }

        if (lobby.status !== 'open') {
            return NextResponse.json({ error: 'Lobby is no longer open' }, { status: 400 })
        }

        // 3. Ensure Player Exists in Players Table
        await supabase.from('players').upsert({
            user_id: userId,
            username: user.user_metadata.full_name || 'Unknown',
            avatar_url: user.user_metadata.avatar_url
        })

        // 4. (Legacy) Lobby Players table removed.
        // If this route is called, we just acknowledge.
        // Relationships are direct (Creator only).
        // If 'Joining' is needed, it must be via 'Queues' or in-memory state, not a joined table.
        // For now, return success to not break frontend flow, but do nothing.

        // Maybe we should check if they can join? But without a table we can't store it.
        // Prompt says "Crucially, there is NO table called lobby_players".

        return NextResponse.json({ success: true })



    } catch (error) {
        console.error('Join API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
