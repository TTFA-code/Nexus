"use client"

import { useState, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Trophy, Swords, Medal, Crown, Search, Ghost } from "lucide-react"
import { cn } from "@/lib/utils"

interface LeaderboardClientProps {
    groupedRankings: Record<string, any[]>
}

export function LeaderboardClient({ groupedRankings }: LeaderboardClientProps) {
    const [searchQuery, setSearchQuery] = useState("")

    return (
        <div className="p-4 md:p-8 space-y-12 animate-in fade-in duration-500 min-h-screen bg-[#0a0a0f]">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl bg-gradient-to-r from-amber-900/20 to-black border border-amber-500/20 relative overflow-hidden group">
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">
                        GLOBAL <span className="text-amber-500">LEADERBOARD</span>
                    </h1>
                    <p className="text-zinc-400 font-mono uppercase tracking-widest max-w-lg mt-2">
                        Top active players ranked by MMR
                    </p>
                </div>

                {/* Search Bar - Absolute Centered or Right Aligned? Let's put it in the header for cleanliness */}
                <div className="relative z-10 w-full md:w-96">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="SEARCH AGENT..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600 uppercase tracking-wider"
                        />
                    </div>
                </div>

                <div className="relative z-10 p-4 bg-amber-500/10 rounded-full border border-amber-500/20 hidden md:block">
                    <Trophy className="w-12 h-12 text-amber-500" />
                </div>

                {/* BG Effects */}
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
            </div>

            {/* Games Grid */}
            <div className="space-y-16">
                {Object.entries(groupedRankings).map(([game, players]) => (
                    <GameLeaderboard
                        key={game}
                        game={game}
                        players={players}
                        searchQuery={searchQuery}
                    />
                ))}

                {Object.keys(groupedRankings).length === 0 && (
                    <div className="text-center py-20 text-zinc-500 font-mono uppercase tracking-widest border border-dashed border-zinc-800 rounded-3xl">
                        No Ranked Data Available
                    </div>
                )}
            </div>
        </div>
    )
}

function GameLeaderboard({ game, players, searchQuery }: { game: string, players: any[], searchQuery: string }) {
    const top3 = players.slice(0, 3)
    const rest = players.slice(3)
    const gameIdSlug = game.toLowerCase().replace(/\s+/g, '-')

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4 sticky top-0 bg-[#0a0a0f]/95 backdrop-blur-sm z-20 py-4">
                <Swords className="w-6 h-6 text-zinc-500" />
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{game}</h2>
                <div className="ml-auto text-xs text-zinc-600 font-mono uppercase">{players.length} AGENTS</div>
            </div>

            {/* Fixed Height Filters Area within Game Section? User asked for "search and filter at the top". 
                I put global search at the top. Per-game margins suggests per-game scrolling. 
            */}

            <div className="max-h-[80vh] overflow-y-auto custom-scrollbar pr-2 scroll-pt-24 relative rounded-xl border border-white/5 bg-black/20 p-4 space-y-6">

                {/* TOP 3 PODIUM */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* #2 Silver (Left) */}
                    {top3[1] && <Top3Card player={top3[1]} rank={2} searchQuery={searchQuery} />}

                    {/* #1 Gold (Center - Bigger) */}
                    {top3[0] && <Top3Card player={top3[0]} rank={1} searchQuery={searchQuery} />}

                    {/* #3 Bronze (Right) */}
                    {top3[2] && <Top3Card player={top3[2]} rank={3} searchQuery={searchQuery} />}
                </div>

                {/* THE LIST */}
                {rest.length > 0 && (
                    <div className="space-y-2">
                        {rest.map((entry, index) => {
                            const rank = index + 4
                            const isMatch = searchQuery && entry.player?.username.toLowerCase().includes(searchQuery.toLowerCase())

                            return (
                                <div
                                    key={entry.user_id + entry.game_id}
                                    className={cn(
                                        "flex items-center gap-4 p-3 rounded-lg border transition-all duration-300",
                                        isMatch
                                            ? "bg-amber-500/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] scale-[1.01] z-10"
                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}
                                >
                                    <div className="w-12 text-center text-zinc-500 font-mono font-bold">#{rank}</div>

                                    <Avatar className="h-10 w-10 border border-white/10">
                                        <AvatarImage src={entry.player?.avatar_url} />
                                        <AvatarFallback className="bg-black text-zinc-500"><User className="w-4 h-4" /></AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1">
                                        <div className={cn("font-bold text-sm", isMatch ? "text-amber-200" : "text-zinc-300")}>
                                            {entry.player?.username || "Unknown Agent"}
                                        </div>
                                    </div>

                                    <div className="text-emerald-400 font-mono font-bold text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        {entry.mmr}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {players.length === 0 && (
                    <div className="text-center py-12 text-zinc-600 font-mono uppercase text-xs">No Active Players</div>
                )}
            </div>
        </div>
    )
}

function Top3Card({ player, rank, searchQuery }: { player: any, rank: number, searchQuery: string }) {
    const isMatch = searchQuery && player.player?.username.toLowerCase().includes(searchQuery.toLowerCase())

    let styles = {
        bg: "bg-zinc-900",
        border: "border-zinc-800",
        text: "text-zinc-500",
        icon: <Ghost className="w-5 h-5" />,
        glow: "",
        height: "h-32"
    }

    if (rank === 1) {
        styles = {
            bg: "bg-amber-900/20",
            border: "border-amber-500/50",
            text: "text-amber-400",
            icon: <Crown className="w-8 h-8 text-amber-500 fill-amber-500/20 animate-pulse" />,
            glow: "shadow-[0_0_40px_rgba(245,158,11,0.2)]",
            height: "h-40 md:h-48 md:-mt-4" // Pop up higher
        }
    } else if (rank === 2) {
        styles = { // Brighter Silver
            bg: "bg-slate-300/10",
            border: "border-slate-300/40",
            text: "text-slate-200",
            icon: <Medal className="w-6 h-6 text-slate-300" />,
            glow: "shadow-[0_0_20px_rgba(203,213,225,0.1)]",
            height: "h-32 md:h-40"
        }
    } else if (rank === 3) {
        styles = { // Duller Bronze
            bg: "bg-[#453020]/40", // Duller brown
            border: "border-[#8B5A2B]/40", // Duller orange/brown
            text: "text-[#B87333]", // Copper text
            icon: <Medal className="w-6 h-6 text-[#CD7F32]" />,
            glow: "",
            height: "h-32 md:h-40"
        }
    }

    if (isMatch) {
        styles.border = "border-white bg-white/10"
        styles.glow += " ring-2 ring-white/50"
    }

    return (
        <div className={cn(
            "relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] group",
            styles.bg, styles.border, styles.glow, styles.height
        )}>
            <div className="absolute top-2 right-4 text-4xl font-black font-mono opacity-10 select-none">#{rank}</div>

            {rank === 1 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce duration-[2000ms]">
                    {styles.icon}
                </div>
            )}

            <Avatar className={cn("h-16 w-16 border-2 mb-3 shadow-xl", rank === 1 ? "h-20 w-20 border-amber-500" : "border-white/10")}>
                <AvatarImage src={player.player?.avatar_url} />
                <AvatarFallback className="bg-black text-zinc-500"><User className="w-6 h-6" /></AvatarFallback>
            </Avatar>

            <div className={cn("font-bold text-center truncate w-full mb-1", isMatch ? "text-white scale-110" : "text-white")}>
                {player.player?.username || "Unknown"}
            </div>

            <div className={cn("font-mono font-bold text-lg px-3 py-0.5 rounded border bg-black/50", styles.text, rank === 3 ? "border-[#8B5A2B]/30" : "border-white/10")}>
                {player.mmr}
            </div>
        </div>
    )
}
