'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RematchModal } from './match/RematchModal';

export function GlobalRematchManager() {
    const [userId, setUserId] = useState<string | null>(null);
    const [request, setRequest] = useState<{
        requesterId: string;
        requesterName: string;
        requesterAvatar?: string;
        matchId: string; // The match they want to rematch from (for context or actions)
    } | null>(null);

    const router = useRouter();
    const supabase = createClient();

    // 1. Get User ID
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        getUser();
    }, []);

    // 2. Subscribe to User Channel
    useEffect(() => {
        if (!userId) return;

        console.log("GlobalRematchManager: Subscribing to", `user:${userId}`);

        const channel = supabase.channel(`user:${userId}`)
            .on(
                'broadcast',
                { event: 'rematch_request' },
                (payload) => {
                    console.log("Global Rematch Request Rx:", payload);
                    // Open Modal
                    setRequest({
                        requesterId: payload.payload.requesterId,
                        requesterName: payload.payload.requesterName || "Opponent",
                        requesterAvatar: payload.payload.requesterAvatar,
                        matchId: payload.payload.matchId
                    });
                }
            )
            .on(
                'broadcast',
                { event: 'rematch_accepted' },
                (payload) => {
                    console.log("Global Rematch Accepted Rx:", payload);
                    if (payload.payload.newMatchId) {
                        toast.success("Rematch Accepted! Deploying...");
                        router.push(`/dashboard/play/match/${payload.payload.newMatchId}`);
                    }
                    setRequest(null); // Close any open modal (edge case)
                }
            )
            .on(
                'broadcast',
                { event: 'rematch_declined' },
                (payload) => {
                    console.log("Global Rematch Declined Rx:", payload);
                    toast.error("Rematch request declined.");
                    // Note: If we are the requester, we might want to update some UI state.
                    // But for a global listener, a toast is sufficient.
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("Global Rematch Listener Active");
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, router, supabase]);

    const handleAccept = async () => {
        if (!request || !userId) return;

        try {
            const { acceptRematch } = await import('@/actions/rematchActions');
            const result = await acceptRematch(request.matchId);

            if (result.success && result.newMatchId) {
                // Broadcast Acceptance to Opponent (Requester)
                // Opponent should be listening on `user:${request.requesterId}`
                await supabase.channel(`user:${request.requesterId}`).send({
                    type: 'broadcast',
                    event: 'rematch_accepted',
                    payload: {
                        newMatchId: result.newMatchId
                    }
                });

                // Redirect Self
                router.push(`/dashboard/play/match/${result.newMatchId}`);
                setRequest(null);
            } else {
                toast.error(result.message || "Failed to accept rematch.");
            }
        } catch (e) {
            console.error("Global Accept Error:", e);
            toast.error("System Failure.");
        }
    };

    const handleDecline = async () => {
        if (!request) return;

        // Broadcast Decline to Requester
        await supabase.channel(`user:${request.requesterId}`).send({
            type: 'broadcast',
            event: 'rematch_declined',
            payload: {
                declinerId: userId
            }
        });

        setRequest(null);
    };

    if (!request) return null;

    return (
        <RematchModal
            requesterName={request.requesterName}
            requesterAvatar={request.requesterAvatar}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onTimeout={handleDecline}
        />
    );
}
