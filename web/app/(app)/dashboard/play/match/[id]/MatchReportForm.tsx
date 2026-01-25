"use client";

import { useState } from "react";
import { submitMatchResult } from "@/actions/matchActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MatchReportFormProps {
    matchId: string;
    myStats?: { score: number };
    opponentStats?: { score: number };
    userId: string;
}

export default function MatchReportForm({ matchId, myStats, opponentStats, userId }: MatchReportFormProps) {
    const [myScore, setMyScore] = useState("");
    const [opponentScore, setOpponentScore] = useState("");
    const [loading, setLoading] = useState(false);

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
                // Parse MMR Changes
                // The result now contains 'result' object which has the JSON from RPC
                // We need to check how matchActions returns it. 
                // Assuming result.data contains the RPC return.

                const mmrChanges = (result as any).data?.mmr_changes;
                const myChange = mmrChanges?.[userId]; // We need userId here. 
                // Since this component might not have userId readily available in props, 
                // we'll rely on the server action return message or just show generic success for now
                // UNLESS we pass userId/Team to form.

                // Better: Just show success and let the profile update show it. 
                // OR: Parse if we can. 

                if (myChange) {
                    toast.success(`Result reported. Combat Rating: ${myChange > 0 ? '+' : ''}${myChange}`);
                } else {
                    // Show Winner Team from result
                    const winnerTeam = (result as any).winner_team;
                    const winnerText = winnerTeam === 0 ? "Draw" : `Team ${winnerTeam} Victory`;
                    toast.success(`Result confirmed: ${winnerText}`);
                }
            }
        } catch (err: any) {
            console.error("Network/System Error:", err);
            toast.error("Failed to submit result: " + (err.message || "Unknown Error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 p-8 rounded-xl backdrop-blur-sm">
            <h3 className="text-center text-zinc-400 font-mono uppercase tracking-widest mb-8">Report Results</h3>

            <form onSubmit={handleSubmit} className="space-y-8">
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
