'use client'

import { useState } from 'react'
import { closeLobby } from '@/actions/lobbyActions'
import { ShieldAlert, Users, Activity, Swords, Gamepad2, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

interface ActiveLobby {
    id: string
    status: string
    created_at: string
    game_name: string
    game_icon: string | null
    mode_name: string
    player_count: number
    game_modes: {
        team_size: number
    }
}

interface ActiveOpsProps {
    lobbies: ActiveLobby[]
    guildId: string
}

export function ActiveOps({ lobbies, guildId, onForceClose }: ActiveOpsProps & { onForceClose: (id: string) => void }) {
    const [closingId, setClosingId] = useState<string | null>(null)
    const [confirmId, setConfirmId] = useState<string | null>(null)

    const initiateClose = (lobbyId: string) => {
        setConfirmId(lobbyId);
    }

    const executeClose = async () => {
        if (!confirmId) return;
        const lobbyId = confirmId; // Capture ID

        setConfirmId(null);
        setClosingId(lobbyId)

        // Optimistic UI Removal
        onForceClose(lobbyId);

        try {
            const res = await closeLobby(lobbyId)
            if (!res.success) {
                // Determine if we should revert or show error.
                // ideally show toast
                console.error("Failed to close lobby", res.message);
            }
        } catch (error) {
            console.error('Error closing lobby:', error)
        } finally {
            setClosingId(null)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'WAITING': return 'text-cyan-400 border-cyan-500/50 bg-cyan-950/30'
            case 'READY_CHECK': return 'text-yellow-400 border-yellow-500/50 bg-yellow-950/30'
            case 'LIVE': return 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30'
            default: return 'text-zinc-400 border-zinc-500/50 bg-zinc-950/30'
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                    <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white font-orbitron tracking-wide">
                        ACTIVE OPERATIONS
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">
                        LIVE TACTICAL MONITOR
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lobbies.map(lobby => {
                    const maxPlayers = (lobby.game_modes?.team_size || 5) * 2
                    const fillPercent = (lobby.player_count / maxPlayers) * 100

                    return (
                        <div key={lobby.id} className="group relative bg-black/40 border border-white/10 hover:border-white/20 transition-all rounded-lg overflow-hidden backdrop-blur-md">
                            {/* Header */}
                            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <div className="flex items-center gap-2">
                                    {lobby.game_icon ? (
                                        <img src={lobby.game_icon} alt="Game" className="w-6 h-6 rounded" />
                                    ) : (
                                        <Gamepad2 className="w-6 h-6 text-zinc-500" />
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white font-orbitron">{lobby.game_name}</span>
                                        <span className="text-[10px] text-zinc-400 font-mono uppercase">{lobby.mode_name}</span>
                                    </div>
                                </div>
                                <div className={cn("px-2 py-0.5 text-[10px] font-bold border rounded uppercase tracking-wider", getStatusColor(lobby.status))}>
                                    {lobby.status}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-4 space-y-4">
                                {/* Capacity Bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] uppercase font-mono text-zinc-400">
                                        <span>Capacity</span>
                                        <span>{lobby.player_count} / {maxPlayers}</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-500"
                                            style={{ width: `${Math.min(fillPercent, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <button
                                    onClick={() => initiateClose(lobby.id)}
                                    disabled={!!closingId}
                                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-500 text-xs font-bold font-orbitron tracking-widest rounded transition-all flex items-center justify-center gap-2"
                                >
                                    <ShieldAlert className="w-3 h-3" />
                                    {closingId === lobby.id ? 'CLOSING...' : 'FORCE CLOSE'}
                                </button>
                            </div>
                        </div>
                    )
                })}

                {lobbies.length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-500 border border-white/5 rounded-lg border-dashed">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <span className="text-xs font-mono uppercase tracking-widest">No Active Operations</span>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!confirmId}
                onOpenChange={(open) => !open && setConfirmId(null)}
                title="FORCE CLOSE OPERATION"
                description="Are you sure you want to terminate this lobby? This action cannot be undone and all players will be disconnected."
                onConfirm={executeClose}
                onCancel={() => setConfirmId(null)}
                isDestructive={true}
                confirmText="TERMINATE"
                cancelText="ABORT"
            />
        </div>
    )
}
