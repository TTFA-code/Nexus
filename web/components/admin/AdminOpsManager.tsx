'use client'

import { useState, useEffect } from 'react'
import { TournamentCreator } from './TournamentCreator'
import { ActiveOps } from './ActiveOps'
import { getActiveLobbies } from '@/actions/getAdminIntel'
import { getGuildMatchHistory, getGuildMemberActivity } from '@/actions/adminActions'
import { GameTrackingTable } from './GameTrackingTable'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'
import { Activity, Rocket, History } from 'lucide-react'

interface AdminOpsManagerProps {
    initialLobbies: any[]
    guildId: string
    gameModes: any[]
    allGames: any[]
}

export function AdminOpsManager({ initialLobbies, guildId, gameModes, allGames }: AdminOpsManagerProps) {
    const [activeTab, setActiveTab] = useState<'DEPLOY' | 'LIVE' | 'HISTORY'>('DEPLOY')
    const [historyViewMode, setHistoryViewMode] = useState<'GUILD' | 'MEMBERS'>('GUILD')

    const [lobbies, setLobbies] = useState(initialLobbies)
    const [historicGames, setHistoricGames] = useState<any[]>([])
    const supabase = createClient()

    // Match History Fetcher
    const fetchHistory = async () => {
        if (historyViewMode === 'GUILD') {
            const history = await getGuildMatchHistory(guildId)
            setHistoricGames(history)
        } else {
            const activity = await getGuildMemberActivity(guildId)
            setHistoricGames(activity)
        }
    }

    // Initial Fetch
    useEffect(() => {
        fetchHistory()
    }, [guildId, historyViewMode])

    useEffect(() => {
        const channel = supabase
            .channel('admin-ops-manager')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lobbies'
                },
                async () => {
                    // Refresh data on any lobby change
                    const freshData = await getActiveLobbies(guildId)
                    setLobbies(freshData)
                    // Also refresh history as a lobby might have finished
                    fetchHistory()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [guildId, historyViewMode]) // Add historyViewMode dependency to ensure correct fetch logic

    const handleLobbyCreated = (newLobby: any) => {
        setLobbies(prev => [newLobby, ...prev])
        // Auto switch to monitor when created
        setActiveTab('LIVE')
    }

    const handleForceClose = (lobbyId: string) => {
        setLobbies(prev => prev.filter(l => l.id !== lobbyId))
    }

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-lg w-fit backdrop-blur-md">
                <button
                    onClick={() => setActiveTab('DEPLOY')}
                    className={cn(
                        "px-4 py-2 text-xs font-bold font-orbitron tracking-wider rounded flex items-center gap-2 transition-all",
                        activeTab === 'DEPLOY'
                            ? "bg-pink-600/20 text-pink-400 border border-pink-500/50 shadow-[0_0_10px_rgba(219,39,119,0.2)]"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                    )}
                >
                    <Rocket className="w-3 h-3" />
                    DEPLOYMENT
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button
                    onClick={() => setActiveTab('LIVE')}
                    className={cn(
                        "px-4 py-2 text-xs font-bold font-orbitron tracking-wider rounded flex items-center gap-2 transition-all",
                        activeTab === 'LIVE'
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                    )}
                >
                    <Activity className="w-3 h-3" />
                    LIVE OPS
                    {lobbies.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/20 rounded text-[10px] text-emerald-400">
                            {lobbies.length}
                        </span>
                    )}
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button
                    onClick={() => setActiveTab('HISTORY')}
                    className={cn(
                        "px-4 py-2 text-xs font-bold font-orbitron tracking-wider rounded flex items-center gap-2 transition-all",
                        activeTab === 'HISTORY'
                            ? "bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.2)]"
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                    )}
                >
                    <History className="w-3 h-3" />
                    ARCHIVES
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0">
                {activeTab === 'DEPLOY' && (
                    <div className="max-w-5xl mx-auto h-full overflow-y-auto custom-scrollbar pr-2">
                        <TournamentCreator
                            gameModes={gameModes}
                            allGames={allGames}
                            guildId={guildId}
                            onCreated={handleLobbyCreated}
                        />
                    </div>
                )}

                {activeTab === 'LIVE' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <ActiveOps
                            lobbies={lobbies}
                            guildId={guildId}
                            onForceClose={handleForceClose}
                        />
                    </div>
                )}

                {activeTab === 'HISTORY' && (
                    <div className="h-full">
                        <GameTrackingTable
                            games={historicGames}
                            viewMode={historyViewMode}
                            onViewChange={setHistoryViewMode}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
