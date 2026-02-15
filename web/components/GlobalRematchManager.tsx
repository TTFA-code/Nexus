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

    // 2. Subscribe to User Request Channel
    useEffect(() => {
        if (!userId) return;

        const channelName = `user:${userId}:requests`;
        console.log("GlobalRematchManager: Subscribing to", channelName);

        const channel = supabase.channel(channelName)
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
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Global Rematch Listener Active on ${channelName}`);
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
                // Determine Opponent ID (Requester) to notify them
                // Send response to the requester's RESPONSE channel
                const responseChannel = `user:${request.requesterId}:responses`;

                await supabase.channel(responseChannel).send({
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

        // Broadcast Decline to Requester's RESPONSE channel
        const responseChannel = `user:${request.requesterId}:responses`;
        await supabase.channel(responseChannel).send({
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
