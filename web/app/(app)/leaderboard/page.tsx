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
import { GameModeFilter } from "@/components/leaderboard/GameModeFilter"
import { redirect } from 'next/navigation'
import { PageHeader } from "@/components/ui/PageHeader"

// ... existing imports

export const revalidate = 0

interface LeaderboardPageProps {
    searchParams: Promise<{ mode?: string }>
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
    const supabase = await createClient()
    const { mode } = await searchParams

    // Fetch Game Modes for Filter
    const { data: gameModes } = await supabase
        .from('game_modes')
        .select('id, name')
        .eq('is_active', true)

    // Build Query
    let query = supabase
        .from('player_ratings')
        .select(`
            *,
            players (username, avatar_url),
            game_modes (name)
        `)
        .order('mmr', { ascending: false })
        .limit(50)

    if (mode && mode !== 'all') {
        query = query.eq('game_mode_id', parseInt(mode))
    }

    const { data: ratings } = await query

    return (
        <div className="min-h-screen bg-[#0a0a0f]/50 backdrop-blur-md text-white">
            <PageHeader title="Leaderboard" subtitle="GLOBAL RANKINGS">
                <div className="flex items-center justify-end border-b border-white/10 pb-4">
                    <GameModeFilter modes={gameModes || []} />
                </div>
            </PageHeader>

            <div className="p-8">
                <div className="rounded-md border border-white/10 bg-black/20 backdrop-blur-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="w-[100px] text-zinc-400">Rank</TableHead>
                                <TableHead className="text-zinc-400">Player</TableHead>
                                <TableHead className="text-zinc-400">Game Mode</TableHead>
                                <TableHead className="text-right text-zinc-400">MMR</TableHead>
                                <TableHead className="text-right text-zinc-400">W/L</TableHead>
                                <TableHead className="text-right text-zinc-400">Win Rate</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ratings?.map((rating, index) => {
                                const totalGames = rating.wins + rating.losses
                                const winRate = totalGames > 0 ? Math.round((rating.wins / totalGames) * 100) : 0

                                return (
                                    <TableRow key={rating.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-medium text-white">
                                            #{index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 ring-1 ring-white/10">
                                                    <AvatarImage src={rating.players?.avatar_url || ''} />
                                                    <AvatarFallback className="bg-zinc-900 text-zinc-400">{rating.players?.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-white">{rating.players?.username}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10">{rating.game_modes?.name}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-blue-400">
                                            {rating.mmr}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            <span className="text-green-500">{rating.wins}W</span> - <span className="text-red-500">{rating.losses}L</span>
                                        </TableCell>
                                        <TableCell className="text-right text-zinc-300">
                                            {winRate}%
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {(!ratings || ratings.length === 0) && (
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                                        No players found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
