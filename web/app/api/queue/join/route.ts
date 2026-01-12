import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract Discord ID
    console.log('User Object:', JSON.stringify(user, null, 2))
    const discordIdentity = user.identities?.find(i => i.provider === 'discord')
    console.log('Discord Identity:', discordIdentity)
    const discordId = discordIdentity?.id

    if (!discordId) {
        console.error('No Discord ID found for user:', user.id)
        return NextResponse.json({ error: 'Discord identity not found' }, { status: 400 })
    }

    try {
        const body = await request.json()
        const { game_mode_id } = body
        console.log('Joining Queue:', { discordId, game_mode_id })

        if (!game_mode_id) {
            return NextResponse.json({ error: 'Missing game_mode_id' }, { status: 400 })
        }

        // Check if already in queue
        const { data: existingQueue, error: selectError } = await supabase
            .from('queues')
            .select('*')
            .eq('user_id', discordId)
            .eq('game_mode_id', game_mode_id)
            .single()

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('Queue Check Error:', selectError)
        }

        if (existingQueue) {
            return NextResponse.json({ message: 'Already in queue' }, { status: 200 })
        }

        // UPSERT PLAYER to ensure they exist in the DB (resolves Foreign Key error)
        // We use the extracted discordId
        const { error: playerError } = await supabase
            .from('players')
            .upsert({
                user_id: discordId,
                username: user.user_metadata.full_name || user.user_metadata.name || 'Unknown',
                avatar_url: user.user_metadata.avatar_url,
            })

        if (playerError) {
            console.error('Player Upsert Error:', playerError)
        }

        // Join Queue
        const { error: insertError } = await supabase
            .from('queues')
            .insert({
                game_mode_id,
                user_id: discordId
            })

        if (insertError) {
            console.error('Queue Insert Error:', insertError)
            throw insertError
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Queue Join Catch Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
