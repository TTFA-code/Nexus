'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldAlert, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { syncUserPermissions } from '@/actions/authActions';
import { createClient } from '@/utils/supabase/client';

function ScanPageContent() {
    const searchParams = useSearchParams();
    const targetGuildId = searchParams.get('target');
    const router = useRouter();

    const [status, setStatus] = useState<'idle' | 'scanning' | 'authorized' | 'denied'>('idle');
    const [message, setMessage] = useState('');

    const handleScan = async () => {
        if (!targetGuildId) {
            setMessage("No target server specified.");
            return;
        }

        setStatus('scanning');
        setMessage("Interfacing with Discord API...");

        try {
            // 1. Trigger Sync Logic
            const result = await syncUserPermissions(targetGuildId);

            if (result.success && result.role === 'nexus-admin') {
                setStatus('authorized');
                setMessage("Access Granted. Redirecting...");
                setTimeout(() => {
                    router.push(`/dashboard/${targetGuildId}/admin`);
                }, 1500);
            } else {
                setStatus('denied');
                setMessage(result.message || "Access Permission Not Found.");
            }
        } catch (e: any) {
            setStatus('denied');
            setMessage("Connection Failed: " + e.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8 animate-in fade-in duration-700">

            <div className="relative">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-500
                    ${status === 'idle' ? 'border-zinc-700 bg-zinc-900/50' : ''}
                    ${status === 'scanning' ? 'border-blue-500 bg-blue-500/10 animate-pulse' : ''}
                    ${status === 'authorized' ? 'border-green-500 bg-green-500/10' : ''}
                    ${status === 'denied' ? 'border-red-500 bg-red-500/10' : ''}
                `}>
                    {status === 'idle' && <ShieldAlert className="w-10 h-10 text-zinc-500" />}
                    {status === 'scanning' && <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />}
                    {status === 'authorized' && <CheckCircle className="w-10 h-10 text-green-500" />}
                    {status === 'denied' && <XCircle className="w-10 h-10 text-red-500" />}
                </div>
            </div>

            <div className="max-w-md space-y-2">
                <h1 className="text-2xl font-bold text-white tracking-widest uppercase">
                    {status === 'authorized' ? 'IDENTITY CONFIRMED' : 'SECURITY GATEWAY'}
                </h1>
                <p className="text-zinc-400">
                    {message || (targetGuildId
                        ? `Authorization required for Sector ${targetGuildId}. Initiate scan to verify privileges.`
                        : "Select a server to scan permissions.")}
                </p>
            </div>

            {targetGuildId && status !== 'authorized' && (
                <Button
                    size="lg"
                    onClick={handleScan}
                    disabled={status === 'scanning'}
                    className={`min-w-[200px] font-mono tracking-widest uppercase
                        ${status === 'denied' ? 'bg-red-900/50 hover:bg-red-900/80 text-red-200' : 'bg-[#ccff00] text-black hover:bg-[#b3ff00]'}
                    `}
                >
                    {status === 'scanning' ? 'SCANNING...' : status === 'denied' ? 'RETRY SCAN' : 'INITIATE SCAN'}
                </Button>
            )}

            {!targetGuildId && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-mono">
                    Warning: No target sector detected. Return to dashboard select a server.
                </div>
            )}
        </div>
    );
}

export default function ScanPage() {
    return (
        <Suspense fallback={<div className="text-center p-20 text-zinc-500">INITIALIZING SCANNER...</div>}>
            <ScanPageContent />
        </Suspense>
    );
}
