import { createClient } from "@/utils/supabase/server";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";

export const revalidate = 60; // Cache for 1 minute

export default async function LeaderboardPage() {
    const supabase = await createClient();

    // Fetch Global MMR Rankings (Raw)
    const { data: rawRankings, error } = await supabase
        .from('player_mmr')
        .select(`
            mmr,
            wins,
            losses,
            game_id,
            user_id,
            games:game_id ( name )
        `)
        .order('mmr', { ascending: false })
        .limit(100);

    if (error) {
        console.error("Leaderboard Error:", error);
    }

    // Manual Join for Players (Robust against missing FKs)
    let enrichedRankings: any[] = [];

    if (rawRankings && rawRankings.length > 0) {
        const userIds = Array.from(new Set(rawRankings.map(r => r.user_id)));

        const { data: players } = await supabase
            .from('players')
            .select('uuid_link, username, avatar_url, user_id')
            .in('uuid_link', userIds);

        const playerMap = new Map();
        players?.forEach(p => playerMap.set(p.uuid_link, p));

        enrichedRankings = rawRankings.map(r => ({
            ...r,
            player: playerMap.get(r.user_id)
        }));
    }

    // Group by Game
    const groupedRankings: Record<string, any[]> = {};

    enrichedRankings.forEach((r: any) => {
        const gameName = r.games?.name || "Unknown Protocol";
        if (!groupedRankings[gameName]) {
            groupedRankings[gameName] = [];
        }
        // Filter out bad data AND ensure player exists
        if (r.player) {
            groupedRankings[gameName].push(r);
        }
    });

    return (
        <LeaderboardClient groupedRankings={groupedRankings} />
    );
}
