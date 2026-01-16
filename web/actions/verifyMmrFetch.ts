
import { createClient } from '@/utils/supabase/server';

export async function verifyMmrFetch(matchId: string, userId: string): Promise<any> {
    const supabase = await createClient();

    console.log(`Verifying fetch for Match: ${matchId}, User: ${userId}`);

    const { data: history, error } = await supabase
        .from("mmr_history")
        .select("change")
        .eq("match_id", matchId)
        .eq("player_uuid", userId)
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Fetch Error:", error);
        return { error };
    }

    console.log("Fetch Result:", history);
    return { history };
}
