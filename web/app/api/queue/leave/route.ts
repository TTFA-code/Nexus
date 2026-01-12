import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract Discord ID
    const discordIdentity = user.identities?.find(i => i.provider === 'discord')
    const discordId = discordIdentity?.id

    if (!discordId) {
        return NextResponse.json({ error: 'Discord identity not found' }, { status: 400 })
    }

    try {
        const body = await request.json()
        const { game_mode_id } = body

        let query = supabase.from('queues').delete().eq('user_id', discordId)

        // If specific mode is targeting, add that filter
        if (game_mode_id) {
            query = query.eq('game_mode_id', game_mode_id)
        }

        const { error } = await query

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Queue Leave Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
