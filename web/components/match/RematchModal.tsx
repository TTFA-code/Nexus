'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, XCircle, CheckCircle, Radio, Clock } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface RematchModalProps {
    requesterName: string;
    requesterAvatar?: string;
    onAccept: () => void;
    onDecline: () => void;
    onTimeout: () => void;
}

export function RematchModal({ requesterName, requesterAvatar, onAccept, onDecline, onTimeout }: RematchModalProps) {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onTimeout]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md p-6 bg-zinc-900 border border-primary/20 rounded-xl shadow-2xl space-y-6">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <Avatar className="w-20 h-20 border-4 border-primary shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                <AvatarImage src={requesterAvatar || "/placeholder-avatar.png"} />
                                <AvatarFallback>{requesterName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-2 -right-2 bg-primary text-black rounded-full p-1.5 border-2 border-zinc-900">
                                <Radio className="w-4 h-4 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                        Rematch Request
                    </h2>
                    <p className="text-zinc-400">
                        <span className="text-white font-bold">{requesterName}</span> wants to run it back. Do you accept?
                    </p>
                </div>

                {/* Timer */}
                <div className="flex items-center justify-center gap-2 text-sm font-mono text-zinc-500">
                    <Clock className="w-4 h-4" />
                    <span>Auto-decline in {timeLeft}s</span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onDecline}
                        className="border-red-500/50 text-red-500 hover:bg-red-500/10 h-14 font-bold tracking-wide"
                    >
                        <XCircle className="w-5 h-5 mr-2" />
                        DECLINE
                    </Button>
                    <Button
                        size="lg"
                        onClick={onAccept}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 font-bold tracking-wide shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        ACCEPT
                    </Button>
                </div>
            </div>
        </div>
    );
}
