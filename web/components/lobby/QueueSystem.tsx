'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, UserPlus, Play } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming shadcn button exists or we'll style it manually if fails
import { ReportUserDialog } from '@/components/profile/ReportUserDialog';

// Placeholder for Button if not exists, but usually in generated projects it does. 
// I'll stick to raw tailwind if I am unsure, but context said Shadcn UI.
// I'll assume standard HTML button with classes for safety to avoid import errors if the file doesn't exist.

interface QueueSystemProps {
    gameModeId: number;
    teamSize: number;
}

export function QueueSystem({ gameModeId, teamSize }: QueueSystemProps) {
    const [queue, setQueue] = useState<any[]>([]);
    const [inQueue, setInQueue] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = createClient();
    const playersNeeded = teamSize * 2; // Simple math for now

    useEffect(() => {
        fetchQueue();

        // Subscribe to Queue changes (Realtime)
        const channel = supabase
            .channel('public:queues')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'queues', filter: `game_mode_id=eq.${gameModeId}` }, (payload) => {
                fetchQueue();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [gameModeId]);

    async function fetchQueue() {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
        }

        const { data } = await supabase
            .from('queues')
            .select('*, players(username, avatar_url)')
            .eq('game_mode_id', gameModeId);

        if (data) {
            setQueue(data);
            if (user) {
                setInQueue(data.some(q => q.user_id === user.id));
            }
        }
    }

    async function handleJoinQueue() {
        setLoading(true);
        try {
            await fetch('/api/queue/join', {
                method: 'POST',
                body: JSON.stringify({ game_mode_id: gameModeId }),
            });
            // Fetch will be triggered by realtime subs or we can force it
            fetchQueue();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleStartMatch() {
        setLoading(true);
        try {
            const res = await fetch('/api/match/create', {
                method: 'POST',
                body: JSON.stringify({ game_mode_id: gameModeId }),
            });
            const data = await res.json();
            if (data.success) {
                // Ideally redirect to match page or refresh
                alert("Match Started! ID: " + data.match_id); // Simple feedback for now
                fetchQueue(); // Refresh
            } else {
                alert("Error: " + (data.error || "Unknown"));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const progress = Math.min((queue.length / playersNeeded) * 100, 100);

    return (
        <div className="mt-8 p-6 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
                        Active Queue
                    </h3>
                    <p className="text-zinc-500 text-sm">Waiting for pilots...</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-mono font-bold text-[#ccff00]">
                        {queue.length} <span className="text-lg text-zinc-500">/ {playersNeeded}</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-8">
                <div
                    className="h-full bg-[#ccff00] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                {!inQueue ? (
                    <button
                        onClick={handleJoinQueue}
                        disabled={loading}
                        className="flex-1 h-14 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />}
                        Join Operation
                    </button>
                ) : (
                    <div className="flex-1 h-14 bg-white/5 text-zinc-400 font-bold rounded-xl flex items-center justify-center border border-white/10">
                        <Loader2 className="animate-spin mr-2" />
                        In Queue...
                    </div>
                )}

                {/* Admin/Debug Start Button - Visible if enough players */}
                {queue.length >= playersNeeded && (
                    <button
                        onClick={handleStartMatch}
                        disabled={loading}
                        className="h-14 px-8 bg-[#ccff00] text-black font-bold rounded-xl hover:bg-[#bbe000] transition-colors flex items-center justify-center gap-2"
                    >
                        <Play size={20} />
                        Launch
                    </button>
                )}
            </div>

            {/* Player List */}
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {queue.map((q) => (
                    <div key={q.user_id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 group hover:border-white/10 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0">
                                {q.players?.username?.[0] || "?"}
                            </div>
                            <div className="truncate text-sm font-medium">
                                {q.players?.username || "Unknown Pilot"}
                            </div>
                        </div>

                        {currentUserId && currentUserId !== q.user_id && (
                            <ReportUserDialog
                                reportedId={q.user_id}
                                reportedName={q.players?.username || "Unknown"}
                                guildId={q.guild_id || "global"}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
