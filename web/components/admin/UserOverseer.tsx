'use client'

import { useState } from 'react'
import { toggleGuildBan } from '@/actions/manageBans'
import { RefreshCw, ShieldAlert, ShieldCheck, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Player {
    user_id: string
    username: string | null
    avatar_url: string | null
}

interface UserOverseerProps {
    players: Player[]
    bannedUserIds: string[]
    guildId: string
}

export function UserOverseer({ players, bannedUserIds, guildId }: UserOverseerProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const filteredPlayers = players.filter(player =>
        (player.username?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
        player.user_id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleBanToggle = async (userId: string) => {
        setIsLoading(userId)
        try {
            await toggleGuildBan(guildId, userId)
        } catch (error) {
            console.error('Failed to toggle ban:', error)
        } finally {
            setIsLoading(null)
        }
    }

    return (
        <div className="h-full flex flex-col bg-black/40 border border-white/10 backdrop-blur-md rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white font-orbitron tracking-wide">
                            LOBBY OVERSEER
                        </h3>
                        <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">
                            PERSONNEL MANAGEMENT TERMINAL
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-zinc-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="SEARCH PLAYERS..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-black/20 border border-white/10 rounded-md py-2 pl-9 pr-4 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 w-64 transition-all"
                    />
                </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredPlayers.map((player) => {
                    const isBanned = bannedUserIds.includes(player.user_id)
                    const isProcessing = isLoading === player.user_id

                    return (
                        <div
                            key={player.user_id}
                            className={cn(
                                "group flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 rounded border transition-all duration-300 gap-4 sm:gap-0",
                                isBanned
                                    ? "bg-red-950/20 border-red-900/50 hover:border-red-500/50"
                                    : "bg-black/20 border-white/5 hover:border-cyan-500/30"
                            )}
                        >
                            {/* User Info */}
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border",
                                    isBanned ? "border-red-500/50 bg-red-500/10" : "border-cyan-500/30 bg-cyan-500/10"
                                )}>
                                    {player.avatar_url ? (
                                        <img src={player.avatar_url} alt={player.username || 'User'} className="w-full h-full rounded-full opacity-80" />
                                    ) : (
                                        <span className="text-xs font-mono">{player.username?.substring(0, 2).toUpperCase() || '??'}</span>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm sm:text-base font-bold text-white font-orbitron tracking-wide">
                                        {player.username || 'Unknown Player'}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-mono uppercase">
                                        ID: {player.user_id}
                                    </div>
                                </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-6 w-full sm:w-auto">
                                {/* Status Badge */}
                                <div className={cn(
                                    "px-3 py-1 rounded text-[10px] font-bold tracking-widest border text-center",
                                    isBanned
                                        ? "bg-red-500/20 text-red-400 border-red-500/50"
                                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                )}>
                                    {isBanned ? "BANNED" : "ACTIVE"}
                                </div>

                                {/* Ban Button */}
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => handleBanToggle(player.user_id)}
                                                disabled={!!isLoading}
                                                className={cn(
                                                    "px-4 py-2 rounded text-xs font-bold tracking-wide transition-all border w-full sm:w-auto",
                                                    isBanned
                                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/20"
                                                        : "bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20",
                                                    isProcessing && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                {isProcessing ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : isBanned ? (
                                                    "REINSTATE"
                                                ) : (
                                                    "LOBBY BAN"
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left" className="bg-black/90 border-red-500/50 text-red-500 text-xs font-mono">
                                            {isBanned
                                                ? "Restores player access to this lobby."
                                                : "Warning: This will mark the player's permanent record."
                                            }
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    )
                })}

                {filteredPlayers.length === 0 && (
                    <div className="text-center py-12 text-zinc-500 font-mono text-xs uppercase tracking-widest flex flex-col items-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-zinc-700" />
                        <span>No players match search criteria.</span>
                    </div>
                )}
            </div>
        </div>
    )
}
