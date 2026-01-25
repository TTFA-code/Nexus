import { createClient } from "@/utils/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Trophy, Swords, Medal, Crown } from "lucide-react";
import { redirect } from "next/navigation";

export const revalidate = 60; // Cache for 1 minute

export default async function LeaderboardPage() {
    const supabase = await createClient();

    // Fetch Global MMR Rankings (Raw)
    const { data: rawRankings, error } = await supabase
        .from('player_mmr')
        .select(`
            mmr,
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
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 min-h-screen bg-[#0a0a0f]">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl bg-gradient-to-r from-amber-900/20 to-black border border-amber-500/20 relative overflow-hidden">
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                        GLOBAL <span className="text-amber-500">LEADERBOARD</span>
                    </h1>
                    <p className="text-zinc-400 font-mono uppercase tracking-widest max-w-lg">
                        Top active agents ranked by combat rating.
                    </p>
                </div>
                <div className="relative z-10 p-4 bg-amber-500/10 rounded-full border border-amber-500/20">
                    <Trophy className="w-12 h-12 text-amber-500" />
                </div>

                {/* BG Effects */}
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
            </div>

            {/* Rankings Grid */}
            <div className="space-y-12">
                {Object.entries(groupedRankings).map(([game, players]) => (
                    <div key={game} className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                            <Swords className="w-6 h-6 text-zinc-500" />
                            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{game}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {players.map((entry, index) => {
                                let rankColor = "border-white/10 bg-zinc-900/40";
                                let rankIcon = null;
                                let rankText = "text-zinc-500";

                                if (index === 0) {
                                    rankColor = "border-amber-500/50 bg-amber-900/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]";
                                    rankIcon = <Crown className="w-5 h-5 text-amber-500" />;
                                    rankText = "text-amber-500";
                                } else if (index === 1) {
                                    rankColor = "border-zinc-400/50 bg-zinc-800/20";
                                    rankIcon = <Medal className="w-5 h-5 text-zinc-300" />;
                                    rankText = "text-zinc-300";
                                } else if (index === 2) {
                                    rankColor = "border-orange-700/50 bg-orange-900/20";
                                    rankIcon = <Medal className="w-5 h-5 text-orange-400" />;
                                    rankText = "text-orange-400";
                                }

                                return (
                                    <div key={entry.user_id + entry.game_id} className={`flex items-center gap-4 p-4 rounded-xl border ${rankColor} transition-all hover:scale-[1.02]`}>
                                        <div className={`text-2xl font-black w-12 text-center ${rankText} font-mono flex justify-center`}>
                                            {rankIcon || `#${index + 1}`}
                                        </div>

                                        <Avatar className="h-12 w-12 border border-white/10">
                                            <AvatarImage src={entry.player?.avatar_url} />
                                            <AvatarFallback className="bg-black text-zinc-500"><User className="w-5 h-5" /></AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 overflow-hidden">
                                            <div className="text-white font-bold truncate">{entry.player?.username || "Unknown Agent"}</div>
                                            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Rating</div>
                                        </div>

                                        <div className="text-xl font-mono font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 rounded">
                                            {entry.mmr}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {Object.keys(groupedRankings).length === 0 && (
                    <div className="text-center py-20 text-zinc-500 font-mono uppercase tracking-widest border border-dashed border-zinc-800 rounded-3xl">
                        No Ranked Data Available
                    </div>
                )}
            </div>
        </div>
    );
}
