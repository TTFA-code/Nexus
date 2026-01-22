'use client';

import { useState } from 'react';
import { Users, Swords, Lock, Key, Trophy, User, Activity, ChevronDown, ChevronUp, Radio, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LobbyCard } from './LobbyCard';
import { ReadyCheckOverlay } from '@/components/match/ReadyCheckOverlay';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface ActiveLobbiesProps {
    lobbies: any[]
    currentUserId: string | null
    handleDissolve?: (id: string) => void
    onJoin?: (lobbyId: string) => void
}

export function ActiveLobbies({
    lobbies,
    currentUserId,
    handleDissolve,
    onJoin
}: ActiveLobbiesProps) {
    const [tournamentsExpanded, setTournamentsExpanded] = useState(true);
    // Explicitly using string to handle future ID types if needed, but callback expects number currently.
    // User requested string state for ID: const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    // But our ID is number. We will cast it.
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    function initiateDissolve(lobbyId: string, e: React.MouseEvent) {
        e.stopPropagation();
        setConfirmDeleteId(lobbyId.toString());
    }

    async function executeDissolve() {
        if (!confirmDeleteId) return;
        const lobbyId = confirmDeleteId; // Keep as string (UUID)
        setConfirmDeleteId(null);

        // Optimistic Update
        if (handleDissolve) handleDissolve(lobbyId);

        try {
            await fetch('/api/lobbies/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lobbyId }),
            });
        } catch (error) { console.error(error); }
    }

    // 3-Tier Categorization Logic
    // 1. Tournament: is_tournament = true or created by admin (logic TBD, relying on flag for now)
    const tournamentGames = lobbies.filter(l => l.is_tournament);

    // 2. Active Command: Hosted details
    const hostedGames = lobbies.filter(l => currentUserId && l.creator_id === currentUserId && !l.is_tournament);

    // 3. Lobby Signals: Everyone else
    // 3. Sector Signals: Everyone else
    const sectorSignals = lobbies.filter(l => (!currentUserId || l.creator_id !== currentUserId) && !l.is_tournament);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredSignals = sectorSignals.filter(lobby =>
        (lobby.sector_key && lobby.sector_key.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lobby.game_modes?.name && lobby.game_modes.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lobby.game_name && lobby.game_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lobby.description && lobby.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const renderLobbyCard = (lobby: any, variant: 'tournament' | 'hosted' | 'default') => {
        return (
            <LobbyCard
                key={lobby.id}
                lobby={lobby}
                variant={variant}
                currentUserId={currentUserId}
                onDissolve={initiateDissolve}
                onJoin={onJoin}
            />
        );
    };

    return (
        <div className="space-y-12">

            {/* TIER 1: TOURNAMENT INTEL */}
            {tournamentGames.length > 0 && (
                <section className="bg-fuchsia-950/20 border border-fuchsia-900/40 rounded-3xl overflow-hidden backdrop-blur-xl">
                    <button
                        onClick={() => setTournamentsExpanded(!tournamentsExpanded)}
                        className="w-full px-8 py-4 flex items-center justify-between bg-fuchsia-900/20 hover:bg-fuchsia-900/30 transition-colors border-b border-fuchsia-900/30 text-fuchsia-400"
                    >
                        <div className="flex items-center gap-3">
                            <Trophy className="w-6 h-6" />
                            <div className="text-left">
                                <h3 className="font-bold text-lg tracking-wide font-orbitron">TOURNAMENT PROTOCOLS</h3>
                                <p className="text-xs text-fuchsia-400/80 opacity-80 uppercase tracking-widest">{tournamentGames.length} Active Events</p>
                            </div>
                        </div>
                        {tournamentsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    {tournamentsExpanded && (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            {tournamentGames.map(l => renderLobbyCard(l, 'tournament'))}
                        </div>
                    )}
                </section>
            )}

            {/* TIER 2: YOUR LOBBY (Hosted Games) */}
            {hostedGames.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <User className="w-6 h-6 text-sky-400" />
                        <div>
                            <h3 className="text-2xl font-bold text-white font-orbitron">YOUR LOBBY</h3>
                            <p className="text-sm text-zinc-400">Your deployed lobbies</p>
                        </div>
                        <div className="h-px bg-gradient-to-r from-sky-500/50 to-transparent flex-1 ml-4" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hostedGames.map(l => renderLobbyCard(l, 'hosted'))}
                    </div>
                </section>
            )}

            {/* TIER 3: LOBBY SIGNALS (Public/Private Lobbies) */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <Radio className="w-6 h-6 text-[#ccff00] animate-pulse" />
                    <div>
                        <h3 className="text-2xl font-bold text-white font-orbitron">LOBBY SIGNALS</h3>
                        <p className="text-sm text-zinc-400">Live feed from other players</p>
                    </div>
                </div>

                {/* Radar Search */}
                <div className="mb-6 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/50">
                        <Search className="w-4 h-4" />
                    </div>
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="[ RADAR SCAN: ENTER PASSWORD OR GAME MODE ]"
                        className="w-full bg-black/40 border-cyan-500/30 focus:border-cyan-400 text-cyan-400 pl-10 h-12 font-mono tracking-wider placeholder:text-cyan-500/30 rounded-xl backdrop-blur-sm transition-all"
                    />
                </div>

                {filteredSignals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSignals.map(l => renderLobbyCard(l, 'default'))}
                    </div>
                ) : (
                    /* EMPTY STATE */
                    <div className="flex flex-col items-center justify-center min-h-[500px] bg-black/20 border border-white/5 rounded-3xl backdrop-blur-sm p-8 text-center transition-all duration-500 hover:border-white/10 group">

                        <div className="relative w-40 h-40 mb-8 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute inset-0 border border-dashed border-[#ccff00]/20 rounded-full animate-[spin_10s_linear_infinite]" />
                            <div className="absolute inset-4 border border-[#ccff00]/10 rounded-full" />
                            <Search className="w-12 h-12 text-[#ccff00]/50" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white font-orbitron tracking-wider">
                                {searchTerm ? "NO SIGNALS MATCHING CRITERIA" : "NO ACTIVE LOBBY SIGNALS CLASSIFIED"}
                            </h3>
                            <p className="text-zinc-500 max-w-md mx-auto">
                                {searchTerm ? "Adjust radar parameters and rescan." : "The lobby feed is currently silent. No external operations are broadcasting within detection range."}
                            </p>
                        </div>

                        <div className="mt-8 px-4 py-2 bg-white/5 rounded-full text-xs text-zinc-600 font-mono tracking-widest border border-white/5">
                            SCANNING PROTOCOL: {searchTerm ? "ACTIVE" : "IDLE"}
                        </div>
                    </div>
                )}
            </section>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onOpenChange={(open) => !open && setConfirmDeleteId(null)}
                title="WARNING: SIGNAL TERMINATION"
                description="YOU ARE ABOUT TO TERMINATE THIS LOBBY SIGNAL. PROCEED?"
                onConfirm={executeDissolve}
                onCancel={() => setConfirmDeleteId(null)}
                isDestructive={true}
                confirmText="CONFIRM TERMINATION"
                cancelText="ABORT"
            />


            {/* Ready Check Overlay */}
            {(() => {
                const joinedLobby = lobbies.find(l =>
                    l.creator_id === currentUserId
                    // Previously checked if in lobby_players list, now we only checking if creator
                    // But usually, Ready Check is for all players.
                    // If we can't track players, we only know if we created it.
                );

                if (joinedLobby) {
                    return (
                        <ReadyCheckOverlay
                            lobbyId={joinedLobby.id}
                            currentStatus={joinedLobby.status}
                        />
                    );
                }
                return null;
            })()}
        </div>
    );
}
