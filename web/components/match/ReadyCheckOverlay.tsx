"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { MatchReadyOverlay } from "./MatchReadyOverlay";
import { submitReadyState, leaveLobby } from "@/actions/lobbyActions";
import { toast } from "sonner";

interface ReadyCheckOverlayProps {
    lobbyId: number;
    currentStatus?: string; // Optional initial status
}

export function ReadyCheckOverlay({ lobbyId, currentStatus = "WAITING" }: ReadyCheckOverlayProps) {
    const [status, setStatus] = useState(currentStatus);
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [hasAccepted, setHasAccepted] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        // Sync initial status if provided
        if (currentStatus === 'READY_CHECK') {
            setIsOverlayOpen(true);
        } else {
            setIsOverlayOpen(false);
        }
        setStatus(currentStatus);
    }, [currentStatus]);

    useEffect(() => {
        const channel = supabase
            .channel(`lobby-${lobbyId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'lobbies',
                    filter: `id=eq.${lobbyId}`,
                },
                (payload) => {
                    const newStatus = payload.new.status;
                    setStatus(newStatus);

                    if (newStatus === 'READY_CHECK') {
                        setIsOverlayOpen(true);
                        setHasAccepted(false); // Reset accepted state for new check
                        setIsAccepting(false);
                    } else if (newStatus !== 'READY_CHECK') {
                        setIsOverlayOpen(false);
                        setIsAccepting(false);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [lobbyId, supabase]);

    const handleAccept = async () => {
        setIsAccepting(true);
        try {
            // Optimistic update
            setHasAccepted(true);
            // In the dumb component, it sets local status to "ACCEPTED" too.

            const result = await submitReadyState(lobbyId, true);
            if (!result.success) {
                toast.error(result.message);
                setHasAccepted(false); // Revert? Or close?
                setIsAccepting(false);
            } else {
                toast.success("Ready confirmed. Waiting for others...");
            }
        } catch (err) {
            toast.error("Failed to submit ready state.");
            setHasAccepted(false);
            setIsAccepting(false);
        }
    };

    const handleDecline = async () => {
        try {
            setIsOverlayOpen(false); // Close immediately for user
            const result = await submitReadyState(lobbyId, false);
            // Optionally leave lobby too?
            // "Buttons: 'ACCEPT MISSION' (Green) vs 'DECLINE' (Red)."
            // Design says: "Action: Clicking Accept calls... submitReadyState". Doesn't specify Decline action explicitly other than it exists.
            // Usually decline means you aren't ready, which might kick you or just fail the check.
            if (!result.success) {
                toast.error(result.message);
            } else {
                toast.info("You declined the match.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // If overlay shouldn't be open, return null
    // But MatchReadyOverlay handles `isOpen` prop.
    // However, we only want to render it if we are in the right state or transitioning.

    return (
        <MatchReadyOverlay
            isOpen={isOverlayOpen}
            onAccept={handleAccept}
            onDecline={handleDecline}
            isProcessing={isAccepting}
        />
    );
}
