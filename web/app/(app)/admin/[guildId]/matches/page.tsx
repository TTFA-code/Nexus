import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ApproveMatchButton } from '@/components/admin/ApproveMatchButton'

export const revalidate = 0

interface MatchesPageProps {
    params: Promise<{ guildId: string }>
}

export default async function MatchesPage({ params }: MatchesPageProps) {
    const supabase = await createClient()
    const { guildId } = await params

    // Fetch matches for this guild
    // Note: We need to filter by guild_id. 
    // Since matches table doesn't have guild_id directly, we join game_modes.
    const { data: matches } = await supabase
        .from('matches')
        .select(`
            *,
            game_modes:game_mode_id!inner (
                name,
                guild_id
            )
        `)
        .eq('game_modes.guild_id', guildId)
        .order('finished_at', { ascending: false })
        .limit(50)

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Match History</h2>
                    <p className="text-muted-foreground">
                        Recent matches for this server.
                    </p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Game Mode</TableHead>
                            <TableHead>Winner</TableHead>
                            <TableHead>MVP</TableHead>
                            <TableHead>Finished</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {matches?.map((match: any) => (
                            <TableRow key={match.id}>
                                <TableCell className="font-mono text-xs">{match.id}</TableCell>
                                <TableCell className="font-medium">{match.game_modes?.name}</TableCell>
                                <TableCell>
                                    <Badge>Team {match.winner_team}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {match.mvp_user_id || '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDistanceToNow(new Date(match.finished_at), { addSuffix: true })}
                                </TableCell>
                                <TableCell className="text-right">
                                    {match.status === 'pending_approval' ? (
                                        <ApproveMatchButton matchId={match.id} />
                                    ) : (
                                        <Button variant="outline" size="sm" disabled>
                                            {match.status}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!matches || matches.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No matches found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
