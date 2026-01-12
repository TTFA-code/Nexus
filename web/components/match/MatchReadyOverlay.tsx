"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface MatchReadyOverlayProps {
    onAccept: () => void;
    onDecline: () => void;
    isOpen: boolean;
    isProcessing?: boolean;
}

export function MatchReadyOverlay({
    onAccept,
    onDecline,
    isOpen,
    isProcessing = false,
}: MatchReadyOverlayProps) {
    const [timeLeft, setTimeLeft] = useState(10);
    const [status, setStatus] = useState<"WAITING" | "ACCEPTED">("WAITING");

    // Reset state when overlay opens
    useEffect(() => {
        if (isOpen) {
            setTimeLeft(10);
            setStatus("WAITING");
        }
    }, [isOpen]);

    // Countdown timer
    useEffect(() => {
        if (!isOpen) return;

        if (timeLeft === 0) {
            onDecline();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, timeLeft, onDecline]);

    const handleAccept = () => {
        setStatus("ACCEPTED");
        onAccept();
    };

    if (!isOpen) return null;

    // Calculate circle stroke for countdown (assuming 10s max)
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (timeLeft / 10) * circumference;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-overlay-in">
            {/* Glitch Overlay Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute inset-0 bg-transparent animate-glitch-1 mix-blend-screen" style={{ textShadow: '2px 0 #00f3ff, -2px 0 #ff00ff' }} />
                <div className="absolute inset-0 bg-transparent animate-glitch-2 mix-blend-multiply" style={{ textShadow: '-2px 0 #00f3ff, 2px 0 #ff00ff' }} />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-12 max-w-2xl w-full p-8">

                {/* Title */}
                <div className="relative">
                    <h1 className="font-orbitron font-black text-5xl md:text-7xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-cyan-400 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] text-center">
                        MATCH READY
                    </h1>
                    {/* ADJUST ALIGNMENT HERE: Change 'translate-x-1' to move left/right (e.g. translate-x-2, -translate-x-1) */}
                    <h1 className="font-orbitron font-black text-5xl md:text-7xl tracking-widest text-cyan-500/30 absolute inset-0 translate-x-45 blur-sm animate-glitch-1" aria-hidden="true">
                        MATCH READY
                    </h1>
                </div>


                {/* Circular Countdown */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 text-zinc-800" viewBox="0 0 120 120">
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                        />
                    </svg>
                    {/* Progress Circle */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 text-cyan-400" viewBox="0 0 120 120">
                        <circle
                            cx="60"
                            cy="60"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                        />
                    </svg>

                    <div className="text-4xl font-bold font-orbitron text-white drop-shadow-md">
                        {timeLeft}
                    </div>
                </div>


                {/* Actions */}
                <div className="flex flex-col md:flex-row gap-6 w-full justify-center items-center">
                    {status === "WAITING" ? (
                        <>
                            <button
                                onClick={handleAccept}
                                disabled={isProcessing}
                                className="group relative px-12 py-4 rounded-full bg-transparent border-2 border-[#ccff00] text-[#ccff00] font-bold text-xl tracking-wider hover:bg-[#ccff00]/10 hover:shadow-[0_0_30px_-5px_rgba(204,255,0,0.5)] transition-all duration-300 w-full md:w-auto overflow-hidden flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
                                    <span>ACCEPT MATCH</span>
                                </span>
                                <div className="absolute inset-0 bg-[#ccff00]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                            </button>

                            <button
                                onClick={onDecline}
                                disabled={isProcessing}
                                className="px-12 py-4 rounded-full border-2 border-red-500/30 text-red-500/80 font-bold text-xl tracking-wider hover:bg-red-500/10 hover:border-red-500 hover:text-red-400 transition-all duration-300 w-full md:w-auto disabled:opacity-50"
                            >
                                DECLINE
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                            <div className="text-[#ccff00] text-2xl font-bold font-orbitron tracking-widest animate-pulse">
                                READY
                            </div>
                            <p className="text-zinc-400 text-sm">WAITING FOR PLAYERS...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
