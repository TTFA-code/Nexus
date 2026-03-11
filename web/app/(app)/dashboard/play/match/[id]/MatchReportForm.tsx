"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitMatchResult } from "@/actions/matchActions";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";

interface MatchReportFormProps {
    matchId: string;
    matchStatus: string | null;
    myStats?: { score: number };
    opponentStats?: { score: number };
    userId: string;
}

export default function MatchReportForm({ matchId, matchStatus, myStats, opponentStats, userId }: MatchReportFormProps) {
    const [myScore, setMyScore] = useState("");
    const [opponentScore, setOpponentScore] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const [localMatchStatus, setLocalMatchStatus] = useState(matchStatus);
    const [localHasSubmitted, setLocalHasSubmitted] = useState(myStats?.score !== undefined);
    const [localMyStats, setLocalMyStats] = useState(myStats);

    useEffect(() => {
        setLocalMatchStatus(matchStatus);
        setLocalHasSubmitted(myStats?.score !== undefined);
        setLocalMyStats(myStats);
    }, [matchStatus, myStats?.score]);

    // Function to manually fetch the latest stats for this user
    const fetchCurrentStats = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('match_players')
            .select('stats')
            .eq('match_id', matchId)
            .eq('user_id', userId)
            .single();

        if (!error && data?.stats) {
            const score = (data.stats as any).score;
            if (score !== undefined) {
                setLocalMyStats({ score });
                setLocalHasSubmitted(true);
            }
        }
    };

    // REAL-TIME SUBSCRIPTION
    useEffect(() => {
        const supabase = createClient();

        // Listen to Matches table for status updates (disputed, finished)
        const matchSub = supabase
            .channel(`match-status-${matchId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
                (payload) => {
                    const newStatus = payload.new.status;
                    if (newStatus && newStatus !== localMatchStatus) {
                        setLocalMatchStatus(newStatus);
                        router.refresh(); // Refresh page data
                    }
                }
            )
            .subscribe();

        // Listen to match_reports table if someone else submits
        const reportSub = supabase
            .channel(`match-reports-${matchId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'match_reports', filter: `match_id=eq.${matchId}` },
                (payload) => {
                    // Refresh data to pull down new stats
                    fetchCurrentStats();
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(matchSub);
            supabase.removeChannel(reportSub);
        };
    }, [matchId, router, localMatchStatus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!myScore || !opponentScore) {
            toast.error("Please enter scores for both players");
            return;
        }

        setLoading(true);
        try {
            const result = await submitMatchResult(matchId, parseInt(myScore), parseInt(opponentScore));
            if (result.error) {
                console.error("Submission Error:", result.error);
                toast.error("Failed to submit: " + result.error);
            } else {
                if (result.status === 'waiting_for_opponent') {
                    setLocalMatchStatus('ongoing');
                    setLocalHasSubmitted(true);
                    setLocalMyStats({ score: parseInt(myScore) });
                    toast.info(`Scores recorded. Waiting for opponent's confirmation.`);
                } else if (result.status === 'disputed') {
                    setLocalMatchStatus('disputed');
                    toast.error(`Scores conflicted! Match requires admin resolution.`);
                } else if (result.status === 'finished' || result.status === 'admin_resolved') {
                    setLocalMatchStatus('finished');
                    const winnerWording = result.winner_team === 0 ? "Draw" : `Team ${result.winner_team} Victory`;
                    toast.success(`Result confirmed: ${winnerWording}!`);
                } else {
                    toast.success(`Result reported successfully.`);
                }
                router.refresh();
            }
        } catch (err: any) {
            console.error("Network/System Error:", err);
            toast.error("Failed to submit result: " + (err.message || "Unknown Error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 p-8 rounded-xl backdrop-blur-sm relative overflow-hidden">
            <h3 className="text-center text-zinc-400 font-mono uppercase tracking-widest mb-6">Report Results</h3>

            {/* CONFLICT BANNER */}
            {localMatchStatus === 'disputed' && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500 text-red-500 flex flex-col items-center justify-center text-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 font-black tracking-widest text-lg">
                        <AlertTriangle className="w-5 h-5" />
                        SCORE CONFLICT DETECTED
                    </div>
                    <p className="text-sm font-mono opacity-90">
                        You and your opponent entered different scores. <br />
                        Please communicate with them and re-submit the correct result below.
                    </p>
                </div>
            )}

            {/* WAITING FOR OPPONENT OVERLAY */}
            {localHasSubmitted && localMatchStatus !== 'disputed' && localMatchStatus !== 'finished' && localMatchStatus !== 'admin_resolved' ? (
                <div className="flex flex-col items-center justify-center py-12 gap-6 relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse h-16 w-16" />
                        <Clock className="w-16 h-16 text-emerald-400 relative z-10 animate-[spin_3s_linear_infinite]" />
                    </div>
                    <div className="text-center space-y-2">
                        <h4 className="text-xl font-black text-white tracking-widest uppercase">Result Locked In</h4>
                        <p className="text-zinc-400 font-mono text-sm max-w-[250px] mx-auto leading-relaxed">
                            Waiting for the opponent to report their side of the match.
                        </p>
                    </div>
                </div>
            ) : localMatchStatus === 'finished' || localMatchStatus === 'admin_resolved' ? (
                <div className="flex flex-col items-center justify-center py-12 gap-6 relative z-10">
                    <div className="text-center space-y-2">
                        <h4 className="text-xl font-black text-emerald-400 tracking-widest uppercase">Match Complete</h4>
                        <p className="text-zinc-400 font-mono text-sm max-w-[250px] mx-auto leading-relaxed">
                            Scores have been verified and recorded.
                        </p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-emerald-500 uppercase tracking-wider block text-center">My Score</label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={myScore}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setMyScore(val);
                                }}
                                className="text-center text-4xl font-mono h-20 bg-black/50 border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                                placeholder="-"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-red-500 uppercase tracking-wider block text-center">Opponent Score</label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={opponentScore}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setOpponentScore(val);
                                }}
                                className="text-center text-4xl font-mono h-20 bg-black/50 border-zinc-800 focus:border-red-500 focus:ring-red-500/20"
                                placeholder="-"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-widest py-8 text-lg uppercase transition-all shadow-[0_0_20px_rgba(5,150,105,0.4)] hover:shadow-[0_0_30px_rgba(5,150,105,0.6)]"
                    >
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "CONFIRM RESULTS"}
                    </Button>

                    <p className="text-center text-xs text-zinc-500 italic">
                        *Both players must report. Disputes will be handled by admin.
                    </p>
                </form>
            )}

            <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
                <Button
                    variant="ghost"
                    disabled={true}
                    className="text-zinc-600 cursor-not-allowed uppercase tracking-wider text-sm"
                >
                    Return to Headquarters (Locked)
                </Button>
            </div>
        </div>
    );
}
