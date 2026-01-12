'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, Clock, Shield, AlertTriangle, MessageSquare, Copy, LogOut, CheckCircle, Play, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { toggleReady, joinLobby, leaveLobby, initializeMatchSequence, acceptMatchHandshake } from '@/actions/lobbyActions';
import { deleteLobby } from '@/actions/deleteLobby';
import { toast } from 'sonner';

import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { MatchFoundOverlay } from './MatchFoundOverlay';

interface LobbyWorkspaceProps {
    lobbyId: string;
    currentUserId: string;
}

export function LobbyWorkspace({ lobbyId, currentUserId }: LobbyWorkspaceProps) {
    const router = useRouter();
    const onLeave = () => router.back();

    const [lobby, setLobby] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [players, setPlayers] = useState<any[]>([]);
    const [discordUserId, setDiscordUserId] = useState<string | null>(null);
    const [authUserId, setAuthUserId] = useState<string | null>(null);
    const [toggling, setToggling] = useState(false);
    const [isDissolving, setIsDissolving] = useState(false);
    const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showMatchOverlay, setShowMatchOverlay] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Connecting to Match Server...');


    const supabase = createClient();

    // Dynamic Permission Logic (Identity Lock Hook) - MOVED TO TOP LEVEL
    const isCommander = useMemo(() => {
        if (!authUserId || !lobby) return false;
        return String(authUserId) === String(lobby.creator_id);
    }, [authUserId, lobby]);

    // Real-Time Force Update Logger - MOVED TO TOP LEVEL
    useEffect(() => {
        // Task 2: Verify Data Flow
        console.log("Commander Check:", { myId: authUserId, creatorId: lobby?.creator_id });

        if (process.env.NODE_ENV === 'development') {
            console.log("[LOBBY AUTH]", {
                me: authUserId,
                owner: lobby?.creator_id,
                match: String(authUserId) === String(lobby?.creator_id)
            });
        }
    }, [authUserId, lobby]);

    // Match Status Watcher
    useEffect(() => {
        if (lobby?.status === 'starting') {
            setShowMatchOverlay(true);
        }
        // Redirect Logic: Live + Match ID = Go
        if (lobby?.status === 'live' && lobby?.match_id) {
            router.push(`/dashboard/play/match/${lobby.match_id}`);
        }
    }, [lobby?.status, lobby?.match_id]);

    useEffect(() => {
        let channel: any;

        const init = async () => {
            // 1. Get User (Active Session)
            const { data: { user } } = await supabase.auth.getUser();
            const discordId = user?.identities?.find(i => i.provider === 'discord')?.id;

            setDiscordUserId(discordId || null);
            setAuthUserId(user?.id || null);

            // 2. Fetch Lobby
            await fetchLobby();
            setLoading(false);
        };

        const fetchLobby = async () => {
            const { data: lobbyData, error } = await supabase
                .from('lobbies')
                .select(`
                    *,
                    lobby_players (
                        *,
                        player:players!lobby_players_user_id_fkey (
                            username,
                            avatar_url
                        )
                    ),
                    game_modes (*)
                `)
                .eq('id', lobbyId)
                .single();

            console.log("Game Mode Data:", lobbyData?.game_modes);

            if (error) {
                console.error("Error fetching lobby workspace:", error);
                setError("Connection Lost to Sector Signal.");
            } else {
                setLobby(lobbyData);
                const sortedPlayers = (lobbyData.lobby_players || []).sort((a: any, b: any) => {
                    if (a.user_id === lobbyData.creator_id) return -1;
                    if (b.user_id === lobbyData.creator_id) return 1;
                    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
                });
                setPlayers(sortedPlayers);
            }
        };

        init();

        channel = supabase
            .channel(`lobby:${lobbyId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'lobby_players', filter: `lobby_id=eq.${lobbyId}` },
                (payload) => {
                    console.log("Lobby Player Update:", payload);
                    fetchLobby();
                }
            )
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'lobbies', filter: `id=eq.${lobbyId}` },
                (payload) => {
                    fetchLobby();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setConnectionStatus('Connected');
                } else if (status === 'CHANNEL_ERROR') {
                    setConnectionStatus('Connection Error');
                } else if (status === 'TIMED_OUT') {
                    setConnectionStatus('Connection Timed Out');
                }
            });

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [lobbyId]);

    // ... (rest of handlers)

    const handleCopyKey = () => {
        if (lobby?.sector_key) {
            navigator.clipboard.writeText(lobby.sector_key);
            toast.success("Sector Key copied");
        }
    };

    const handleToggleReady = async () => {
        setToggling(true);
        const res = await toggleReady(lobbyId);
        setToggling(false);
        if (res.success) {
            toast.success(res.message);
        } else {
            toast.error(res.message);
        }
    };

    const handleJoin = async () => {
        setLoading(true);
        const res = await joinLobby(lobbyId);
        setLoading(false);
        if (res.success) {
            toast.success(res.message);
            // Re-fetch handled by Realtime
        } else {
            toast.error(res.message);
        }
    };

    const handleLeave = () => {
        setShowLeaveConfirm(true);
    };

    const executeLeave = async () => {
        setShowLeaveConfirm(false);
        setLoading(true);
        const res = await leaveLobby(lobbyId);

        if (res.success) {
            toast.success(res.message);
            router.push('/dashboard/play'); // Return to Arena
        } else {
            setLoading(false);
            toast.error(res.message);
        }
    };

    const handleDissolve = async () => {
        setIsDissolving(true);
        setShowDissolveConfirm(false); // Close modal
        try {
            await deleteLobby(lobbyId);
        } catch (e: any) {
            setError(e.message);
            setIsDissolving(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-zinc-500 animate-pulse">Establishing Uplink...</div>;
    if (error) return <div className="p-12 text-center text-red-500 border border-red-500/20 bg-red-500/10 rounded-xl">{error} <Button variant="ghost" onClick={onLeave} className="ml-4">Return</Button></div>;

    // Determine Theme
    let themeColor = "cyan";
    let borderColor = "border-cyan-500/20";
    let glowColor = "shadow-cyan-500/10";
    let bgGradient = "from-cyan-900/20 to-cyan-500/5";

    if (lobby.is_tournament) {
        themeColor = "purple";
        borderColor = "border-purple-500/20";
        glowColor = "shadow-purple-500/10";
        bgGradient = "from-purple-900/20 to-purple-500/5";
    } else if (lobby.sector_key) {
        themeColor = "orange";
        borderColor = "border-orange-500/20";
        glowColor = "shadow-orange-500/10";
        bgGradient = "from-orange-900/20 to-orange-500/5";
    }

    const maxPlayers = (lobby.game_modes?.team_size || 5) * 2;
    const allReady = players.length > 0 && players.every(p => p.is_ready);
    // FIX: Match against authUserId (UUID) not discordUserId
    const currentUserPlayer = players.find(p => p.user_id === authUserId);
    const isMeReady = currentUserPlayer?.is_ready;



    return (
        <div className={`space-y-6 animate-in fade-in zoom-in duration-300`}>
            {/* Header / StatusBar */}
            <div className={`w-full p-6 rounded-2xl border ${borderColor} bg-gradient-to-r ${bgGradient} relative overflow-hidden transition-all duration-500 ${allReady ? `shadow-[0_0_50px_rgba(34,197,94,0.1)] border-green-500/30` : ''}`}>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <div className={`flex items-center gap-2 text-${themeColor}-400 mb-1 font-mono text-xs uppercase tracking-widest`}>
                            <Shield className="w-4 h-4" />
                            SECURE WORKSPACE // {lobby.region} <span className="text-zinc-600">|</span> <span className={connectionStatus === 'Connected' ? 'text-green-500' : 'text-yellow-500 animate-pulse'}>{connectionStatus}</span>
                        </div>
                        <h1 className="text-3xl font-heading font-bold text-white uppercase tracking-wider">{lobby.game_modes?.name || "Unknown Operation"}</h1>
                        <div className="flex items-center gap-4 mt-4">
                            <span className="px-3 py-1 bg-black/40 rounded border border-white/5 text-xs text-zinc-400 font-mono">
                                ID: {lobby.id.slice(0, 8)}
                            </span>
                            {lobby.sector_key && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={`h-7 text-xs border-${themeColor}-500/50 text-${themeColor}-400 hover:bg-${themeColor}-500/10`}
                                    onClick={handleCopyKey}
                                >
                                    <Copy className="w-3 h-3 mr-2" />
                                    KEY: {lobby.sector_key}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        {/* Commander / Player Controls */}
                        {/* Commander / Player Controls */}
                        <div className="flex items-center gap-2">
                            {/* 1. Ready State (Only if joined) */}
                            {currentUserPlayer && (
                                <Button
                                    onClick={handleToggleReady}
                                    disabled={toggling}
                                    className={`h-12 px-8 font-bold font-orbitron tracking-widest border transition-all duration-300 ${isMeReady
                                        ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                        : (() => {
                                            // Dynamic Theme Logic
                                            if (lobby.is_tournament) return 'bg-purple-600 hover:bg-purple-500 border-purple-500 ring-purple-500/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]';
                                            if (isCommander) return 'bg-blue-600 hover:bg-blue-500 border-blue-500 ring-blue-500/50 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]';
                                            return 'bg-lime-600 hover:bg-lime-500 border-lime-500 ring-lime-500/50 text-black shadow-[0_0_15px_rgba(101,163,13,0.4)]';
                                        })()
                                        }`}
                                >
                                    {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        isMeReady ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                READY (PRESS TO CANCEL)
                                            </>
                                        ) : "READY UP"
                                    )}
                                </Button>
                            )}

                            {/* 2. Membership Action (Priority Order) */}
                            {(() => {
                                // Task 1: Strict Priority: Commander > Player > Visitor
                                if (isCommander) {
                                    return (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setShowDissolveConfirm(true)}
                                            disabled={isDissolving}
                                            className="h-12 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-4"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    );
                                } else if (currentUserPlayer) {
                                    return (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleLeave}
                                            className="h-12 text-zinc-500 hover:text-white px-4 border border-transparent hover:border-zinc-700"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </Button>
                                    );
                                } else {
                                    // Visitor -> Join
                                    return (
                                        <Button
                                            onClick={handleJoin}
                                            className={`h-12 px-8 font-bold font-orbitron tracking-widest border bg-${themeColor}-500 text-black hover:bg-${themeColor}-400 border-${themeColor}-400`}
                                        >
                                            JOIN OPERATION
                                        </Button>
                                    );
                                }
                            })()}
                        </div>
                        <Button
                            onClick={onLeave}

                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 font-medium text-sm hover:text-white hover:border-zinc-600 hover:bg-zinc-900 transition-all duration-200"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            RETURN TO ARENA
                        </Button>
                    </div>
                </div>

                <ConfirmModal
                    isOpen={showDissolveConfirm}
                    onOpenChange={setShowDissolveConfirm}
                    title="WARNING: SIGNAL TERMINATION"
                    description="Confirm Sector Dissolution? This cannot be undone."
                    onConfirm={handleDissolve}
                    onCancel={() => setShowDissolveConfirm(false)}
                    isDestructive={true}
                    confirmText="DISSOLVE SECTOR"
                    cancelText="ABORT"
                />

                <ConfirmModal
                    isOpen={showLeaveConfirm}
                    onOpenChange={setShowLeaveConfirm}
                    title="WARNING: ABORT MISSION"
                    description="Are you sure you want to leave this operation? You will be disconnected from the sector."
                    onConfirm={executeLeave}
                    onCancel={() => setShowLeaveConfirm(false)}
                    isDestructive={true}
                    confirmText="ABORT OPERATION"
                    cancelText="STAY"
                />

                {/* Match Overlay */}
                {showMatchOverlay && (
                    <MatchFoundOverlay
                        onAccept={async () => {
                            console.log("Attempting to accept match for lobby:", lobbyId);
                            try {
                                const res = await acceptMatchHandshake(lobbyId);
                                console.log("Accept Result:", res);

                                if (res.success) {
                                    if (res.matchStarted && res.matchId) {
                                        router.push(`/dashboard/play/match/${res.matchId}`);
                                    }
                                    return true; // Signal success to overlay
                                } else {
                                    toast.error(res.message);
                                    return false; // Signal failure
                                }
                            } catch (e) {
                                console.error("Accept Handler Error:", e);
                                toast.error("Communication Breakdown.");
                                return false;
                            }
                        }}
                    />
                )}

                {/* Real-Time Occupancy Bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                    <div
                        className={`h-full bg-${themeColor}-500 transition-all duration-700 ease-out`}
                        style={{ width: `${Math.min(100, (players.length / maxPlayers) * 100)}%` }}
                    />
                </div>

                {/* Decorative Elements */}
                <div className={`absolute -right-10 -bottom-20 w-64 h-64 bg-${themeColor}-500/10 blur-[80px] rounded-full pointing-events-none`} />
            </div>

            {/* Mission Ready Banner */}
            {allReady && (
                <div className="w-full bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-500/20 rounded-full text-green-400 animate-pulse">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-green-400 font-bold font-orbitron tracking-widest text-lg">MISSION READY</h3>
                            <p className="text-green-500/70 text-sm font-mono">All operatives are standing by. Deployment authorized.</p>
                        </div>
                    </div>

                    {isCommander ? (
                        <Button
                            onClick={async () => {
                                const res = await initializeMatchSequence(lobbyId);
                                if (!res.success) toast.error(res.message);
                            }}
                            className="bg-green-500 hover:bg-green-400 text-black font-bold h-10 px-6 font-orbitron tracking-widest shadow-lg shadow-green-500/20 animate-pulse transition-all hover:scale-105"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            INITIALIZE MATCH
                        </Button>
                    ) : (
                        <div className="text-zinc-500 font-mono text-sm animate-pulse">
                            Waiting for Commander...
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Roster */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-black/40 border border-white/5 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className={`w-5 h-5 text-${themeColor}-500`} />
                            <h3 className="text-lg font-bold text-white">Active Roster</h3>
                            <span className="ml-auto text-xs font-mono text-zinc-500">{players.length} / {maxPlayers} OPERATIVES</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {players.map((p: any) => (
                                <div
                                    key={p.user_id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${p.is_ready
                                        ? 'bg-green-500/5 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                        : 'bg-white/5 border-white/5'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded bg-zinc-900 border flex items-center justify-center text-zinc-500 relative ${p.is_ready ? 'border-green-500/50' : 'border-white/10'}`}>
                                        {p.player?.avatar_url ? (
                                            <img src={p.player.avatar_url} alt="" className="w-full h-full rounded object-cover" />
                                        ) : (
                                            <Users className={`w-5 h-5 ${p.is_ready ? 'text-green-500' : ''}`} />
                                        )}
                                        {p.user_id === lobby.creator_id && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-black" title="Lobby Host" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-bold truncate ${p.is_ready ? 'text-green-400' : 'text-white'}`}>
                                            {p.player?.username || "Unknown Operative"}
                                        </div>
                                        <div className={`text-[10px] uppercase font-mono ${p.is_ready ? 'text-green-500/70' : 'text-zinc-500'}`}>
                                            {p.is_ready ? 'READY FOR DEPLOYMENT' : 'PREPARING...'}
                                        </div>
                                    </div>
                                    {p.is_ready && <CheckCircle className="w-5 h-5 text-green-500 animate-in zoom-in spin-in-90 duration-300" />}
                                </div>
                            ))}
                            {/* Placeholder - will verify file firsts */}
                            {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, i) => (
                                <div key={`placeholder-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 border-dashed opacity-50">
                                    <div className="w-10 h-10 rounded bg-transparent border border-white/10 flex items-center justify-center text-zinc-700">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div className="text-sm text-zinc-600 font-mono italic">
                                        SEARCHING FOR SIGNAL...
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Tactical Briefing */}
                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/5 rounded-xl p-6 backdrop-blur-sm h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                            <MessageSquare className={`w-5 h-5 text-${themeColor}-500`} />
                            <h3 className="text-lg font-bold text-white">Tactical Briefing</h3>
                        </div>
                        <div className="space-y-4 flex-1">
                            <div className="p-4 rounded bg-[#020205] border border-white/5 min-h-[200px] text-sm text-zinc-400 font-mono whitespace-pre-wrap overflow-y-auto max-h-[400px]">
                                {(lobby.game_modes?.description || lobby.game_modes?.rules || lobby.game_modes?.lore) ? (
                                    <>
                                        <div className="mb-2 text-green-500 font-bold uppercase border-b border-green-500/20 pb-1">
                                            {'>'} STANDARD PROTOCOLS
                                        </div>
                                        {lobby.game_modes.description || lobby.game_modes.rules || lobby.game_modes.lore}
                                        <br /><br />
                                        {allReady && <span className="text-green-500">{'>'} SQUADRON READY. AWAITING LAUNCH COMMAND.<br /></span>}
                                        <span className="animate-pulse">_</span>
                                    </>
                                ) : (
                                    <>
                                        {'>'} ESTABLISHING SECURE CONNECTION... [OK]<br />
                                        {'>'} WAITING FOR HOST DEPLOYMENT...<br />
                                        {lobby.sector_key && <> {'>'} SECTOR IS ENCRYPTED. KEY REQUIRED.<br /></>}
                                        {allReady && <span className="text-green-500">{'>'} SQUADRON READY. AWAITING LAUNCH COMMAND.<br /></span>}
                                        <span className="animate-pulse">_</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-auto">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Official match rules are active.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
