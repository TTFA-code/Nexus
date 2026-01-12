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
        const { lobbyId } = body

        if (!lobbyId) {
            return NextResponse.json({ error: 'Missing lobby ID' }, { status: 400 })
        }

        const discordIdentity = user.identities?.find(i => i.provider === 'discord')
        const userId = discordIdentity?.id

        if (!userId) {
            return NextResponse.json({ error: 'Identity check failed' }, { status: 401 })
        }

        // Verify Host Ownership
        const { data: lobby, error: fetchError } = await supabase
            .from('lobbies')
            .select('creator_id')
            .eq('id', lobbyId)
            .single()

        if (fetchError || !lobby) {
            return NextResponse.json({ error: 'Lobby not found' }, { status: 404 })
        }

        if (lobby.creator_id !== userId) {
            return NextResponse.json({ error: 'Only the host can dissolve this operation' }, { status: 403 })
        }

        // Delete Lobby
        const { error: deleteError } = await supabase
            .from('lobbies')
            .delete()
            .eq('id', lobbyId)

        if (deleteError) {
            console.error('Lobby Deletion Error:', deleteError)
            return NextResponse.json({ error: 'Failed to dissolve lobby' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Dissolve API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
