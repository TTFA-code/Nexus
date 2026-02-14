import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Handshake, AlertTriangle } from "lucide-react";
import MatchReportForm from "./MatchReportForm";
import { MatchNavigationGuard } from "@/components/match/MatchNavigationGuard";
import { ChatBox } from "@/components/chat/ChatBox";

export default async function MatchReportPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const matchId = params.id;

    // Fetch Match Data
    const { data: match, error } = await supabase
        .from("matches")
        .select('*')
        .eq("id", matchId)
        .single();

    if (error || !match) {
        console.error("Match Fetch Error:", error);
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-400 gap-4">
                <AlertTriangle className="w-12 h-12 text-red-500" />
                <h2 className="text-xl font-bold text-white">Match Not Found</h2>
                <div className="p-4 bg-black/50 rounded border border-white/10 font-mono text-xs max-w-lg overflow-auto">
                    <p>ID: {matchId}</p>
                    <p>Error: {JSON.stringify(error, null, 2)}</p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
            </div>
        );
    }

    // State Logic
    let myPlayer, opponent, myStats, opponentStats, won, isDraw;
    const isFinished = match.status === "finished";
    const isPending = match.status === "pending";

    try {
        console.log("Match Data:", JSON.stringify(match, null, 2)); // Debug Log

        if (!match.match_players || !Array.isArray(match.match_players)) {
            throw new Error("Match players data is missing or invalid");
        }

        // Players
        // Fix: Match user.id (Auth UUID) against player.uuid_link (Auth UUID)
        myPlayer = match.match_players.find((p: any) => p.player?.uuid_link === user.id);
        opponent = match.match_players.find((p: any) => p.player?.uuid_link !== user.id);

        if (!myPlayer) {
            console.warn("My Player not found in match. User ID:", user.id);
            // Verify if p.player is null?
            const playerLinks = match.match_players.map((p: any) => p.player?.uuid_link);
            console.warn("Available UUID Links:", playerLinks);
        }

        // Stats
        myStats = myPlayer?.stats as { score?: number } | undefined;
        opponentStats = opponent?.stats as { score?: number } | undefined;

        // Result Logic
        won = match.winner_team === myPlayer?.team;
        isDraw = match.winner_team === 0;

    } catch (err: any) {
        console.error("Processing Error:", err);
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-400 gap-4">
                <AlertTriangle className="w-12 h-12 text-red-500" />
                <h2 className="text-xl font-bold text-white">Data Processing Error</h2>
                <div className="p-4 bg-black/50 rounded border border-white/10 font-mono text-xs max-w-lg overflow-auto">
                    <p>Error: {err.message}</p>
                    <p>Match ID: {matchId}</p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
            </div>
        );
    }

    // MMR Logic safely accessed
    // Calculate MMR change if history exists, otherwise null
    const mmrChange = null;
    const mmrChangeText = "";

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 max-w-4xl mx-auto space-y-8 md:space-y-12">

            {/* Navigation Guard - Active when match is NOT finished */}
            <MatchNavigationGuard active={!isFinished} />

            {/* HEADER */}
            {!isFinished && (
                // ... rest of the component

                <div className="text-center space-y-2 animate-pulse">
                    <h1 className="text-4xl font-black text-[#ffffff] tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        MATCH IN PROGRESS
                    </h1>
                    <p className="text-sm font-mono text-zinc-400 uppercase tracking-widest">
                        ID: {matchId.split('-')[0]} // {(gameMode as any)?.name || 'Unknown Mode'}
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
                            src={myPlayer?.player?.avatar_url || "/placeholder-avatar.png"}
                            alt="Me" fill className="object-cover"
                        />
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg md:text-xl text-white">{myPlayer?.player?.username || "Me"}</div>
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



            {/* Chat System */}
            <div className="fixed bottom-6 right-6 z-40 w-80 md:w-96 animate-in slide-in-from-right-10 fade-in duration-500">
                {myPlayer?.user_id && (
                    <ChatBox
                        channelId={matchId}
                        type="match"
                        currentUserId={myPlayer!.user_id}
                        className="h-[300px] shadow-[0_0_30px_rgba(0,0,0,0.5)] border-white/10"
                    />
                )}
            </div>

        </div>
    );
}
