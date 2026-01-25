'use client';

import { useState } from 'react';
import { syncUserPermissions, disconnectAdmin } from '@/actions/authActions'; // Server Actions
import { Loader2, RefreshCw, ShieldAlert, Unplug, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Guild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
}

export function DiscoveryInterface({ guilds, connectedGuildIds }: { guilds: Guild[], connectedGuildIds: string[] }) {
    const [scanning, setScanning] = useState<string | null>(null);
    const [accessDenied, setAccessDenied] = useState(false);
    const router = useRouter();

    const handleScan = async (guildId: string) => {
        setScanning(guildId);
        try {
            const result = await syncUserPermissions(guildId);

            if (result && !result.success) {
                alert(`Error: ${result.message}`);
            } else if (result && result.success) {
                if (result.role === 'nexus-admin') {
                    router.refresh();
                } else {
                    setAccessDenied(true);
                    setTimeout(() => setAccessDenied(false), 3000);
                }
            }
        } catch (error) {
            console.error("Scan failed:", error);
            alert("Unexpected error during scan.");
        } finally {
            setScanning(null);
        }
    };

    const handleDisconnect = async (guildId: string) => {
        if (!confirm("Disconnect this server from your Command Nodes?")) return;
        setScanning(guildId);
        try {
            const result = await disconnectAdmin(guildId);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setScanning(null);
        }
    }

    return (
        <>
            {/* Access Denied Overlay */}
            {accessDenied && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-200">
                    <div className="text-center relative">
                        {/* Glitch Effects */}
                        <div className="absolute inset-0 bg-red-500/10 animate-pulse blur-xl" />

                        <ShieldAlert className="w-32 h-32 text-red-600 mx-auto mb-6 animate-bounce relative z-10" />
                        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 tracking-tighter animate-pulse relative z-10"
                            style={{ textShadow: "4px 4px 0px rgba(0,0,0,1)" }}>
                            ACCESS DENIED
                        </h1>
                        <div className="mt-6 flex flex-col gap-2 font-mono text-red-500/80 uppercase tracking-[0.2em] text-sm relative z-10">
                            <span>Protocol: Nexus-Admin</span>
                            <span>Clearance: Revoked</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {guilds.map((guild) => {
                    const isScanning = scanning === guild.id;
                    const isConnected = connectedGuildIds.includes(guild.id);

                    return (
                        <div
                            key={guild.id}
                            className={cn(
                                "group relative flex flex-col p-4 rounded-xl border transition-all",
                                isConnected
                                    ? "bg-emerald-900/10 border-emerald-500/30 hover:bg-emerald-900/20"
                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                            )}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                {guild.icon ? (
                                    <img
                                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                        alt={guild.name}
                                        className="w-12 h-12 rounded-full"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold">
                                        {guild.name.substring(0, 2)}
                                    </div>
                                )}
                                <div className="overflow-hidden">
                                    <h3 className="font-bold text-sm text-white truncate">{guild.name}</h3>
                                    <p className="text-xs text-zinc-500 font-mono">ID: {guild.id}</p>
                                </div>
                            </div>

                            {isConnected ? (
                                <div className="mt-auto flex flex-col sm:flex-row gap-2 w-full">
                                    <Link
                                        href={`/dashboard/${guild.id}/admin`}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all group-hover/card:shadow-[0_0_15px_-5px_cyan]"
                                    >
                                        Enter Command
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleDisconnect(guild.id)}
                                        disabled={!!scanning}
                                        className={cn(
                                            "flex items-center justify-center px-3 py-2 rounded-lg transition-all",
                                            isScanning
                                                ? "bg-zinc-500/20 text-zinc-500 cursor-wait"
                                                : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                        )}
                                        title="Disconnect Server"
                                    >
                                        {isScanning ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Unplug className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleScan(guild.id)}
                                    disabled={!!scanning}
                                    className={cn(
                                        "mt-auto flex items-center justify-center gap-2 w-full py-3 sm:py-2 rounded-lg text-sm font-bold transition-all",
                                        isScanning
                                            ? "bg-yellow-500/20 text-yellow-500 cursor-wait"
                                            : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                    )}
                                >
                                    {isScanning ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Scanning...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Scan Permissions
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
