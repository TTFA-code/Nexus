'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MatchFoundOverlayProps {
    onAccept: () => Promise<boolean>; // Changed to Promise<boolean> to signal success/fail
}

export function MatchFoundOverlay({ onAccept }: MatchFoundOverlayProps) {
    const [progress, setProgress] = useState(100);
    const [accepted, setAccepted] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1; // 100 ticks = 10s if 100ms interval
            });
        }, 100);

        return () => clearInterval(timer);
    }, []);

    const handleAccept = async () => {
        if (isAccepting) return;
        setIsAccepting(true);
        try {
            const success = await onAccept();
            if (success) {
                setAccepted(true);
            } else {
                // If onAccept returns false, it likely handled its own error toast, 
                // but we reset state to allow retry if needed (or maybe invalid state)
                // actually if it fails we might want to stay on button?
                // Let's assume onAccept handles the toast.
            }
        } catch (error) {
            console.error("Accept Error:", error);
            toast.error("Failed to accept mission.");
        } finally {
            setIsAccepting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl p-8 text-center space-y-8">
                {/* Background Pulse - Added pointer-events-none */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-lime-500/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />

                <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-lime-400 font-mono tracking-[0.2em] text-sm uppercase">
                        <Shield className="w-4 h-4" />
                        Priority Signal Received
                    </div>
                    <h1 className="text-6xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-br from-white to-lime-400 tracking-wider drop-shadow-[0_0_15px_rgba(132,204,22,0.5)]">
                        MATCH FOUND
                    </h1>
                    <p className="text-zinc-400 font-mono">DEPLOYMENT SEQUENCE INITIATED</p>
                </div>

                {/* Progress Bar - Changed to Lime */}
                <div className="relative z-10 w-full max-w-md mx-auto h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                    <div
                        className="h-full bg-lime-500 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(132,204,22,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="relative z-10 flex justify-center">
                    {!accepted ? (
                        <Button
                            onClick={handleAccept}
                            disabled={isAccepting}
                            size="lg"
                            className="h-20 px-12 text-xl font-bold font-orbitron tracking-widest bg-lime-600 hover:bg-lime-500 text-black border-2 border-lime-400 shadow-[0_0_30px_rgba(132,204,22,0.4)] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAccepting ? (
                                <>
                                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                    CONFIRMING...
                                </>
                            ) : (
                                "ACCEPT MISSION"
                            )}
                        </Button>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-lime-400 animate-in zoom-in duration-300">
                            <CheckCircle className="w-16 h-16 drop-shadow-[0_0_15px_rgba(132,204,22,0.5)]" />
                            <span className="font-bold font-orbitron tracking-widest text-xl">ACCEPTED</span>
                            <span className="text-xs font-mono text-lime-500/50">WAITING FOR SQUAD...</span>
                        </div>
                    )}
                </div>

                <div className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
                    Sector ID: [ENCRYPTED] // Region: EU-WEST
                </div>
            </div>
        </div>
    );
}
