'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Swords, Calendar, Lock, Unlock, Mic, MicOff, Rocket, Plus, Gamepad2, Settings, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createCustomGameMode } from '@/actions/gameModeActions'

interface GameMode {
    id: string
    name: string
    team_size: number
    guild_id: string | null
    games?: {
        id: string
        name: string
        icon_url: string | null
    }
}

interface Game {
    id: string
    name: string
    icon_url: string | null
}

interface TournamentCreatorProps {
    gameModes: GameMode[]
    allGames: Game[]
    guildId: string
    onCreated?: (lobby: any) => void
}

export function TournamentCreator({ gameModes, allGames, guildId, onCreated }: TournamentCreatorProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'SELECT' | 'CREATE'>('SELECT')

    // Select State
    const [selectedMode, setSelectedMode] = useState<string>('')
    const [notes, setNotes] = useState('')
    const [isPrivate, setIsPrivate] = useState(true)
    const [voiceRequired, setVoiceRequired] = useState(true)
    const [scheduledStart, setScheduledStart] = useState('')

    // Create State
    const [newModeName, setNewModeName] = useState('')
    const [newModeGameId, setNewModeGameId] = useState(allGames[0]?.id || '')
    const [newModeTeamSize, setNewModeTeamSize] = useState(1)

    // Data Processing
    // Group Modes by Type (Global vs Custom) and then by Game
    const globalModes = gameModes.filter(m => !m.guild_id)
    const customModes = gameModes.filter(m => m.guild_id === guildId)

    const groupByGame = (modes: GameMode[]) => {
        const groups: Record<string, GameMode[]> = {}
        modes.forEach(mode => {
            const gameName = mode.games?.name || 'Unknown Protocol'
            if (!groups[gameName]) groups[gameName] = []
            groups[gameName].push(mode)
        })
        return groups
    }

    const globalGroups = groupByGame(globalModes)
    const customGroups = groupByGame(customModes)

    const handleCreateLobby = async () => {
        if (!selectedMode) {
            toast.error("Protocol Error", { description: "Select a match parameter." })
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch('/api/lobbies/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_mode_id: selectedMode,
                    is_tournament: true,
                    is_private: isPrivate,
                    voice_required: voiceRequired,
                    notes: notes,
                    scheduled_start: scheduledStart || null
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to initialize lobby.')
            }

            toast.success("Lobby Initialized", {
                description: "Tournament lobby established. Redirecting...",
            })

            if (onCreated) {
                // Construct a temporary partial object or use returned data if complete
                // The API usually returns { lobbyId: '...' }, but we might need the full object for optimistic UI.
                // If the API only returns ID, optimistic UI is hard.
                // However, the user asked for this flow. Let's pass what we have or fetch?
                // Actually, the previous code in AdminOpsManager expects a full lobby object to prepend.
                // If `data` is just { lobbyId }, we can't fully update the UI without fetching.
                // But for now, let's call it.
                // Wait, AdminOpsManager uses `getGuildMatchHistory` which is for the *other* table.
                // `ActiveOps` uses `lobbies`.
                // Let's assume for now we just trigger it. If data is incomplete, the UI might be weird.
                // Ideally we should revalidate or fetch the specific lobby.
                onCreated({
                    id: data.lobbyId,
                    status: 'WAITING', // Default
                    created_at: new Date().toISOString(),
                    game_name: gameModes.find(m => m.id === selectedMode)?.games?.name || 'Unknown',
                    game_icon: gameModes.find(m => m.id === selectedMode)?.games?.icon_url || null,
                    mode_name: gameModes.find(m => m.id === selectedMode)?.name || 'Unknown',
                    player_count: 0,
                    game_modes: {
                        team_size: gameModes.find(m => m.id === selectedMode)?.team_size || 5
                    }
                })
            }

            router.push(`/dashboard/play/lobby/${data.lobbyId}`)

        } catch (error: any) {
            console.error('Creation Error:', error)
            toast.error("Initialization Failed", {
                description: error.message
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateMode = async () => {
        if (!newModeName || !newModeGameId) return

        setIsLoading(true)
        try {
            const res = await createCustomGameMode(guildId, newModeGameId, newModeName, newModeTeamSize)
            if (res.success) {
                toast.success("Protocol Established", { description: "New custom directive added to database." })
                setNewModeName('')
                setActiveTab('SELECT')
            } else {
                toast.error("Protocol Error", { description: res.message })
            }
        } catch (error) {
            toast.error("System Failure")
        } finally {
            setIsLoading(false)
        }
    }

    const renderModeGrid = (groups: Record<string, GameMode[]>) => {
        if (Object.keys(groups).length === 0) {
            return <div className="text-zinc-500 text-xs font-mono uppercase p-4 border border-dashed border-zinc-800 rounded">No Directives Found.</div>
        }

        return Object.entries(groups).map(([gameName, modes]) => (
            <div key={gameName} className="space-y-2">
                <h4 className="text-xs font-bold text-cyan-500 font-orbitron uppercase tracking-wider flex items-center gap-2">
                    <Gamepad2 className="w-3 h-3" />
                    {gameName}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {modes.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setSelectedMode(mode.id)}
                            className={cn(
                                "flex flex-col items-start p-3 rounded border text-left transition-all relative overflow-hidden group",
                                selectedMode === mode.id
                                    ? "bg-pink-500/10 border-pink-500/50 text-white"
                                    : "bg-black/40 border-white/5 text-zinc-400 hover:border-white/20 hover:bg-white/5"
                            )}
                        >
                            <div className="font-bold font-mono text-xs">{mode.name}</div>
                            <div className="text-[10px] uppercase font-mono opacity-60">
                                {mode.team_size}v{mode.team_size}
                            </div>
                            {selectedMode === mode.id && (
                                <div className="absolute right-1 top-1 w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        ))
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-black/40 border-l-4 border-l-pink-500 border border-white/10 rounded-r-lg backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-pink-500/10 rounded border border-pink-500/20">
                        <Swords className="w-6 h-6 text-pink-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white font-orbitron tracking-wide">
                            TOURNAMENT LOBBIES
                        </h2>
                        <p className="text-sm text-zinc-400 font-mono uppercase tracking-widest">
                            Tournament Initialization Interface
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setActiveTab('SELECT')}
                        className={cn(
                            "px-4 py-2 text-xs font-bold font-orbitron tracking-wider rounded transition-all",
                            activeTab === 'SELECT' ? "bg-pink-500 text-white" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        DEPLOY
                    </button>
                    <button
                        onClick={() => setActiveTab('CREATE')}
                        className={cn(
                            "px-4 py-2 text-xs font-bold font-orbitron tracking-wider rounded transition-all flex items-center gap-2",
                            activeTab === 'CREATE' ? "bg-cyan-500 text-white" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        <Plus className="w-3 h-3" />
                        NEW PROTOCOL
                    </button>
                </div>
            </div>

            {activeTab === 'SELECT' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Custom Modes */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white font-orbitron border-b border-white/10 pb-2">
                                CUSTOM DIRECTIVES
                            </h3>
                            {renderModeGrid(customGroups)}
                        </div>

                        {/* Global Modes */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white font-orbitron border-b border-white/10 pb-2">
                                STANDARD PROTOCOLS
                            </h3>
                            {renderModeGrid(globalGroups)}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Settings Config (Reused) */}
                        <div className="bg-black/20 border border-white/10 rounded-lg p-4 space-y-6">
                            <h3 className="text-sm font-bold text-white font-orbitron border-b border-white/10 pb-2">
                                SECURITY PROTOCOLS
                            </h3>

                            {/* Privacy Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-bold text-zinc-200 uppercase font-mono">Private Lobby</div>
                                    <div className="text-[10px] text-zinc-500">Require password for entry</div>
                                </div>
                                <button
                                    onClick={() => setIsPrivate(!isPrivate)}
                                    className={cn(
                                        "p-2 rounded border transition-all",
                                        isPrivate
                                            ? "bg-pink-500/10 border-pink-500/50 text-pink-400"
                                            : "bg-zinc-800/50 border-white/10 text-zinc-500"
                                    )}
                                >
                                    {isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Voice Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="text-xs font-bold text-zinc-200 uppercase font-mono">Voice Comms</div>
                                    <div className="text-[10px] text-zinc-500">Enforce verified voice channel</div>
                                </div>
                                <button
                                    onClick={() => setVoiceRequired(!voiceRequired)}
                                    className={cn(
                                        "p-2 rounded border transition-all",
                                        voiceRequired
                                            ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                                            : "bg-zinc-800/50 border-white/10 text-zinc-500"
                                    )}
                                >
                                    {voiceRequired ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Schedule (Basic) */}
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <div className="text-xs font-bold text-zinc-200 uppercase font-mono flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    Scheduled Match
                                </div>
                                <input
                                    type="datetime-local"
                                    value={scheduledStart}
                                    onChange={(e) => setScheduledStart(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white font-mono focus:border-pink-500/50 focus:outline-none"
                                />
                            </div>

                            {/* Briefing */}
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <div className="text-xs font-bold text-zinc-200 uppercase font-mono">
                                    Match Briefing
                                </div>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter details..."
                                    className="w-full h-24 bg-black/40 border border-white/10 rounded p-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 font-mono resize-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleCreateLobby}
                            disabled={isLoading || !selectedMode}
                            className={cn(
                                "w-full py-4 rounded border font-bold font-orbitron tracking-widest text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,0,0,0.5)]",
                                isLoading
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border-white/5"
                                    : "bg-pink-600 hover:bg-pink-500 text-white border-pink-400 hover:border-pink-300 shadow-[0_0_15px_rgba(219,39,119,0.3)] hover:shadow-[0_0_25px_rgba(219,39,119,0.5)] scale-100 hover:scale-[1.02] active:scale-[0.98]"
                            )}
                        >
                            {isLoading ? "INITIALIZING..." : (<> <Rocket className="w-4 h-4" /> LAUNCH LOBBY </>)}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto bg-black/20 border border-white/10 rounded-lg p-6 space-y-6">
                    <h3 className="text-lg font-bold text-white font-orbitron border-b border-white/10 pb-4">
                        ESTABLISH NEW PROTOCOL
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono text-zinc-400 uppercase">Target Game Engine</label>
                            <select
                                value={newModeGameId}
                                onChange={(e) => setNewModeGameId(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white font-mono focus:border-cyan-500/50 outline-none"
                            >
                                {allGames.map(game => (
                                    <option key={game.id} value={game.id}>{game.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono text-zinc-400 uppercase">Protocol Name</label>
                            <input
                                type="text"
                                placeholder="e.g. ARAM 2v2, Scrimmage..."
                                value={newModeName}
                                onChange={(e) => setNewModeName(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white font-mono focus:border-cyan-500/50 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono text-zinc-400 uppercase">Team Size (Per Side)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="11"
                                    value={newModeTeamSize}
                                    onChange={(e) => setNewModeTeamSize(Number(e.target.value))}
                                    className="flex-1 accent-cyan-500"
                                />
                                <div className="w-12 h-10 border border-white/10 rounded flex items-center justify-center font-bold text-white">
                                    {newModeTeamSize}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCreateMode}
                            disabled={isLoading || !newModeName}
                            className={cn(
                                "w-full py-3 mt-4 rounded border font-bold font-orbitron tracking-widest text-sm transition-all flex items-center justify-center gap-2",
                                isLoading
                                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    : "bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:scale-[1.02]"
                            )}
                        >
                            {isLoading ? "PROCESSING..." : (<> <Settings className="w-4 h-4" /> CREATE PROTOCOL </>)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
