"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface MatchNavigationGuardProps {
    active: boolean;
}

export function MatchNavigationGuard({ active }: MatchNavigationGuardProps) {
    const router = useRouter();

    useEffect(() => {
        if (!active) return;

        // Function to push state and prevent back navigation
        const pushState = () => {
            window.history.pushState(null, "", window.location.href);
        };

        // Push initial state to trap the user
        pushState();

        const handlePopState = (event: PopStateEvent) => {
            // If they try to go back, push state again to keep them forward
            pushState();
        };

        window.addEventListener("popstate", handlePopState);

        // Also prevent unload/refresh with a confirmation (standard browser behavior)
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = ""; // Chrome requires returnValue to be set
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [active, router]);

    return null;
}
