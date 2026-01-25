'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Inbox,
    Radio,
    FileText,
    Users,
    Swords,
    Settings,
    Menu,
    ChevronDown,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';

interface MobileAdminHeaderProps {
    guildId: string;
    guildName?: string;
    guilds?: any[]; // For server switching
}

export function MobileAdminHeader({ guildId, guildName, guilds }: MobileAdminHeaderProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const links = [
        { label: "INBOX", href: `/dashboard/${guildId}/admin`, icon: Inbox, exact: true },
        { label: "COMMS", href: `/dashboard/${guildId}/admin/comms`, icon: Radio },
        { label: "INTEL", href: `/dashboard/${guildId}/admin/intel`, icon: FileText },
        { label: "MEMBERS", href: `/dashboard/${guildId}/admin/members`, icon: Users },
        { label: "OPS", href: `/dashboard/${guildId}/admin/operations`, icon: Swords },
        { label: "SETTINGS", href: `/dashboard/${guildId}/admin/settings`, icon: Settings }
    ];

    const activeLink = links.find(link =>
        link.exact ? pathname === link.href : pathname?.startsWith(link.href)
    );

    return (
        <div className="md:hidden flex flex-col bg-black/40 border-b border-white/10 backdrop-blur-xl sticky top-0 z-40">
            {/* Top Bar: Server & Menu Trigger */}
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center shadow-[0_0_10px_rgba(225,29,72,0.4)]">
                        <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold font-orbitron text-white tracking-wider">ADM: {activeLink?.label || 'COMMAND'}</h1>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase truncate max-w-[150px]">
                            {guildName || `Sector ${guildId}`}
                        </p>
                    </div>
                </div>

                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="bg-zinc-950/95 border-r border-white/10 p-0 w-[280px]">
                        <SheetHeader className="p-6 border-b border-white/10 text-left">
                            <SheetTitle className="font-orbitron text-lg text-white">COMMAND OS</SheetTitle>
                            <div className="text-xs text-zinc-500 font-mono">Mobile Uplink Active</div>
                        </SheetHeader>

                        <div className="flex flex-col h-full overflow-y-auto">
                            {/* Navigation Links */}
                            <div className="p-4 space-y-1">
                                <div className="text-xs font-bold text-zinc-500 mb-2 px-2 uppercase tracking-widest">Modules</div>
                                {links.map((link) => {
                                    const isActive = link.exact
                                        ? pathname === link.href
                                        : pathname?.startsWith(link.href);

                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-3 rounded text-sm font-mono transition-all",
                                                isActive
                                                    ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <link.icon className="w-4 h-4" />
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Server Switcher (Simplified) */}
                            {guilds && guilds.length > 0 && (
                                <div className="p-4 border-t border-white/10 mt-auto">
                                    <div className="text-xs font-bold text-zinc-500 mb-2 px-2 uppercase tracking-widest">Sectors</div>
                                    <div className="space-y-1">
                                        {guilds.map(g => (
                                            <Link
                                                key={g.guild_id}
                                                href={`/dashboard/${g.guild_id}/admin`}
                                                onClick={() => setIsOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 rounded text-xs font-mono truncate",
                                                    guildId === g.guild_id
                                                        ? "text-white bg-white/10"
                                                        : "text-zinc-500 hover:text-zinc-300"
                                                )}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                                {g.name || g.guild_id}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Quick Access Bar (Horizontal Scroll) */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 px-2 pb-0 no-scrollbar touch-pan-x border-t border-white/5 bg-black/20">
                {links.map((link) => {
                    const isActive = link.exact
                        ? pathname === link.href
                        : pathname?.startsWith(link.href);

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center justify-center px-4 py-3 shrink-0 text-[10px] font-bold font-mono uppercase tracking-wider border-b-2 transition-all",
                                isActive
                                    ? "border-pink-500 text-pink-400 bg-pink-500/5"
                                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {link.label}
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
