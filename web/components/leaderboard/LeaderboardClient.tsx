"use client";

import { useState, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Trophy, Swords, Medal, Crown, Search, Ghost, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface LeaderboardClientProps {
    groupedRankings: Record<string, any[]>
}

export function LeaderboardClient({ groupedRankings }: LeaderboardClientProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedGame, setSelectedGame] = useState<string>("all")

    const filteredGames = useMemo(() => {
        if (selectedGame === "all") return groupedRankings;
        return { [selectedGame]: groupedRankings[selectedGame] };
    }, [selectedGame, groupedRankings]);

    const gameOptions = Object.keys(groupedRankings);

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

                {/* Controls Area */}
                <div className="relative z-10 flex flex-col md:flex-row gap-4 w-full md:w-auto">

                    {/* Game Filter */}
                    <div className="w-full md:w-64">
                        <Select value={selectedGame} onValueChange={setSelectedGame}>
                            <SelectTrigger className="w-full bg-black/40 border-white/10 text-white font-mono uppercase tracking-wider h-12">
                                <SelectValue placeholder="FILTER PROTOCOL" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-800 text-white font-mono uppercase">
                                <SelectItem value="all">ALL PROTOCOLS</SelectItem>
                                {gameOptions.map((game) => (
                                    <SelectItem key={game} value={game}>{game}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="SEARCH AGENT..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-12 pr-4 text-white font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600 uppercase tracking-wider h-12"
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
                {Object.entries(filteredGames).map(([game, players]) => (
                    <GameLeaderboard
                        key={game}
                        game={game}
                        players={players}
                        searchQuery={searchQuery}
                    />
                ))}

                {Object.keys(filteredGames).length === 0 && (
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
                <div className="ml-auto text-xs text-zinc-600 font-mono uppercase">{players.length} PLAYERS</div>
            </div>

            <div className="max-h-[600px] overflow-y-auto custom-scrollbar pr-2 scroll-pt-24 relative rounded-xl border border-white/5 bg-black/20 p-4 space-y-6">

                {/* TOP 3 PODIUM - Flexbox for Order Control */}
                {/* Mobile: Order 1 (Gold), 2 (Silver), 3 (Bronze) */}
                {/* Desktop: Order 2 (Silver), 1 (Gold), 3 (Bronze) */}
                <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-4 md:gap-6 mb-12 mt-8">
                    {/* #1 Gold (Center Desktop / Top Mobile) */}
                    {top3[0] && (
                        <div className="order-1 md:order-2 w-full md:w-1/3">
                            <Top3Card player={top3[0]} rank={1} searchQuery={searchQuery} />
                        </div>
                    )}

                    {/* #2 Silver (Left Desktop / Second Mobile) */}
                    {top3[1] && (
                        <div className="order-2 md:order-1 w-full md:w-1/3">
                            <Top3Card player={top3[1]} rank={2} searchQuery={searchQuery} />
                        </div>
                    )}

                    {/* #3 Bronze (Right Desktop / Third Mobile) */}
                    {top3[2] && (
                        <div className="order-3 md:order-3 w-full md:w-1/3">
                            <Top3Card player={top3[2]} rank={3} searchQuery={searchQuery} />
                        </div>
                    )}
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

                                    <div className="text-right mr-4 hidden md:block">
                                        <div className="text-xs font-mono font-bold text-zinc-500">
                                            <span className="text-emerald-500">{entry.wins}W</span> - <span className="text-red-500">{entry.losses}L</span>
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
        height: "min-h-[100px] md:min-h-[128px]" // Using min-height for flexibility
    }

    if (rank === 1) {
        styles = {
            bg: "bg-amber-900/20",
            border: "border-amber-500/50",
            text: "text-amber-400",
            icon: <Crown className="w-8 h-8 text-amber-500 fill-amber-500/20 animate-pulse" />,
            glow: "shadow-[0_0_40px_rgba(245,158,11,0.2)] md:transform md:-translate-y-4", // Pop up higher on desktop only
            height: "min-h-[120px] md:min-h-[160px]"
        }
    } else if (rank === 2) {
        styles = { // Brighter Silver
            bg: "bg-slate-300/10",
            border: "border-slate-300/40",
            text: "text-slate-200",
            icon: <Medal className="w-5 h-5 md:w-6 md:h-6 text-slate-300" />,
            glow: "shadow-[0_0_20px_rgba(203,213,225,0.1)]",
            height: "min-h-[100px] md:min-h-[128px]"
        }
    } else if (rank === 3) {
        styles = { // Duller Bronze
            bg: "bg-[#453020]/40", // Duller brown
            border: "border-[#8B5A2B]/40", // Duller orange/brown
            text: "text-[#B87333]", // Copper text
            icon: <Medal className="w-5 h-5 md:w-6 md:h-6 text-[#CD7F32]" />,
            glow: "",
            height: "min-h-[100px] md:min-h-[128px]"
        }
    }

    if (isMatch) {
        styles.border = "border-white bg-white/10"
        styles.glow += " ring-2 ring-white/50"
    }

    return (
        <div className={cn(
            "relative flex flex-col items-center justify-center p-4 md:p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] group",
            styles.bg, styles.border, styles.glow, styles.height
        )}>
            <div className={cn(
                "absolute top-2 right-4 font-black font-mono opacity-10 select-none text-white",
                rank === 1 ? "text-4xl" : "text-2xl md:text-4xl"
            )}>
                #{rank}
            </div>

            {/* Icons: Crown (Rank 1 - Top) */}
            {rank === 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 -top-6 flex items-center justify-center animate-bounce duration-[2000ms]">
                    {styles.icon}
                </div>
            )}

            <Avatar className={cn(
                "border-2 mb-2 md:mb-3 shadow-xl transition-all",
                rank === 1 ? "h-16 w-16 md:h-20 md:w-20 border-amber-500" : "h-12 w-12 md:h-16 md:w-16 border-white/10"
            )}>
                <AvatarImage src={player.player?.avatar_url} />
                <AvatarFallback className="bg-black text-zinc-500"><User className={cn("w-6 h-6", styles.text)} /></AvatarFallback>
            </Avatar>

            {/* Username */}
            <div className={cn(
                "font-bold text-center truncate w-full mb-1 px-2 z-10 text-sm md:text-base",
                isMatch ? "text-white scale-110" : "text-white drop-shadow-md"
            )}>
                {player.player?.username || "Unknown"}
            </div>

            {/* MMR */}
            <div className={cn("font-mono font-bold text-sm md:text-lg px-2 md:px-3 py-0.5 rounded border bg-black/50 backdrop-blur-sm z-10", styles.text, rank === 3 ? "border-[#8B5A2B]/30" : "border-white/10")}>
                {player.mmr}
            </div>

            {/* W/L Record - Added Here */}
            <div className="mt-1 text-xs font-mono font-bold text-zinc-400">
                <span className="text-emerald-500">{player.wins}W</span> - <span className="text-red-500">{player.losses}L</span>
            </div>

            {/* Icons: Medals (Rank 2/3 - Bottom/Under MMR) */}
            {(rank === 2 || rank === 3) && (
                <div className="mt-2 animate-pulse duration-[3000ms]">
                    {styles.icon}
                </div>
            )}
        </div>
    )
}
