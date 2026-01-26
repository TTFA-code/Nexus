import { createClient } from "@/utils/supabase/server";
import { Redirect } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { submitMatchResult } from "@/actions/matchActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MatchReportForm from "./MatchReportForm";
import { Handshake, AlertTriangle } from "lucide-react";

interface MatchPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function MatchReportPage(props: MatchPageProps) {
    const params = await props.params;
    const matchId = params.id;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return <div className="p-10 bg-red-900 text-white">REDIRECT BLOCKED IN: MatchReportPage</div>;
        // redirect("/dashboard");
    }

    // Fetch Match Data
    const { data: match, error } = await supabase
        .from("matches")
        .select(`
      *,
      game_mode:game_modes!inner(name),
      match_players(
        *,
        player:players(*)
      )
    `)
        .eq("id", matchId)
        .single();

    if (error || !match) {
        return <div className="p-10 text-center text-red-500">Match not found</div>;
    }

    const discordId = user.identities?.find(i => i.provider === 'discord')?.id;

    if (!discordId) {
        return <div className="p-10 text-center text-red-500">Error: No Discord Identity Linked.</div>;
    }

    const myPlayer = match.match_players.find((p: any) => p.user_id === discordId) as any;
    const opponent = match.match_players.find((p: any) => p.user_id !== discordId) as any;

    if (!myPlayer) {
        return <div className="p-10 text-center text-red-500">You are not a participant in this match.</div>;
    }

    const isFinished = !!match.finished_at;
    const myStats = myPlayer.stats as { score?: number } | null;
    const opponentStats = opponent?.stats as { score?: number } | null;

    // Determine Result if finished
    const won = match.winner_team === myPlayer.team;
    const isDraw = match.winner_team === 0;
    const isPending = match.status === 'pending_approval';

    // Fetch MMR Change if finished
    let mmrChange: number | null = null;
    if (isFinished) {
        const { data: history } = await supabase
            .from("mmr_history")
            .select("change")
            .eq("match_id", matchId)
            // Fix: mmr_history stores Auth UUID, not Discord ID
            .eq("player_uuid", user.id)
            .limit(1)
            .maybeSingle();

        if (history) {
            mmrChange = history.change;
        } else {
            console.error("MatchReportPage: No MMR History found for user", user.id, "match", matchId);
        }
    }

    const mmrChangeText = mmrChange !== null ? `${mmrChange >= 0 ? "+" : ""}${mmrChange}` : "";

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 max-w-4xl mx-auto space-y-8 md:space-y-12">

            {/* HEADER */}
            {!isFinished && (
                <div className="text-center space-y-2 animate-pulse">
                    <h1 className="text-4xl font-black text-[#ffffff] tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        MATCH IN PROGRESS
                    </h1>
                    <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">
                        ID: {matchId.split('-')[0]} // {(match.game_mode as any)?.name || 'Unknown Mode'}
                    </p>
                </div>
            )}

            {/* RESULT BANNER */}
            {isFinished && (
                isDraw ? (
                    <div className="w-full bg-amber-900/20 border border-amber-500/50 text-amber-500 p-6 md:p-8 text-center flex items-center justify-center gap-4 animate-pulse border-dashed">
                        <Handshake className="w-8 h-8 md:w-12 md:h-12" />
                        <span className="text-3xl md:text-6xl font-black tracking-widest">DRAW {mmrChangeText}</span>
                    </div>
                ) : won ? (
                    <div className="w-full bg-emerald-500/20 border border-emerald-500 text-emerald-500 p-6 md:p-8 text-center text-3xl md:text-6xl font-black tracking-widest animate-pulse">
                        VICTORY {mmrChangeText}
                    </div>
                ) : (
                    <div className="w-full bg-red-500/20 border border-red-500 text-red-500 p-6 md:p-8 text-center text-3xl md:text-6xl font-black tracking-widest animate-pulse">
                        DEFEAT {mmrChangeText}
                    </div>
                )
            )}

            {isPending && (
                <div className="text-center text-zinc-400 text-sm animate-pulse">
                    * Result is pending verification and is subject to change by admins.
                </div>
            )}

            {match.status === 'cancelled' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl">
                    <div className="text-center space-y-6 max-w-md p-6 border border-red-500/30 bg-red-900/10 rounded-2xl">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                        <h2 className="text-3xl font-black text-red-500 font-orbitron tracking-widest">MATCH DISSOLVED</h2>
                        <p className="text-zinc-400 font-mono">
                            A player failed to ready up. The match has been cancelled.
                        </p>
                        <Button
                            onClick={() => window.location.href = '/dashboard/play'}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold tracking-widest w-full"
                        >
                            RETURN TO LOBBY
                        </Button>
                    </div>
                </div>
            )}

            {/* VERSUS DISPLAY */}
            <div className="flex items-center justify-center gap-4 md:gap-24 w-full">
                {/* ME */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] overflow-hidden bg-zinc-900">
                        <Image
                            src={myPlayer.player?.avatar_url || "/placeholder-avatar.png"}
                            alt="Me" fill className="object-cover"
                        />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg md:text-xl text-white">{myPlayer.player?.username || "Me"}</div>
                        {isFinished && <div className="text-3xl md:text-4xl font-mono text-emerald-400 mt-2">{myStats?.score ?? 0}</div>}
                    </div>
                </div>

                <div className="text-4xl md:text-6xl font-black text-zinc-700 italic">VS</div>

                {/* OPPONENT */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)] overflow-hidden bg-zinc-900">
                        <Image
                            src={opponent?.player?.avatar_url || "/placeholder-avatar.png"}
                            alt="Opponent" fill className="object-cover"
                        />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-xl text-white">{opponent?.player?.username || "Opponent"}</div>
                        {isFinished && <div className="text-4xl font-mono text-red-400 mt-2">{opponentStats?.score ?? 0}</div>}
                    </div>
                </div>
            </div>

            {/* REPORTING FORM (Client Component) */}
            {!isFinished ? (
                <MatchReportForm
                    matchId={matchId}
                    myStats={myStats?.score !== undefined ? { score: myStats.score } : undefined}
                    opponentStats={opponentStats?.score !== undefined ? { score: opponentStats.score } : undefined}
                    userId={user.id}
                />
            ) : (
                /* RETURN BUTTON */
                <div className="pt-10">
                    <form action={async () => {
                        "use server";
                        redirect("/dashboard/play");
                    }}>
                        <Button
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-8 py-6 text-lg tracking-widest"
                        >
                            RETURN TO HEADQUARTERS
                        </Button>
                    </form>
                </div>
            )}

        </div>
    );
}
