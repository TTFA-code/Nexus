"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface MatchNavigationGuardProps {
    active: boolean;
    matchId?: string; // Add matchId prop
}

export function MatchNavigationGuard({ active, matchId }: MatchNavigationGuardProps) {
    const router = useRouter();

    useEffect(() => {
        if (!active) return;

        // 1. History Trap (Back Button)
        const pushState = () => {
            window.history.pushState(null, "", window.location.href);
        };
        pushState();

        const handlePopState = (event: PopStateEvent) => {
            pushState();
        };
        window.addEventListener("popstate", handlePopState);

        // 2. Browser Close/Refresh Warning
        // NOTE: We CANNOT change the text of this dialog. Browsers enforce generic text for security.
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "Leaving this match will result in an automatic FORFEIT and LOSS.";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        // 3. Auto-Forfeit Signal on Close
        const handlePageHide = () => {
            if (active && matchId) {
                // Send "beacon" to mark as loss
                const data = JSON.stringify({ matchId });
                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon('/api/match/forfeit', blob);
            }
        };
        window.addEventListener("pagehide", handlePageHide);

        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("pagehide", handlePageHide);
        };
    }, [active, matchId]); // Added matchId dependency

    return null;
}
