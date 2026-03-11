'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Loader2, RefreshCw, LogOut, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { submitRematchVote } from '@/actions/rematchActions';
import Image from 'next/image';

interface RematchControlProps {
    matchId: string;
    myUserId: string;
    matchPlayers: any[]; // The full player list
}

export function RematchControl({
    matchId,
    myUserId,
    matchPlayers
}: RematchControlProps) {
    const [isVoting, setIsVoting] = useState(false);
    const [voteStatus, setVoteStatus] = useState<'pending' | 'accepted' | 'declined'>('pending');
    const [playerVotes, setPlayerVotes] = useState<Record<string, string>>({});

    // Initialize player votes from props
    useEffect(() => {
        const initialVotes: Record<string, string> = {};
        matchPlayers.forEach(p => {
            if (p.user_id) {
                initialVotes[p.user_id] = p.rematch_status || 'pending';
                if (p.player?.uuid_link === myUserId) {
                    setVoteStatus(p.rematch_status || 'pending');
                }
            }
        });
        setPlayerVotes(initialVotes);
    }, [matchPlayers, myUserId]);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const channel = supabase.channel(`match:${matchId}`)
            .on(
                'broadcast',
                { event: 'rematch_vote_cast' },
                (payload) => {
                    console.log("Rematch Vote Cast Rx:", payload);
                    const { userId, vote } = payload.payload;
                    if (userId) {
                        setPlayerVotes(prev => ({
                            ...prev,
                            [userId]: vote
                        }));
                        const myDiscordId = matchPlayers.find(p => p.player?.uuid_link === myUserId)?.user_id;
                        if (userId === myDiscordId) {
                            setVoteStatus(vote);
                        }
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'rematch_resolved' },
                (payload) => {
                    const myDiscordId = matchPlayers.find(p => p.player?.uuid_link === myUserId)?.user_id;

                    if (payload.payload.success && payload.payload.acceptedUserIds?.includes(myDiscordId)) {
                        if (payload.payload.destination === 'match' && payload.payload.newMatchId) {
                            toast.success("Full Rematch accepted! Routing to active match...");
                            router.push(`/dashboard/play/match/${payload.payload.newMatchId}`);
                        } else if (payload.payload.destination === 'lobby' && payload.payload.newLobbyId) {
                            toast.success("Partial Rematch formed. Joining lobby...");
                            router.push(`/dashboard/play/lobby/${payload.payload.newLobbyId}`);
                        }
                    } else if (payload.payload.success === false) {
                        toast.info("Rematch failed. " + payload.payload.message);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Subscribed to match:${matchId} for rematch info`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId, router, supabase, myUserId, matchPlayers]);

    const handleVote = async (vote: 'accepted' | 'declined') => {
        setIsVoting(true);
        try {
            const result = await submitRematchVote(matchId, vote);

            if (result.success) {
                // If it resolves immediately for us (we were the last to vote)
                if (result.isResolved) {
                    if (result.destination === 'match' && result.newMatchId) {
                        toast.success("Full Rematch accepted! Routing to active match...");
                        router.push(`/dashboard/play/match/${result.newMatchId}`);
                    } else if (result.destination === 'lobby' && result.newLobbyId) {
                        toast.success("Partial Rematch formed. Joining lobby...");
                        router.push(`/dashboard/play/lobby/${result.newLobbyId}`);
                    }
                } else {
                    toast.info(`Voted. Waiting for other players...`);
                }
                setVoteStatus(vote);
                const myDiscordId = matchPlayers.find(p => p.player?.uuid_link === myUserId)?.user_id;
                if (myDiscordId) {
                    setPlayerVotes(prev => ({ ...prev, [myDiscordId]: vote }));
                }
            } else {
                toast.error(result.message || "Failed to submit vote.");
            }
        } catch (e) {
            console.error("Vote Error:", e);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsVoting(false);
        }
    };

    const handleReturn = () => {
        router.push("/dashboard/play");
    };

    return (
        <div className="pt-8 w-full max-w-4xl mx-auto flex flex-col items-center">

            {/* Player Vote Status Bar */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                {matchPlayers.map(p => {
                    const status = playerVotes[p.user_id] || 'pending';
                    return (
                        <div key={p.id} className={`flex items-center gap-2 px-4 py-2 rounded-full border bg-black/40 ${status === 'accepted' ? 'border-green-500/50 text-green-400' : status === 'declined' ? 'border-red-500/50 text-red-500' : 'border-zinc-500/30 text-zinc-400'}`}>
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 relative">
                                <Image src={p.player?.avatar_url || '/placeholder-avatar.png'} alt="Avatar" layout="fill" className="object-cover" />
                            </div>
                            <span className="font-bold font-mono text-sm max-w-[100px] truncate">{p.player?.username || 'Player'}</span>
                            {status === 'accepted' && <CheckCircle className="w-4 h-4" />}
                            {status === 'declined' && <XCircle className="w-4 h-4" />}
                            {status === 'pending' && <Clock className="w-4 h-4 animate-pulse opacity-50" />}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {voteStatus === 'pending' ? (
                    <>
                        <Button
                            onClick={() => handleVote('accepted')}
                            disabled={isVoting}
                            className="h-16 px-8 text-xl font-bold font-orbitron tracking-widest border-2 transition-all duration-300 transform hover:-translate-y-1 bg-green-600 hover:bg-green-500 text-white border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                        >
                            {isVoting ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <RefreshCw className="w-6 h-6 mr-3" />}
                            VOTE REMATCH
                        </Button>
                        <Button
                            onClick={() => handleVote('declined')}
                            disabled={isVoting}
                            variant="destructive"
                            className="h-16 px-8 text-xl font-bold font-orbitron tracking-widest border-2 transition-all duration-300 transform hover:-translate-y-1 bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                        >
                            {isVoting ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <XCircle className="w-6 h-6 mr-3" />}
                            DECLINE
                        </Button>
                    </>
                ) : (
                    <Button
                        onClick={handleReturn}
                        variant="outline"
                        className="h-16 px-8 text-lg font-mono tracking-widest border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        RETURN TO HQ
                    </Button>
                )}
            </div>

            {voteStatus === 'accepted' && (
                <div className="mt-8 text-center animate-pulse text-zinc-400 font-mono text-sm">
                    Waiting for remaining players...
                </div>
            )}

            {voteStatus === 'declined' && (
                <div className="mt-8 text-center text-red-500 font-mono text-sm">
                    You have declined the rematch.
                </div>
            )}
        </div>
    );
}
