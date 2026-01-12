'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Target, Users, LogOut, Loader2, Play } from 'lucide-react';

interface QueueState {
    queues: any[];
    game_modes: any[];
}

export function QueueControls() {
    const [state, setState] = useState<QueueState>({ queues: [], game_modes: [] });
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
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

    async function handleJoin(gameModeId: number) {
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

    async function handleLeave() {
        setLoading(true);
        try {
            const res = await fetch('/api/queue/leave', {
                method: 'POST',
                body: JSON.stringify({}), // Leave all
            });
            const data = await res.json();
            if (data.success) {
                fetchQueueStatus();
            }
        } catch (e) {
            alert('Failed to leave queue');
        } finally {
            setLoading(false);
        }
    }

    // Determine current user status
    // The DB stores Discord Snowflake ID, but user.id is UUID.
    // We need to look up the discord identity ID from the user object.
    const discordId = user?.identities?.find((i: any) => i.provider === 'discord')?.id;
    const currentQueue = discordId ? state.queues.find(q => q.user_id === discordId) : null;
    const activeGameMode = currentQueue ? state.game_modes.find(gm => gm.id === currentQueue.game_mode_id) : null;

    if (!user) return null;

    return (
        <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                        <Target className="w-5 h-5 text-[#ccff00]" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            Queue Control
                        </h3>
                        <p className="text-xs text-zinc-500 font-mono">
                            {state.queues.length} PLAYERS WAITING
                        </p>
                    </div>
                </div>
                {loading && <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />}
            </div>

            <div className="space-y-3">
                {currentQueue ? (
                    <div className="p-4 rounded-xl bg-cyan-900/20 border border-cyan-500/30 flex items-center justify-between">
                        <div>
                            <div className="text-xs text-cyan-400 font-bold mb-1">IN QUEUE</div>
                            <div className="font-bold text-white">{activeGameMode?.name || 'Unknown Mode'}</div>
                            <div className="text-xs text-cyan-400/60 mt-1">Waiting for match...</div>
                        </div>
                        <button
                            onClick={handleLeave}
                            disabled={loading}
                            className="h-10 w-10 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 flex items-center justify-center text-red-400 transition-colors"
                            title="Leave Queue"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {state.game_modes.length === 0 && (
                            <div className="text-sm text-zinc-500 text-center py-4">No active game modes.</div>
                        )}
                        {state.game_modes.map((mode) => {
                            const count = state.queues.filter(q => q.game_mode_id === mode.id).length;
                            return (
                                <button
                                    key={mode.id}
                                    onClick={() => handleJoin(mode.id)}
                                    disabled={loading}
                                    className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#ccff00]/30 transition-all text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-black/40 flex items-center justify-center group-hover:text-[#ccff00] transition-colors">
                                            <Play className="w-3 h-3" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-zinc-300 group-hover:text-white">{mode.name}</div>
                                            <div className="text-xs text-zinc-600">{mode.team_size}v{mode.team_size}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/40 border border-white/5">
                                        <Users className="w-3 h-3 text-zinc-500" />
                                        <span className="text-xs font-mono text-zinc-300">{count}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
