'use client';

import { CreateLobbyModal } from '@/components/lobby/CreateLobbyModal';
import { ActiveLobbies } from '@/components/lobby/ActiveLobbies';
import { MatchReporting } from '@/components/match/MatchReporting';
import { MatchReadyOverlay } from '@/components/match/MatchReadyOverlay';
import { Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function PlayPage() {
    const [isMatchReady, setIsMatchReady] = useState(false);
    const [lobbies, setLobbies] = useState<any[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    // 1. Fetch User Discord ID
    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Get Discord ID (TEXT) to match lobby creator_id and lobby_players
                const discordIdentity = user.identities?.find(i => i.provider === 'discord');
                const discordId = discordIdentity?.id;
                if (discordId) {
                    setCurrentUserId(discordId);
                }
            }
        }
        getUser();
    }, []);

    // 2. Fetch Lobbies
    const fetchLobbies = async () => {
        try {
            const res = await fetch('/api/lobbies');
            const data = await res.json();
            if (data.lobbies) setLobbies(data.lobbies);
        } catch (e) {
            console.error("Failed to fetch lobbies", e);
        }
    };

    useEffect(() => {
        fetchLobbies();

        // Realtime Subscription
        const channel = supabase
            .channel('public:lobbies')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lobbies'
                },
                () => {
                    console.log('Lobby Update Detected');
                    fetchLobbies();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    // Optimistic Handlers
    const handleLobbyCreated = (newLobby: any) => {
        setLobbies(prev => [newLobby, ...prev]);
        // Auto-enter workspace as creator
        if (newLobby && newLobby.id) {
            router.push(`/dashboard/play/lobby/${newLobby.id}`);
        }
    };

    const handleLobbyDissolved = (lobbyId: string | number) => {
        setLobbies(prev => prev.filter(l => l.id !== lobbyId));
    };

    const handleLobbyJoined = (lobbyId: string) => {
        router.push(`/dashboard/play/lobby/${lobbyId}`);
    };

    const handleAccept = () => {
        console.log("Match Accepted");
        // Keep overlay open in "Ready" state
    };

    const handleDecline = () => {
        console.log("Match Declined");
        setIsMatchReady(false);
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {isMatchReady && (
                <MatchReadyOverlay
                    isOpen={isMatchReady}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                />
            )}

            {/* Top Stats / Banner Row */}
            <div className="rounded-3xl bg-gradient-to-r from-emerald-900/20 to-emerald-500/10 border border-emerald-500/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold tracking-widest text-xs uppercase">
                        <Activity className="w-4 h-4" />
                        Live Operations
                    </div>
                    <h2 className="text-3xl font-bold text-white">The Arena</h2>
                    <p className="text-zinc-400 mt-1 max-w-lg">
                        Real-time matchmaking and active deployments. Select a queue to begin or report ongoing mission status.
                    </p>
                </div>

                {/* Create Lobby Button */}
                <div className="relative z-10 flex gap-4">
                    <CreateLobbyModal onLobbyCreated={handleLobbyCreated} />
                </div>

                {/* Decorative BG */}
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
            </div>

            {/* Active Match Reporting (Conditional) */}
            <MatchReporting />

            {/* Active Queues Grid */}
            <div>
                <ActiveLobbies
                    lobbies={lobbies}
                    currentUserId={currentUserId}
                    handleDissolve={handleLobbyDissolved}
                    onJoin={handleLobbyJoined}
                />
            </div>
        </div>
    );
}
