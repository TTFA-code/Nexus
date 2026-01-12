'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Trophy, Check, Swords, AlertTriangle, Loader2 } from 'lucide-react';

export function MatchReporting() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchActiveMatches();
        const interval = setInterval(fetchActiveMatches, 10000);
        return () => clearInterval(interval);
    }, []);

    async function fetchActiveMatches() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch ongoing matches
        const { data } = await supabase
            .from('matches')
            .select(`
                *,
                game_modes:game_mode_id(name),
                match_players(user_id, team)
            `)
            .eq('status', 'ongoing')
            .order('started_at', { ascending: false });

        if (data) {
            // Filter locally for matches where the user is a player
            // This is a temp fix until we do a proper join filter or RPC
            const myMatches = data.filter(m =>
                m.match_players.some((mp: any) => mp.user_id === user.id)
            );
            setMatches(myMatches);
        }
    }

    async function handleReport(matchId: string, winnerTeam: number) {
        if (!confirm(`Confirm Team ${winnerTeam} Victory?`)) return;

        // Optional: Asking for evidence, but we can make it purely optional in UI later
        // For now, let's keep it simple or remove the prompt if it's annoying.
        // Let's remove the prompt for now to make it "one-click" as requested by "buttons to access bot".

        setLoading(true);
        try {
            await fetch('/api/match/report', {
                method: 'POST',
                body: JSON.stringify({
                    match_id: matchId,
                    winner_team: winnerTeam,
                    evidence_url: null // Can add a modal for this later if needed
                }),
            });
            fetchActiveMatches(); // Refresh list
        } catch (e) {
            console.error(e);
            alert("Failed to submit report");
        } finally {
            setLoading(false);
        }
    }

    if (matches.length === 0) return null;

    return (
        <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                    <Swords className="w-5 h-5 text-[#ccff00]" />
                </div>
                <div>
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Active Match
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">
                        ACTION REQUIRED
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {matches.map((match) => (
                    <div key={match.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="text-xs text-zinc-500 font-mono">MATCH #{match.id} • {match.game_modes?.name}</div>
                            {match.approval_status === 'pending' && (
                                <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
                                    <AlertTriangle className="w-3 h-3" />
                                    VERIFYING
                                </div>
                            )}
                        </div>

                        {match.approval_status !== 'pending' ? (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleReport(match.id, 1)}
                                    disabled={loading}
                                    className="py-3 rounded-lg bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-400 font-bold text-sm transition-all hover:scale-[1.02]"
                                >
                                    Team 1 Win
                                </button>
                                <button
                                    onClick={() => handleReport(match.id, 2)}
                                    disabled={loading}
                                    className="py-3 rounded-lg bg-pink-900/20 hover:bg-pink-900/40 border border-pink-500/30 text-pink-400 font-bold text-sm transition-all hover:scale-[1.02]"
                                >
                                    Team 2 Win
                                </button>
                            </div>
                        ) : (
                            <div className="text-sm text-zinc-400 text-center py-2 bg-black/20 rounded-lg border border-white/5">
                                Result Submitted. Waiting for confirmation.
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
