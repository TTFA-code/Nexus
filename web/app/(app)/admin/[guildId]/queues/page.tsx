import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { QueueToggle } from "@/components/admin/QueueToggle"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const revalidate = 0

interface QueuePageProps {
    params: Promise<{ guildId: string }>
}

export default async function QueuePage({ params }: QueuePageProps) {
    const supabase = await createClient()
    const { guildId } = await params

    const { data: gameModes } = await supabase
        .from('game_modes')
        .select('*, games!inner(name)')
        .eq('guild_id', guildId)
        .order('id', { ascending: true })

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Queue Management</h2>
                    <p className="text-muted-foreground">
                        Control active queues for this server.
                    </p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Team Size</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gameModes?.map((mode) => (
                            <TableRow key={mode.id}>
                                <TableCell className="font-mono text-xs">{mode.id}</TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground">{(mode.games as any)?.name || 'Unknown Game'}</span>
                                        <span>{mode.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{mode.team_size}v{mode.team_size}</TableCell>
                                <TableCell>
                                    <Badge variant={mode.is_active ? "default" : "secondary"}>
                                        {mode.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <QueueToggle
                                        gameModeId={mode.id}
                                        initialIsActive={mode.is_active}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!gameModes || gameModes.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No game modes found. Use the bot to create one.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
