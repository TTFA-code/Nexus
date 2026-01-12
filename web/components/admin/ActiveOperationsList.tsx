'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Trash2, Radio, Clock, Swords } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Lobby {
    id: string
    created_at: string
    passcode: string
    status: string
    game_modes: {
        name: string
    }
}

import { closeLobby } from "@/actions/lobbyActions"
import { toast } from "sonner"

export function ActiveOperationsList({ lobbies }: { lobbies: Lobby[] }) {

    const handleDecommission = async (lobbyId: string) => {
        if (!confirm('WARNING: TERMINATE OPERATION? This will disconnect all active agents.')) return

        try {
            const result = await closeLobby(lobbyId)
            if (result.success) {
                toast.success("Operation Terminated", {
                    description: "Signal lost. Sector secured.",
                })
            } else {
                toast.error("Termination Failed", {
                    description: result.message
                })
            }
        } catch (error) {
            toast.error("System Failure")
        }
    }

    if (!lobbies.length) {
        return (
            <Card className="h-full bg-black/40 border-cyan-500/20 backdrop-blur-md overflow-hidden flex flex-col items-center justify-center text-zinc-500 font-mono tracking-widest text-sm">
                NO ACTIVE OPERATIONS DETECTED.
            </Card>
        )
    }

    return (
        <Card className="h-full bg-black/30 backdrop-blur-xl border border-white/10 border-t-white/20 overflow-hidden flex flex-col shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
            <CardHeader className="pb-2 border-b border-white/5">
                <CardTitle className="flex items-center gap-2 text-cyan-400 font-orbitron tracking-wider text-lg">
                    <Activity className="h-5 w-5" />
                    LIVE OPERATIONS
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col">
                    {/* Header Row */}
                    <div className="grid grid-cols-[80px_1fr_100px_50px] gap-2 px-4 py-2 text-xs font-mono text-zinc-500 uppercase tracking-wider bg-white/5 border-b border-white/5">
                        <div>Start</div>
                        <div>Operation</div>
                        <div>Status</div>
                        <div className="text-right">Act</div>
                    </div>

                    {/* List Items */}
                    {lobbies.map((op) => (
                        <div
                            key={op.id}
                            className="grid grid-cols-[80px_1fr_100px_50px] gap-2 items-center px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors group"
                        >
                            {/* Start Time */}
                            <div className="font-mono text-zinc-400 flex items-center gap-1.5 text-sm">
                                <Clock className="h-3 w-3 opacity-50" />
                                {new Date(op.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>

                            {/* Game Name */}
                            <div className="flex items-center gap-2 font-medium text-zinc-200">
                                <div className="h-6 w-6 rounded bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5">
                                    <Swords className="h-3 w-3 text-zinc-500" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="truncate">{op.game_modes?.name || 'Unknown Operation'}</span>
                                    {op.passcode && (
                                        <span className="text-[10px] text-cyan-500/70 font-mono tracking-widest">
                                            KEY: {op.passcode}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                                {op.status === 'LIVE' && (
                                    <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10 animate-pulse-slow relative font-mono text-xs pl-4 w-fit">
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-red-500" />
                                        LIVE
                                    </Badge>
                                )}
                                {op.status === 'PENDING' && (
                                    <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10 font-mono text-xs animate-pulse w-fit">
                                        PENDING
                                    </Badge>
                                )}
                                {op.status === 'finished' && (
                                    <Badge variant="secondary" className="text-zinc-500 bg-zinc-800/50 font-mono text-xs border-transparent w-fit">
                                        ENDED
                                    </Badge>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => handleDecommission(op.id)}
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-colors hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>

            {/* Footer / Status Line */}
            <div className="p-2 bg-black/20 border-t border-white/5">
                <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono uppercase tracking-widest px-2">
                    <span>Sys.Monitor_v1.0</span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/50" />
                        Connected
                    </span>
                </div>
            </div>
        </Card>
    )
}
