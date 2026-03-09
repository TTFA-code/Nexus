import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Handshake, AlertTriangle } from "lucide-react";
import MatchReportForm from "./MatchReportForm";
import { MatchNavigationGuard } from "@/components/match/MatchNavigationGuard";
import { ChatBox } from "@/components/chat/ChatBox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RematchControl } from "@/components/match/RematchControl";

export default async function MatchReportPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
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
                <Button asChild variant="outline">
                    <a href="/dashboard/play">Retry</a>
                </Button>
            </div>
        );
    }
    // 2. Fetch Match Players with Player Details
    const { data: matchPlayers, error: playersError } = await supabase
        .from("match_players")
        .select(`
            *,
            player:players(*)
        `)
        .eq("match_id", matchId);

    // 3. Fetch Game Mode
    let gameMode = null;
    if (match.game_mode_id) {
        const { data, error } = await supabase
            .from("game_modes")
            .select('*')
            .eq("id", match.game_mode_id)
            .single();

        if (error) console.error("Game Mode Fetch Error:", error);
        gameMode = data;
    }

    if (playersError) {
        console.error("Players Fetch Error:", playersError);
    }
    // State Logic
    let myPlayer, opponent, myStats, opponentStats, won, isDraw;
    const isFinished = match.status === "finished";
    const isPending = match.status === "pending";

    try {
        console.log("Match Data:", JSON.stringify(match, null, 2)); // Debug Log

        if (!matchPlayers || !Array.isArray(matchPlayers)) {
            throw new Error("Match players data is missing or invalid");
        }

        // Players
        // Fix: Match user.id (Auth UUID) against player.uuid_link (Auth UUID)
        myPlayer = matchPlayers.find((p: any) => p.player?.uuid_link === user.id);
        opponent = matchPlayers.find((p: any) => p.player?.uuid_link !== user.id);

        if (!myPlayer) {
            console.warn("My Player not found in match. User ID:", user.id);
            // Verify if p.player is null?
            const playerLinks = matchPlayers.map((p: any) => p.player?.uuid_link);
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
                <Button asChild variant="outline">
                    <a href="/dashboard/play">Retry</a>
                </Button>
            </div>
        );
    }

    // MMR Logic safely accessed
    let mmrChange = null;
    let mmrChangeText = "";

    if (isFinished && user?.id) {
        const { data: mmrHistory, error: mmrError } = await supabase
            .from('mmr_history')
            .select('change')
            .eq('match_id', matchId)
            .eq('player_uuid', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (mmrError) {
            console.error("MMR History Fetch Error:", mmrError);
        } else if (mmrHistory) {
            // console.log("MMR History Found:", mmrHistory);
            mmrChange = mmrHistory.change;
            const sign = mmrChange > 0 ? "+" : "";
            mmrChangeText = `(${sign}${mmrChange})`;
        } else {
            console.log("No MMR History found for user", user.id, "match", matchId);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 max-w-4xl mx-auto space-y-8 md:space-y-12">

            {/* Navigation Guard - Active when match is NOT finished */}
            <MatchNavigationGuard active={!isFinished} matchId={matchId} />

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
                            asChild
                            className="bg-red-600 hover:bg-red-500 text-white font-bold tracking-widest w-full"
                        >
                            <a href="/dashboard/play">RETURN TO LOBBY</a>
                        </Button>
                    </div>
                </div>
            )}

            {/* VERSUS DISPLAY */}
            <div className={`flex items-center justify-center gap-4 md:gap-16 w-full mx-auto ${gameMode?.team_size === 1 ? 'max-w-2xl' : 'max-w-5xl'}`}>
                {/* TEAM 1 */}
                <div className="flex flex-col gap-6 flex-1 items-end pr-4">
                    {matchPlayers?.filter(p => p.team === 1).map((p: any) => (
                        <div key={p.id} className="flex items-center gap-4 relative">
                            {/* Score */}
                            {isFinished && <div className="text-3xl md:text-4xl font-mono text-cyan-400 mt-2 absolute right-full mr-6 top-1/2 -translate-y-1/2">{(p.stats as any)?.score ?? 0}</div>}
                            <div className="text-right">
                                <div className="font-bold text-lg md:text-xl text-white">{p.player?.username || "Unknown"}</div>
                                {p.player?.uuid_link === user.id && <div className="text-xs text-cyan-500 font-mono tracking-widest uppercase">You</div>}
                            </div>
                            <div className={`relative w-16 h-16 md:w-24 md:h-24 rounded-full border-4 ${p.player?.uuid_link === user.id ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]'} overflow-hidden bg-zinc-900`}>
                                <Image
                                    src={p.player?.avatar_url || "/placeholder-avatar.png"}
                                    alt={p.player?.username || "Player"} fill className="object-cover"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-4xl md:text-6xl font-black text-zinc-700 italic px-2">VS</div>

                {/* TEAM 2 */}
                <div className="flex flex-col gap-6 flex-1 items-start pl-4">
                    {matchPlayers?.filter(p => p.team === 2).map((p: any) => (
                        <div key={p.id} className="flex items-center gap-4 relative">
                            <div className={`relative w-16 h-16 md:w-24 md:h-24 rounded-full border-4 ${p.player?.uuid_link === user.id ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]'} overflow-hidden bg-zinc-900`}>
                                <Image
                                    src={p.player?.avatar_url || "/placeholder-avatar.png"}
                                    alt={p.player?.username || "Player"} fill className="object-cover"
                                />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-lg md:text-xl text-white">{p.player?.username || "Unknown"}</div>
                                {p.player?.uuid_link === user.id && <div className="text-xs text-emerald-500 font-mono tracking-widest uppercase">You</div>}
                            </div>
                            {/* Score */}
                            {isFinished && <div className="text-3xl md:text-4xl font-mono text-orange-400 mt-2 absolute left-full ml-6 top-1/2 -translate-y-1/2">{(p.stats as any)?.score ?? 0}</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* REPORTING & CHAT TABS */}
            {!isFinished ? (
                <div className="w-full max-w-2xl mx-auto">
                    <Tabs defaultValue="report" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800">
                            <TabsTrigger value="report" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white uppercase tracking-wider font-bold">
                                Report Results
                            </TabsTrigger>
                            <TabsTrigger value="chat" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white uppercase tracking-wider font-bold relative">
                                Chat
                                {/* Unread indicator could go here if we tracked unread count via state */}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="report" className="mt-4">
                            <MatchReportForm
                                matchId={matchId}
                                myStats={myStats?.score !== undefined ? { score: myStats.score } : undefined}
                                opponentStats={opponentStats?.score !== undefined ? { score: opponentStats.score } : undefined}
                                userId={user.id}
                            />
                        </TabsContent>

                        <TabsContent value="chat" className="mt-4">
                            <div className="h-[500px] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl bg-black/80">
                                {myPlayer?.user_id && (
                                    <ChatBox
                                        channelId={matchId}
                                        type="match"
                                        currentUserId={myPlayer!.user_id}
                                        embedded={true}
                                        className="h-full"
                                    />
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            ) : (
                /* RETURN BUTTON (When finished) */
                /* REMATCH & RETURN CONTROLS */
                matchPlayers ? (
                    <RematchControl
                        matchId={matchId}
                        myUserId={user.id}
                        matchPlayers={matchPlayers}
                    />
                ) : (
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
                )
            )}
        </div>
    );
}
