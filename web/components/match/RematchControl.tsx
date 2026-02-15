'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Loader2, RefreshCw, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RematchModal } from './RematchModal';
import { acceptRematch, checkPlayerBusy } from '@/actions/rematchActions';

interface RematchControlProps {
    matchId: string;
    myUserId: string;
    myUserName: string;
    myUserAvatar?: string;
    opponentUserId: string;
    opponentName: string;
    opponentAvatar?: string;
}

export function RematchControl({
    matchId,
    myUserId,
    myUserName,
    myUserAvatar,
    opponentUserId,
    opponentName,
    opponentAvatar
}: RematchControlProps) {
    const [isRequesting, setIsRequesting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Listen to MY User Channel for responses (Decline/Accept) which are sent TO ME
        const channel = supabase.channel(`user:${myUserId}`)
            .on(
                'broadcast',
                { event: 'rematch_request' },
                (payload) => {
                    console.log("Rematch Request Rx:", payload);
                    // If *I* are the target (opponent of the requester)
                    // This event is now sent directly to my user channel, so no targetId check needed.
                    // We also need to ensure the request is for the current match, if we're on a match page.
                    if (payload.payload.matchId === matchId) {
                        setShowModal(true);
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'rematch_declined' },
                (payload) => {
                    console.log("Rematch Declined Rx:", payload);
                    // Check if decliner is the opponent we are currently looking at
                    if (payload.payload.declinerId === opponentUserId) {
                        toast.error(`${opponentName} declined the rematch.`);
                        setIsRequesting(false);
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'rematch_accepted' },
                (payload) => {
                    console.log("Rematch Accepted Rx:", payload);
                    if (payload.payload.newMatchId) {
                        toast.success("Rematch Accepted! Redirecting...");
                        router.push(`/dashboard/play/match/${payload.payload.newMatchId}`);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Subscribed to user:${myUserId}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId, myUserId, opponentUserId, opponentName, router, supabase]);

    const handleRequestRematch = async () => {
        setIsRequesting(true);

        // 1. Check if Opponent is Busy
        try {
            const status = await checkPlayerBusy(opponentUserId);
            if (status.isBusy) {
                toast.error(`${opponentName} is currently in another match.`);
                setIsRequesting(false);
                return;
            }
        } catch (e) {
            console.error("Busy Check Error:", e);
            // Optionally fail open? or just warn.
            // toast.warning("Could not verify opponent status.");
        }

        // 2. Send Broadcast to OPPONENT'S User Channel
        await supabase.channel(`user:${opponentUserId}`).send({
            type: 'broadcast',
            event: 'rematch_request',
            payload: {
                requesterId: myUserId,
                requesterName: myUserName,
                requesterAvatar: myUserAvatar,
                matchId: matchId
            }
        });

        toast.info(`Rematch request sent to ${opponentName}`);
    };

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            // 1. Server Action to Create New Match
            const result = await acceptRematch(matchId);

            if (result.success && result.newMatchId) {
                // 2. Broadcast Acceptance with New ID
                await supabase.channel(`match:${matchId}`).send({
                    type: 'broadcast',
                    event: 'rematch_accepted',
                    payload: {
                        newMatchId: result.newMatchId
                    }
                });

                // 3. Redirect (Self)
                router.push(`/dashboard/play/match/${result.newMatchId}`);
            } else {
                toast.error(result.message || "Failed to create rematch.");
                setIsAccepting(false);
            }
        } catch (e) {
            console.error("Accept Error:", e);
            toast.error("An unexpected error occurred.");
            setIsAccepting(false);
        }
    };

    const handleDecline = async () => {
        setShowModal(false);

        // Send Notification to Requester
        await supabase.channel(`match:${matchId}`).send({
            type: 'broadcast',
            event: 'rematch_declined',
            payload: {
                targetId: opponentUserId // Send back to the requester
            }
        });
    };

    const handleReturn = () => {
        router.push("/dashboard/play");
    };

    return (
        <>
            <div className="flex gap-4 pt-10 justify-center">
                {/* Rematch Button */}
                <Button
                    onClick={handleRequestRematch}
                    disabled={isRequesting || showModal}
                    className={`
                        h-16 px-8 text-xl font-bold font-orbitron tracking-widest
                        border-2 transition-all duration-300 transform hover:-translate-y-1
                        ${isRequesting
                            ? 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                        }
                    `}
                >
                    {isRequesting ? (
                        <>
                            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                            REQUESTING...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-6 h-6 mr-3" />
                            REMATCH
                        </>
                    )}
                </Button>

                {/* Return Button */}
                <Button
                    onClick={handleReturn}
                    variant="outline"
                    className="h-16 px-8 text-lg font-mono tracking-widest border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    RETURN TO HQ
                </Button>
            </div>

            {/* Modal */}
            {showModal && (
                <RematchModal
                    requesterName={opponentName}
                    requesterAvatar={opponentAvatar}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onTimeout={handleDecline}
                />
            )}

            {/* Loading Overlay when Accepting */}
            {isAccepting && (
                <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center">
                    <div className="text-center animate-pulse">
                        <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin mb-4" />
                        <h2 className="text-2xl font-bold text-white tracking-widest">INITIALIZING MATCH...</h2>
                    </div>
                </div>
            )}
        </>
    );
}
