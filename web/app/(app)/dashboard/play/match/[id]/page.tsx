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
        .select(`
            *,
            match_players(
                *,
                player:players(*)
            ),
            game_mode:game_modes(*)
        `)
        .eq("id", matchId)
        .single();

    if (error || !match) {
        return <div className="p-8 text-center text-zinc-400">Match not found</div>;
    }

    // State Logic
    const isFinished = match.status === "finished";
    const isPending = match.status === "pending";

    // Players
    const myPlayer = match.match_players.find((p: any) => p.user_id === user.id);
    const opponent = match.match_players.find((p: any) => p.user_id !== user.id);

    // Stats
    const myStats = myPlayer?.stats as { score?: number } | undefined;
    const opponentStats = opponent?.stats as { score?: number } | undefined;

    // Result Logic
    const won = match.winner_team === myPlayer?.team;
    const isDraw = match.winner_team === 0;

    // MMR Logic safely accessed
    // Calculate MMR change if history exists, otherwise null
    const mmrChange = null;
    const mmrChangeText = "";

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] text-white">
            <h1 className="text-4xl font-bold">MATCH PAGE LOADED</h1>
            <p>If you see this, the crash is caused by one of the components.</p>
        </div>
    );
}
