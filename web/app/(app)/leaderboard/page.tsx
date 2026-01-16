import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { GameFilter } from "@/components/leaderboard/GameFilter"
import { PageHeader } from "@/components/ui/PageHeader"

// ... existing imports

export const revalidate = 0

interface LeaderboardPageProps {
    searchParams: Promise<{ game?: string }>
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
    const supabase = await createClient()
    const { game } = await searchParams

    // Fetch Games for Filter
    const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, name')
        .order('name', { ascending: true })

    if (gamesError) {
        console.error("Error fetching games:", gamesError)
    } else {
        console.log("Fetched games:", games)
    }

    // Build Query
    // We are querying player_mmr now.
    let query = supabase
        .from('player_mmr' as any)
        .select(`
            mmr,
            players (username, avatar_url),
            games (name)
        `)
        .order('mmr', { ascending: false })
        .limit(50)

    if (game && game !== 'all') {
        query = query.eq('game_id', game)
    }

    const { data: ratings } = await query

    return (
        <div className="min-h-screen bg-[#020205] text-white selection:bg-cyan-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
            </div>

            <div className="relative z-10">
                <PageHeader title="LEADERBOARD" subtitle="GLOBAL RANKINGS">
                    <div className="flex items-center justify-end border-b border-white/10 pb-4">
                        <GameFilter games={games || []} />
                    </div>
                </PageHeader>

                <div className="p-8">
                    <div className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
                        {/* Card highlight effect */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />

                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableHead className="w-[100px] text-cyan-400 font-bold uppercase tracking-wider font-mono">Rank</TableHead>
                                    <TableHead className="text-zinc-400 uppercase tracking-wider font-mono">Player</TableHead>
                                    <TableHead className="text-zinc-400 uppercase tracking-wider font-mono">Game</TableHead>
                                    <TableHead className="text-right text-purple-400 font-bold uppercase tracking-wider font-mono">MMR</TableHead>
                                    {/* Win Rate temporarily removed as it requires expensive calculation per row */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ratings?.map((rating: any, index: number) => {
                                    return (
                                        <TableRow key={`${rating.players?.username}-${index}`} className="border-white/10 hover:bg-white/5 transition-colors duration-200 group/row">
                                            <TableCell className="font-medium text-white font-mono">
                                                <span className={index < 3 ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "text-zinc-500"}>
                                                    #{index + 1}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 ring-2 ring-white/10 group-hover/row:ring-cyan-500/50 transition-all duration-300">
                                                        <AvatarImage src={rating.players?.avatar_url || ''} />
                                                        <AvatarFallback className="bg-zinc-900 text-zinc-400 font-bold">{rating.players?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-bold text-zinc-100 tracking-wide group-hover/row:text-white transition-colors">{rating.players?.username}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-400 hover:bg-purple-500/10 hover:text-purple-300 hover:border-purple-500/30 transition-all duration-300 uppercase tracking-wider text-[10px]">
                                                    {rating.games?.name}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-2xl text-white font-mono tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                                {rating.mmr}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {(!ratings || ratings.length === 0) && (
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableCell colSpan={4} className="h-32 text-center text-zinc-500 font-mono uppercase tracking-widest">
                                            No ranked players found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    )
}
