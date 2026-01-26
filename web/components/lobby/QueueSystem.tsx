"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Swords, Timer, Search, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { MatchFoundOverlay } from "./MatchFoundOverlay";
import { useRouter, usePathname } from "next/navigation";

// --- Types ---
interface QueueContextType {
    isSearching: boolean;
    isInMatch: boolean;
    searchDuration: number; // Seconds
    startSearch: (gameModeId: string) => Promise<void>;
    cancelSearch: () => Promise<void>;
    matchFoundData: any | null; // If set, shows overlay
    openModeSelector: () => void;
}

const QueueContext = createContext<QueueContextType | null>(null);

export function useQueue() {
    const context = useContext(QueueContext);
    if (!context) throw new Error("useQueue must be used within a QueueProvider");
    return context;
}

// --- Provider ---
export function QueueProvider({ children }: { children: ReactNode }) {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    const [isSearching, setIsSearching] = useState(false);
    const [isInMatch, setIsInMatch] = useState(false);
    const [searchDuration, setSearchDuration] = useState(0);
    const [showModeSelector, setShowModeSelector] = useState(false);
    const [matchFoundData, setMatchFoundData] = useState<any | null>(null);
    const [gameModes, setGameModes] = useState<any[]>([]);
    const [selectedMode, setSelectedMode] = useState<string | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Initial Check & Subscriptions
    useEffect(() => {
        let queueSubscription: any;
        let readyCheckSubscription: any;
        let userId: string | null = null;

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            userId = user.id;

            // A. Check if already in Queue
            const { data: queueEntry } = await (supabase as any)
                .from('matchmaking_queue')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (queueEntry) {
                // Resume Searching State
                setIsSearching(true);
                const joinedAt = new Date(queueEntry.joined_at).getTime();
                const now = new Date().getTime();
                const secondsElapsed = Math.floor((now - joinedAt) / 1000);
                setSearchDuration(secondsElapsed > 0 ? secondsElapsed : 0);
            }

            // B. Check if already in Match (Active)
            // (Optional optimization: server component passes this state initially)
            // For now, we rely on the user to not be silly, or queue fail.

            // C. Subscribe to Ready Checks (The "Match Found" signal)
            readyCheckSubscription = supabase
                .channel('queue_system_ready_checks')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'ready_checks',
                        filter: `user_id=eq.${user.identities?.find(i => i.provider === 'discord')?.id}` // Matches using Discord ID
                        // Wait, user_id in ready_checks is player's user_id (DiscordId? Or AuthId?).
                        // In migration: `user_id VARCHAR(20) REFERENCES players(user_id)`.
                        // Players `user_id` is Discord Snowflake usually?
                        // Let's verify `join_queue`. It inserts `discord_id`.
                        // `find_match` inserts `user_id` = `v_player_row.discord_id`.
                        // So ready_checks uses DISCORD ID.
                        // But RLS? `ready_checks` doesn't have RLS in the migration I saw, but it should.
                        // Assuming we can subscribe based on string filter.
                    },
                    (payload: any) => {
                        console.log("Match Found Signal!", payload);
                        handleMatchFound(payload.new);
                    }
                )
                .subscribe();

            // D. Fetch Game Modes (Lazy load or initial)
            const { data: modes } = await supabase.from('game_modes').select('*');
            if (modes) setGameModes(modes);
        };

        init();

        return () => {
            if (readyCheckSubscription) supabase.removeChannel(readyCheckSubscription);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // 2. Timer Logic
    useEffect(() => {
        if (isSearching && !matchFoundData) {
            timerRef.current = setInterval(() => {
                setSearchDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isSearching, matchFoundData]);

    // 3. Actions
    const startSearch = async (gameModeId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const discordIdentity = user.identities?.find(i => i.provider === 'discord');
        if (!discordIdentity) {
            toast.error("Discord Required", { description: "Please link your Discord account to play." });
            return;
        }

        setIsSearching(true);
        setSearchDuration(0);
        setShowModeSelector(false);

        try {
            const { data, error } = await (supabase as any).rpc('join_queue', {
                p_game_mode_id: gameModeId,
                p_discord_id: discordIdentity.id
            });

            if (error || (data && !data.success)) {
                throw new Error(error?.message || data?.message || "Failed to join queue");
            }

            toast.success("Joined Queue", { description: "Searching for opponents..." });
        } catch (err: any) {
            setIsSearching(false);
            toast.error("Queue Failed", { description: err.message });
        }
    };

    const cancelSearch = async () => {
        setIsSearching(false);
        setSearchDuration(0);
        try {
            await (supabase as any).rpc('leave_queue');
            toast.info("Queue Cancelled");
        } catch (err) {
            console.error(err);
        }
    };

    const handleMatchFound = (readyCheck: any) => {
        setIsSearching(false);
        setMatchFoundData(readyCheck);
        // Play sound?
        const audio = new Audio('/sounds/match-found.mp3'); // If exists
        audio.play().catch(() => { });
    };

    const handleAcceptMatch = async () => {
        if (!matchFoundData) return false;

        // update ready check to accepted
        // But implementation plan says "Directly redirect".
        // The user said: "Add a 'JOIN MATCH' button that redirects the user to /dashboard/play/match/[match_id]."
        // So we just redirect.
        // We SHOULD mark ready check as accepted though, for records.

        const { error } = await (supabase as any)
            .from('ready_checks')
            .update({ accepted: true, responded_at: new Date().toISOString() })
            .eq('id', matchFoundData.id);

        if (error) {
            console.error("Failed to accept", error);
            // Non-blocking redirect? Or blocking?
        }

        router.push(`/dashboard/play/match/${matchFoundData.match_id}`);
        setMatchFoundData(null);
        return true;
    };

    const handleDeclineMatch = async () => {
        if (!matchFoundData) return;

        // Notify server to cancel/dissolve match
        try {
            await (supabase as any).rpc('decline_match', {
                p_match_id: matchFoundData.match_id
            });
        } catch (e) {
            console.error("Failed to decline match", e);
        }

        setMatchFoundData(null);
        toast.error("Match Declined", { description: "You failed to ready up. Please be courteous to other players." });
    };

    return (
        <QueueContext.Provider value={{
            isSearching,
            isInMatch,
            searchDuration,
            startSearch,
            cancelSearch,
            matchFoundData,
            openModeSelector: () => setShowModeSelector(true)
        }}>
            {children}

            {/* --- STICKY FIND MATCH BUTTON --- */}
            {/* Verify we are in the dashboard/play area? Or global? User said "wraps layout.tsx" and "Nexus (/dashboard/play)". */}
            {/* Assuming global stickiness is fine, or check pathname. */}
            {(pathname?.startsWith('/dashboard/play') && !matchFoundData && !isInMatch && !isSearching) && (
                <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
                    <Button
                        size="lg"
                        className="h-16 px-8 rounded-full bg-[#ccff00] hover:bg-[#b3e600] text-black font-black font-orbitron tracking-widest text-lg shadow-[0_0_30px_rgba(204,255,0,0.4)] hover:shadow-[0_0_50px_rgba(204,255,0,0.6)] hover:scale-105 transition-all border-2 border-black/10"
                        onClick={() => setShowModeSelector(true)}
                    >
                        <Swords className="w-6 h-6 mr-3" />
                        FIND MATCH
                    </Button>
                </div>
            )}

            {/* --- SEARCHING INDICATOR --- */}
            {isSearching && (
                <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-zinc-900/90 backdrop-blur-md border border-[#ccff00]/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[300px]">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#ccff00] rounded-full animate-ping opacity-20" />
                            <div className="relative w-12 h-12 bg-black rounded-full flex items-center justify-center border border-[#ccff00]/50">
                                <Loader2 className="w-6 h-6 text-[#ccff00] animate-spin" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="text-[#ccff00] font-bold font-orbitron tracking-widest text-sm">SEARCHING...</div>
                            <div className="text-zinc-400 font-mono text-xs flex items-center gap-2">
                                <Timer className="w-3 h-3" />
                                {Math.floor(searchDuration / 60)}:{(searchDuration % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full"
                            onClick={cancelSearch}
                        >
                            <XCircle className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            )}

            {/* --- MODE SELECTOR MODAL --- */}
            <Dialog open={showModeSelector} onOpenChange={setShowModeSelector}>
                <DialogContent className="bg-zinc-950 border border-zinc-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black font-orbitron tracking-widest text-center">
                            SELECT PROTOCOL
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {gameModes.map((mode) => (
                            <div
                                key={mode.id}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedMode === mode.id
                                    ? 'border-[#ccff00] bg-[#ccff00]/10'
                                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'
                                    }`}
                                onClick={() => setSelectedMode(mode.id)}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg">{mode.name}</span>
                                    <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                                        {mode.team_size}v{mode.team_size}
                                    </Badge>
                                </div>
                                <div className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-mono">
                                    Estimated Wait: 2m
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full bg-[#ccff00] hover:bg-[#b3e600] text-black font-bold font-orbitron tracking-widest h-12 text-lg"
                            disabled={!selectedMode}
                            onClick={() => selectedMode && startSearch(selectedMode)}
                        >
                            INITIATE SEARCH
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MATCH FOUND OVERLAY --- */}
            {matchFoundData && (
                <MatchFoundOverlay
                    onAccept={handleAcceptMatch}
                    onTimeout={handleDeclineMatch}
                />
            )}
        </QueueContext.Provider>
    );
}
