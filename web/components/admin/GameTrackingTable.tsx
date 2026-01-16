"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Search, Gamepad2, Trophy, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TrackedGame {
    id: string
    status: string
    date: string
    gameName: string
    modeName: string
    winner: number | null
    icon: string | null
    playedBy?: string
    playerAvatar?: string
}

interface GameTrackingTableProps {
    games: TrackedGame[]
    viewMode?: 'GUILD' | 'MEMBERS'
    onViewChange?: (mode: 'GUILD' | 'MEMBERS') => void
}

export function GameTrackingTable({ games, viewMode = 'GUILD', onViewChange }: GameTrackingTableProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredGames = games.filter(game =>
        game.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.gameName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.modeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.playedBy && game.playedBy.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'live': return 'text-emerald-400 bg-emerald-950/30 border-emerald-500/50'
            case 'finished': return 'text-zinc-400 bg-white/5 border-white/10'
            case 'cancelled': return 'text-red-400 bg-red-950/30 border-red-500/50'
            default: return 'text-blue-400 bg-blue-950/30 border-blue-500/50'
        }
    }

    return (
        <div className="flex flex-col h-full bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                            <Trophy className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white font-orbitron tracking-wide">
                                OPERATION HISTORY
                            </h3>
                            <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
                                ARCHIVED MATCH LOGS
                            </p>
                        </div>
                    </div>

                    {/* View Toggle */}
                    {onViewChange && (
                        <div className="flex bg-black/40 rounded p-1 border border-white/10">
                            <button
                                onClick={() => onViewChange('GUILD')}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold font-mono rounded transition-all",
                                    viewMode === 'GUILD' ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-white"
                                )}
                            >
                                GUILD OPS
                            </button>
                            <button
                                onClick={() => onViewChange('MEMBERS')}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold font-mono rounded transition-all",
                                    viewMode === 'MEMBERS' ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-white"
                                )}
                            >
                                MEMBER INTEL
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="SEARCH OP ID..."
                        className="pl-9 h-9 bg-black/50 border-white/10 focus:border-cyan-500/50 text-xs font-mono tracking-wider"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                <Table>
                    <TableHeader className="bg-black/40 sticky top-0 z-10 backdrop-blur-md">
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="w-[100px] text-zinc-500 font-mono uppercase text-[10px]">Op ID</TableHead>
                            <TableHead className="text-zinc-500 font-mono uppercase text-[10px]">Protocol</TableHead>
                            <TableHead className="text-zinc-500 font-mono uppercase text-[10px]">Directive (Mode)</TableHead>
                            {viewMode === 'MEMBERS' && (
                                <TableHead className="text-zinc-500 font-mono uppercase text-[10px]">Operative</TableHead>
                            )}
                            <TableHead className="text-zinc-500 font-mono uppercase text-[10px]">Status</TableHead>
                            <TableHead className="text-right text-zinc-500 font-mono uppercase text-[10px]">Result</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredGames.length > 0 ? (
                            filteredGames.map((game) => (
                                <TableRow key={game.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="font-mono text-xs text-zinc-400 group-hover:text-cyan-400 transition-colors">
                                        #{game.id.toString().slice(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {game.icon ? (
                                                <img src={game.icon} className="w-4 h-4 rounded-sm opacity-70" alt="" />
                                            ) : (
                                                <Gamepad2 className="w-4 h-4 text-zinc-600" />
                                            )}
                                            <span className="text-zinc-300 font-bold text-xs">{game.gameName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-zinc-400 font-mono uppercase">
                                        {game.modeName}
                                    </TableCell>
                                    {viewMode === 'MEMBERS' && (
                                        <TableCell className="text-xs text-purple-400 font-mono">
                                            {game.playedBy}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-mono uppercase rounded-sm border", getStatusColor(game.status))}>
                                            {game.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {game.winner ? (
                                            <span className="text-xs font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                                                TEAM {game.winner} VICTORY
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-zinc-600 font-mono uppercase">
                                                In Progress
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={5} className="h-24 text-center text-zinc-500 font-mono uppercase text-xs tracking-widest">
                                    No records found matching query.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
