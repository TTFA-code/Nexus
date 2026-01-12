
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
        const { game_mode_id, score, opponent_username, outcome } = body

        if (!game_mode_id || !score || !opponent_username || !outcome) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Insert Report
        const { data: report, error } = await supabase
            .from('match_reports')
            .insert({
                reporter_id: user.id,
                game_mode_id,
                result_data: { score, opponent_username, outcome },
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error

        // Trigger Discord Webhook
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL
        if (webhookUrl) {
            try {
                const embed = {
                    title: "📝 New Match Report Submitted",
                    color: 0x00ffff, // Cyan
                    fields: [
                        { name: "Reporter", value: `<@${user.id}>` }, // Assuming user.id is Discord ID
                        { name: "Outcome", value: outcome.toUpperCase(), inline: true },
                        { name: "Score", value: score, inline: true },
                        { name: "Opponent", value: opponent_username, inline: true },
                        { name: "Report ID", value: report.id.toString() }
                    ],
                    timestamp: new Date().toISOString()
                }

                await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ embeds: [embed] })
                })
            } catch (whError) {
                console.error("Webhook trigger failed:", whError)
                // Don't fail the request if webhook fails
            }
        }

        return NextResponse.json({ success: true, report })
    } catch (error) {
        console.error('Submit Report Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ideally verify Admin status here. Skipping for MVP as per plan.

    const { data: reports, error } = await supabase
        .from('match_reports')
        .select(`
            *,
            game_modes ( name ),
            players!reporter_id ( username, avatar_url )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reports })
}
