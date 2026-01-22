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
        const { game_mode_id } = body

        // Fetch queued players
        const { data: queue, error: queueError } = await supabase
            .from('queues')
            .select('*')
            .eq('game_mode_id', game_mode_id)
            .order('joined_at', { ascending: true })

        if (queueError) throw queueError

        // Basic Logic: If we have enough players, start a match.
        // For simplicity in this demo, we'll take the first N players needed.
        // We need to know team size.
        const { data: gameMode } = await supabase
            .from('game_modes')
            .select('*')
            .eq('id', game_mode_id)
            .single()

        if (!gameMode) {
            return NextResponse.json({ error: 'Game mode not found' }, { status: 404 })
        }

        // Strict Validation Guard: Verify team_size is a valid number
        if (typeof gameMode.team_size !== 'number') {
            return NextResponse.json({ error: 'Invalid game mode configuration: team_size is missing or invalid' }, { status: 400 })
        }

        // Total players needed = team_size * 2 (assuming 2 teams)
        // EXCEPT for 1v1 where team_size might be 1.
        const playersNeeded = gameMode.team_size * 2

        if (!queue || queue.length < playersNeeded) {
            return NextResponse.json({ error: 'Not enough players in queue', current: queue?.length, needed: playersNeeded }, { status: 400 })
        }

        const playersToMatch = queue.slice(0, playersNeeded)
        const playerIds = playersToMatch.map(p => p.user_id)

        // 1. Create Match
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .insert({
                game_mode_id,
                status: 'ongoing',
                started_at: new Date().toISOString()
            })
            .select()
            .single()

        if (matchError) throw matchError

        // 2. Add Players to Match (Simple split: First half Team 1, Second half Team 2)
        const midPoint = Math.ceil(playersNeeded / 2)
        const matchPlayers = playersToMatch.map((p, index) => ({
            match_id: match.id,
            user_id: p.user_id,
            team: index < midPoint ? 1 : 2
        }))

        const { error: rosterError } = await supabase
            .from('match_players')
            .insert(matchPlayers)

        if (rosterError) throw rosterError

        // 3. Remove Players from Queue
        const { error: deleteQueueError } = await supabase
            .from('queues')
            .delete()
            .in('user_id', playerIds)
            .eq('game_mode_id', game_mode_id)

        if (deleteQueueError) throw deleteQueueError

        return NextResponse.json({ success: true, match_id: match.id })

    } catch (error) {
        console.error('Match Creation Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
