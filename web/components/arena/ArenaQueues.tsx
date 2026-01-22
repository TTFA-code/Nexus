'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Users, Play, Swords, Gamepad2, Trophy, Loader2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QueueState {
    queues: any[];
    game_modes: any[];
}

export function ArenaQueues() {
    const [state, setState] = useState<QueueState>({ queues: [], game_modes: [] });
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedQueueData, setSelectedQueueData] = useState<any>(null);
    const [filter, setFilter] = useState('ALL'); // ALL, RANKED, SCRIM, 1V1

    // Derived categories for filter from actual data or hardcoded for now + dynamic later
    // Just using a simple filter list for the UI as requested
    const filters = ['ALL', 'LEAGUE OF LEGENDS', 'ROCKET LEAGUE', 'FIFA'];

    const supabase = createClient();

    useEffect(() => {
        fetchUser();
        fetchQueueStatus();
        const interval = setInterval(fetchQueueStatus, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    async function fetchUser() {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    }

    async function fetchQueueStatus() {
        try {
            const res = await fetch('/api/queue/status');
            const data = await res.json();
            if (data.queues && data.game_modes) {
                setState(data);
            }
        } catch (e) {
            console.error("Failed to fetch queue status", e);
        }
    }

    async function handleJoin(gameModeId: string, e?: React.MouseEvent) {
        if (e) e.stopPropagation();
        setLoading(true);
        try {
            const res = await fetch('/api/queue/join', {
                method: 'POST',
                body: JSON.stringify({ game_mode_id: gameModeId }),
            });
            const data = await res.json();
            if (data.success) {
                fetchQueueStatus();
            } else {
                alert(data.message || data.error);
            }
        } catch (e) {
            alert('Failed to join queue');
        } finally {
            setLoading(false);
        }
    }

    async function handleLeave(gameModeId: string, e?: React.MouseEvent) {
        if (e) e.stopPropagation();
        setLoading(true);
        try {
            const res = await fetch('/api/queue/leave', {
                method: 'POST',
                body: JSON.stringify({ game_mode_id: gameModeId }),
            });
            const data = await res.json();
            if (data.success) {
                fetchQueueStatus();
            } else {
                alert(data.message || data.error);
            }
        } catch (e) {
            alert('Failed to leave queue');
        } finally {
            setLoading(false);
        }
    }

    function openDetails(mode: any, players: any[]) {
        setSelectedQueueData({ mode, players });
        setDetailsOpen(true);
    }

    // Filter Logic
    const filteredModes = state.game_modes.filter(mode => {
        if (filter === 'ALL') return true;
        const name = mode.name.toUpperCase();
        // Assuming naming convention "GAME - MODE" or just contains the game name
        if (filter === 'LEAGUE OF LEGENDS') return name.includes('LEAGUE') || name.includes('LOL');
        if (filter === 'ROCKET LEAGUE') return name.includes('ROCKET') || name.includes('RL');
        if (filter === 'FIFA') return name.includes('FIFA');
        return true;
    });

    // Helper to get Discord ID from user
    const discordId = user?.identities?.find((i: any) => i.provider === 'discord')?.id;

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest transition-all ${filter === f
                            ? 'bg-[#ccff00] text-black shadow-[0_0_15px_#ccff0040]'
                            : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModes.map((mode) => {
                    const queuePlayers = state.queues.filter(q => q.game_mode_id === mode.id);
                    const count = queuePlayers.length;
                    const max = mode.team_size * 2;
                    const isFull = count >= max;

                    // Check if current user is in this queue
                    const isInQueue = discordId && queuePlayers.some(q => q.user_id === discordId);

                    return (
                        <div
                            key={mode.id}
                            onClick={() => openDetails(mode, queuePlayers)}
                            className="group relative overflow-hidden rounded-3xl bg-black/10 border border-white/10 hover:border-[#ccff00]/50 transition-all duration-300 backdrop-blur-md cursor-pointer hover:bg-black/40"
                        >
                            {/* Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="p-6 relative z-10">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                        <Gamepad2 className="w-6 h-6 text-white group-hover:text-[#ccff00]" />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isFull ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20'}`}>
                                        {isFull ? 'FULL' : 'OPEN'}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-[#ccff00] transition-colors truncate">{mode.name}</h3>
                                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                                        <Users className="w-4 h-4" />
                                        <span>{count} / {max} Players</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-1 w-full bg-white/5 rounded-full mb-6 overflow-hidden">
                                    <div
                                        className="h-full bg-[#ccff00] transition-all duration-500 ease-out shadow-[0_0_10px_#ccff00]"
                                        style={{ width: `${(count / max) * 100}%` }}
                                    />
                                </div>

                                {/* Action */}
                                {isInQueue ? (
                                    <button
                                        onClick={(e) => handleLeave(mode.id, e)}
                                        disabled={loading}
                                        className="w-full py-4 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 hover:border-red-500 transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>CANCEL MATCH</span>}
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => handleJoin(mode.id, e)}
                                        disabled={loading || isFull}
                                        className="w-full py-4 rounded-xl bg-white/5 hover:bg-[#ccff00] hover:text-black border border-white/10 hover:border-[#ccff00] transition-all font-bold flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {!loading && (
                                            <>
                                                <span>DEPLOY</span>
                                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Server Indicator - Requested Feature */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
                            <div className="absolute bottom-2 right-4 text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
                                SERVER: {mode.name.split(' - ')[0] || 'NEXUS'}
                            </div>
                        </div>
                    );
                })}

                {/* Empty States */}
                {state.game_modes.length === 0 ? (
                    <div className="col-span-full py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/5 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center gap-6 max-w-md mx-auto px-4">
                            <div className="h-20 w-20 rounded-full bg-black/40 flex items-center justify-center border border-white/5 shadow-2xl">
                                <Users className="w-8 h-8 text-zinc-600" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white tracking-widest font-mono">SYSTEMS IDLE</h3>
                                <p className="text-zinc-500">
                                    No active matches detected in your lobby.
                                    You must be a member of a Nexus-enabled unit to deploy.
                                </p>
                            </div>

                            <button className="px-8 py-4 bg-[#ccff00] text-black font-bold rounded-xl hover:bg-[#b3e600] transition-colors shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>JOIN MORE NEXUS SERVERS</span>
                            </button>
                        </div>
                    </div>
                ) : filteredModes.length === 0 && (
                    <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-black/40 flex items-center justify-center">
                                <Swords className="w-8 h-8 text-zinc-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-zinc-400">No Matches Found</h3>
                                <p className="text-zinc-600">Adjust your filters or standard protocols.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <QueueDetailsModal
                isOpen={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                queueData={selectedQueueData}
            />
        </div>
    );
}
import { QueueDetailsModal } from './QueueDetailsModal';
