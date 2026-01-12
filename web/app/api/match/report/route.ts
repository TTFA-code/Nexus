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
        const { match_id, winner_team, mvp_user_id, evidence_url } = body

        if (!match_id || !winner_team) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Update Match
        const { error } = await supabase
            .from('matches')
            .update({
                winner_team,
                mvp_user_id,
                evidence_url,
                status: 'finished', // Technically finished playing, but pending approval
                approval_status: 'pending',
                finished_at: new Date().toISOString()
            })
            .eq('id', match_id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Match Report Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
