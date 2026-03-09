import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { matchId } = await req.json();

        if (!matchId) {
            return NextResponse.json({ error: "Match ID required" }, { status: 400 });
        }

        // Get User's Discord/Player ID
        const discordIdentity = user.identities?.find(i => i.provider === 'discord');
        const discordId = discordIdentity?.id;

        if (!discordId) {
            return NextResponse.json({ error: "No player profile found" }, { status: 400 });
        }

        console.log(`[FORFEIT] User ${discordId} forfeiting match ${matchId}`);

        // Reuse submit_match_report to record a loss (0-1 score)
        // This will trigger the standard MMR loss logic
        const { data, error } = await supabase.rpc('submit_match_report', {
            match_id_input: matchId,
            reporter_discord_id_input: discordId,
            my_score_input: 0,
            opponent_score_input: 1
        });

        if (error) {
            console.error("[FORFEIT] RPC Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Cleanup lobby if needed (handled by RPC usually)
        const { data: match } = await supabase
            .from('matches')
            .select('finished_at')
            .eq('id', matchId)
            .single();

        if (match?.finished_at) {
            await supabase
                .from('lobbies')
                .update({ status: 'finished' })
                .eq('match_id', matchId);
        }

        return NextResponse.json({ success: true, data });

    } catch (e: any) {
        console.error("[FORFEIT] System Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
