'use client';

import { useState, useEffect } from 'react'
import { Users, Swords, Lock, Key, Trophy, User, Loader2, Mic, Timer, Trash2, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { JoinButton } from './JoinButton'
import { useRouter } from 'next/navigation'
import { joinLobby } from '@/actions/lobbyActions'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

function CountdownButton({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const distance = target - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft("DEPLOYMENT READY");
                // In a real app we might trigger a status refresh here
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft(`DEPLOYMENT IN: [${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`);
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <button disabled className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-400 font-mono font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2 cursor-wait border border-zinc-700">
            <Timer className="w-4 h-4 animate-pulse" />
            {timeLeft || "CALCULATING..."}
        </button>
    )
}

interface LobbyCardProps {
    lobby: any
    variant?: 'tournament' | 'hosted' | 'default'
    currentUserId: string | null
    onDissolve: (lobbyId: string, e: React.MouseEvent) => void
    onJoin?: (lobbyId: string, password?: string) => void
}

export function LobbyCard({ lobby, variant = 'default', currentUserId, onDissolve, onJoin }: LobbyCardProps) {
    const router = useRouter();
    const isCommander = currentUserId && lobby.creator_id === currentUserId
    const [isDissolving, setIsDissolving] = useState(false)

    // Check if user is in the lobby_players list (Robust String Comparison)
    const isUserJoined = lobby.lobby_players?.some((p: any) => String(p.user_id) === String(currentUserId));

    // --- PASSWORD MODAL STATE ---
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [isShakeError, setIsShakeError] = useState(false);

    // DEBUG: Diagnose Lockout
    console.log(`[LobbyCard ${lobby.id.slice(0, 4)}]`, {
        me: currentUserId,
        players: lobby.lobby_players?.map((p: any) => p.user_id),
        isUserJoined,
        isCommander,
        creator: lobby.creator_id
    });

    const currentPlayers = lobby.player_count || lobby.lobby_players?.length || 0;
    const maxPlayers = (lobby.game_modes?.team_size || 5) * 2

    // --- STYLING LOGIC ---
    let borderColor = 'border-white/5'
    let hoverColor = 'hover:border-[#ccff00]/50'
    let bgGradient = 'from-[#ccff00]/5'
    let badgeColor = 'border-[#ccff00]/20 text-[#ccff00] bg-[#ccff00]/10'
    let glowShadow = ''

    if (variant === 'tournament') {
        // Strategic Intel (Cyberpunk Pink/Fuchsia)
        borderColor = 'border-fuchsia-500/40'
        hoverColor = 'hover:border-fuchsia-400'
        bgGradient = 'from-fuchsia-500/20'
        badgeColor = 'border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-500/10'
        glowShadow = 'shadow-[0_0_15px_rgba(217,70,239,0.1)]'
    } else if (variant === 'hosted') {
        // Your Lobby (Sky Blue)
        borderColor = 'border-sky-500/40'
        hoverColor = 'hover:border-sky-400'
        bgGradient = 'from-sky-500/20'
        badgeColor = 'border-sky-500/30 text-sky-400 bg-sky-500/10'
    } else if (lobby.is_private) {
        // Private Lobby (Neon Orange)
        borderColor = 'border-orange-500/50'
        hoverColor = 'hover:border-orange-400'
        bgGradient = 'from-orange-500/20'
        badgeColor = 'border-orange-500/30 text-orange-400 bg-orange-500/10'
        glowShadow = 'shadow-[0_0_20px_rgba(249,115,22,0.2)]'
    } else {
        // Public Lobby (Cyberpunk Green)
        borderColor = 'border-[#adff2f]/20'
        hoverColor = 'hover:border-[#adff2f]'
        bgGradient = 'from-[#adff2f]/5'
        badgeColor = 'border-[#adff2f]/20 text-[#adff2f] bg-[#adff2f]/10'
    }

    const handleDissolveWrapped = async (e: React.MouseEvent) => {
        setIsDissolving(true);
        try {
            await onDissolve(lobby.id, e);
        } finally {
            setIsDissolving(false);
        }
    }

    return (
        <div className={`group relative overflow-hidden rounded-3xl bg-black/40 border ${borderColor} ${hoverColor} ${glowShadow} transition-all duration-300 backdrop-blur-md`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />

            {/* Voice Indicator (Top Right) */}
            {lobby.require_vc && (
                <div className="absolute top-4 right-4 z-20">
                    <div className="relative">
                        <div className="absolute inset-0 bg-white rounded-full blur-md opacity-40 animate-pulse" />
                        <div className="relative bg-black/50 p-2 rounded-full border border-white/50 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            <Mic className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 pr-8">
                    <Badge variant="outline" className={`${badgeColor} ${['WAITING', 'PENDING'].includes(lobby.status) ? 'animate-pulse' : ''} shadow-sm backdrop-blur-sm`}>
                        {lobby.type?.toUpperCase() || 'CUSTOM'} {currentPlayers}/{maxPlayers}
                    </Badge>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        {lobby.game_icon && <img src={lobby.game_icon} className="w-8 h-8 rounded-md border border-white/10" alt="" />}
                        <div>
                            <h3 className="text-lg font-bold text-white font-orbitron leading-tight">{lobby.displayProtocol || lobby.game_name}</h3>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1">
                                <span className={lobby.is_private ? "text-orange-500" : "text-[#adff2f]"}>{lobby.game_modes?.name}</span>
                                {lobby.is_private && <Lock className="w-3 h-3 text-orange-500" />}
                                {lobby.require_vc && (
                                    <span className="flex items-center gap-1 text-red-400 font-bold ml-2 border border-red-500/20 px-1.5 py-0.5 rounded bg-red-500/10">
                                        <Mic className="w-3 h-3" /> VOICE COMMS REQUIRED
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5 space-y-1">
                        <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Tactical Briefing</h4>
                        <p className="text-zinc-300 text-xs italic line-clamp-2">
                            "{lobby.notes || lobby.description || 'No match info available.'}"
                        </p>
                    </div>
                </div>

                {/* Host Details */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-white/10 shrink-0 shadow-lg">
                            <AvatarImage src={lobby.creator?.avatar_url} />
                            <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                            <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Commander</div>
                            <div className="text-xs font-bold text-zinc-300 truncate w-24">{lobby.creator?.username}</div>
                        </div>
                    </div>

                    {/* Sector Key (Host Only) */}
                    {isCommander && lobby.sector_key && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Password</span>
                            <div className="flex items-center gap-2 text-orange-400 font-mono font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 cursor-pointer hover:bg-orange-500/20 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(lobby.sector_key);
                                }}
                                title="Click to Copy"
                            >
                                <Key className="w-3 h-3" />
                                {lobby.sector_key}
                            </div>
                        </div>
                    )}
                </div>

                {/* Occupancy Bar */}
                <div className="mb-4">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Lobby Capacity</span>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">{currentPlayers} / {maxPlayers} PLAYERS</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-500"
                            style={{ width: `${Math.min(100, (currentPlayers / maxPlayers) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    {/* STRICT PRIORITY: COMMANDER (not joined) -> MEMBER -> VISITOR */}
                    {(() => {
                        // 1. Commander who hasn't joined: Show "READY UP" button
                        if (isCommander && !isUserJoined) {
                            return (
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        setIsJoining(true);
                                        try {
                                            const result = await joinLobby(lobby.id);
                                            if (result.success) {
                                                toast.success("You're ready!");
                                                router.push(`/dashboard/play/lobby/${lobby.id}`);
                                            } else {
                                                toast.error(result.message || 'Failed to ready up');
                                            }
                                        } finally {
                                            setIsJoining(false);
                                        }
                                    }}
                                    disabled={isJoining}
                                    className="w-full py-3 rounded-xl bg-[#ccff00] hover:bg-[#b3e600] text-black font-mono font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2 border border-[#ccff00]/50 shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:shadow-[0_0_25px_rgba(204,255,0,0.5)] transition-all"
                                >
                                    {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    READY UP
                                </button>
                            );
                        }

                        // 2. Member: Re-entry Logic (Commander also falls here if joined)
                        if (isUserJoined) {
                            return (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/dashboard/play/lobby/${lobby.id}`);
                                    }}
                                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2 border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] transition-all"
                                >
                                    <Swords className="w-4 h-4" />
                                    ENTER LOBBY
                                </button>
                            );
                        }

                        // 3. Visitor: Join Action
                        return (
                            <JoinButton
                                lobbyId={lobby.id}
                                currentPlayers={currentPlayers}
                                maxPlayers={maxPlayers}
                                isUserJoined={isUserJoined}
                                isAuthenticated={!!currentUserId}
                                onJoin={(id) => onJoin && onJoin(id)}
                                isPrivate={!!lobby.sector_key}
                                onPrivateAccess={() => setShowPasswordModal(true)}
                            />
                        );
                    })()}

                    {/* Delete Button (Commander Only) */}
                    {isCommander && (
                        <button
                            onClick={handleDissolveWrapped}
                            disabled={isDissolving}
                            className="w-full py-2.5 rounded-xl bg-red-900/20 hover:bg-red-900/30 text-red-400 font-mono font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2 border border-red-500/30 hover:border-red-500/50 transition-all group/delete"
                        >
                            {isDissolving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4 group-hover/delete:animate-pulse" />
                            )}
                            {isDissolving ? 'TERMINATING SIGNAL...' : 'DISSOLVE LOBBY'}
                        </button>
                    )}
                </div>
            </div>

            {/* PASSWORD MODAL */}
            <Dialog open={showPasswordModal} onOpenChange={(open) => {
                setShowPasswordModal(open);
                if (!open) setPasswordInput("");
            }}>
                <DialogContent className="bg-black/90 backdrop-blur-xl border border-orange-500/30 text-white shadow-2xl sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-500 font-orbitron tracking-wide">
                            <Lock className="w-5 h-5" />
                            RESTRICTED ACCESS
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-2 block">Authentication Required</label>
                        <input
                            type="password"
                            placeholder={isShakeError ? "ACCESS DENIED" : "Enter Password"}
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className={`w-full bg-zinc-900 border text-white px-3 py-2 rounded outline-none font-mono transition-all duration-200
                                ${isShakeError
                                    ? 'animate-shake-rapid border-red-500 bg-red-950/50 text-red-500 font-bold uppercase tracking-widest'
                                    : 'border-zinc-700 focus:ring-2 focus:ring-orange-500'}`}
                            autoFocus
                            disabled={isShakeError} // Prevent typing during error
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handlePrivateJoin();
                                }
                            }}
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <button
                            onClick={() => {
                                setShowPasswordModal(false);
                                setPasswordInput("");
                            }}
                            className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs font-mono uppercase tracking-widest border border-white/10"
                        >
                            CANCEL
                        </button>
                        <button
                            onClick={handlePrivateJoin}
                            className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 flex justify-center items-center gap-2 font-orbitron uppercase tracking-widest"
                            disabled={isJoining}
                        >
                            {isJoining ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            DECRYPT & ENTER
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )

    async function handlePrivateJoin() {
        if (!passwordInput) {
            toast.error("Password Required", { description: "Please enter the Password." });
            return;
        }

        setIsJoining(true);
        try {
            // Attempt to join via server action
            const result = await joinLobby(lobby.id, passwordInput);

            if (result.success) {
                toast.success("Access Granted", { description: "Welcome to the sector." });
                setShowPasswordModal(false);
                setPasswordInput("");
                if (onJoin) onJoin(lobby.id, passwordInput); // Check if parent needs to know
                router.refresh();
            } else {
                throw new Error(result.message || "Access Failed");
            }
        } catch (error: any) {
            // --- ACCESS DENIED VISUAL FEEDBACK ---
            setIsShakeError(true);
            const originalInput = passwordInput; // Preserve if needed, but per request we override
            setPasswordInput("ACCESS DENIED");

            // Allow animation to play then reset
            setTimeout(() => {
                setIsShakeError(false);
                setPasswordInput(""); // Reset for retry
            }, 600);

            toast.error("Access Denied", { description: error.message || "Invalid Password." });
        } finally {
            setIsJoining(false);
        }
    }
}
