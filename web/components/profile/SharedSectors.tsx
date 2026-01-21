
'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, UserPlus } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface Sector {
    id: string;
    name: string;
    icon?: string;
    isMember: boolean;
    inviteUrl?: string;
}

export function SharedSectors({ userId }: { userId: string }) {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSectors = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/profile/${userId}/sectors`);
                if (res.ok) {
                    const data = await res.json();
                    setSectors(data.sectors || []);
                }
            } catch (error) {
                console.error('Failed to fetch sectors', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchSectors();
        }
    }, [userId]);

    if (loading) return <div className="h-12 w-full animate-pulse bg-white/5 rounded-xl" />;
    if (sectors.length === 0) return null;

    return (
        <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Shared Lobbies</h3>
            <div className="flex flex-wrap gap-3">
                <TooltipProvider>
                    {sectors.map((sector) => (
                        <div key={sector.id} className="group relative">
                            {sector.isMember ? (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="h-10 w-10 rounded-full border border-white/10 bg-black overflow-hidden hover:border-[#ccff00]/50 transition-colors">
                                            {sector.icon ? (
                                                <img src={sector.icon} alt={sector.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-xs font-bold text-zinc-500">
                                                    {sector.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{sector.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <a
                                            href={sector.inviteUrl || '#'}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="h-10 w-10 rounded-full border border-dashed border-white/20 bg-white/5 flex items-center justify-center hover:bg-[#ccff00]/10 hover:border-[#ccff00] hover:text-[#ccff00] transition-all cursor-pointer"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                        </a>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Join {sector.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    ))}
                </TooltipProvider>
            </div>
        </div>
    );
}
