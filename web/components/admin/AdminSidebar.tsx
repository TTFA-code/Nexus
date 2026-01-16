'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { ShieldAlert, Radio, FileText, Settings, Users, Inbox, Swords, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface AdminSidebarProps {
    guildId: string
}

export function AdminSidebar({ guildId }: AdminSidebarProps) {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(true)

    const links = [
        {
            label: "INBOX",
            href: `/dashboard/${guildId}/admin`, // The root admin page is the inbox
            icon: Inbox,
            exact: true
        },
        {
            label: "COMMS",
            href: `/dashboard/${guildId}/admin/comms`,
            icon: Radio
        },
        {
            label: "INTEL",
            href: `/dashboard/${guildId}/admin/intel`,
            icon: FileText
        },
        {
            label: "MEMBERS",
            href: `/dashboard/${guildId}/admin/members`,
            icon: Users
        },
        {
            label: "OPERATIONS",
            href: `/dashboard/${guildId}/admin/operations`,
            icon: Swords
        },
        {
            label: "SETTINGS",
            href: `/dashboard/${guildId}/admin/settings`,
            icon: Settings
        }
    ]

    return (
        <TooltipProvider>
            <div className={cn(
                "border-r border-white/10 bg-black/20 flex flex-col p-4 gap-2 transition-all duration-300 relative group/sidebar",
                isCollapsed ? "w-20" : "w-64"
            )}>
                {/* Header */}
                <div className={cn("mb-6 flex items-center transition-all", isCollapsed ? "justify-center" : "px-2 justify-between")}>
                    {!isCollapsed && (
                        <div className="overflow-hidden whitespace-nowrap">
                            <h2 className="font-orbitron font-bold text-lg text-white tracking-widest">
                                CMD CENTER
                            </h2>
                            <div className="h-0.5 w-12 bg-pink-500 mt-1" />
                        </div>
                    )}

                    {/* Toggle Button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={cn(
                            "text-zinc-500 hover:text-white transition-colors p-1 rounded hover:bg-white/10",
                            isCollapsed && "mx-auto"
                        )}
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                </div>

                <nav className="space-y-1 group">
                    {links.map((link) => {
                        const isActive = link.exact
                            ? pathname === link.href
                            : pathname?.startsWith(link.href)

                        return isCollapsed ? (
                            <Tooltip key={link.href} delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            "flex items-center justify-center p-3 rounded transition-all duration-200 group border border-transparent mx-auto",
                                            isActive
                                                ? "bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.1)]"
                                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <link.icon className={cn(
                                            "w-5 h-5 transition-colors",
                                            isActive ? "text-pink-400" : "text-zinc-500 group-hover:text-zinc-300"
                                        )} />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs uppercase tracking-wider">
                                    {link.label}
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded transition-all duration-200 group border border-transparent",
                                    isActive
                                        ? "bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.1)]"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <link.icon className={cn(
                                    "w-4 h-4 transition-colors",
                                    isActive ? "text-pink-400" : "text-zinc-500 group-hover:text-zinc-300"
                                )} />
                                <span className={cn(
                                    "font-mono text-sm tracking-wide uppercase transition-all duration-300 overflow-hidden whitespace-nowrap",
                                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                                )}>
                                    {link.label}
                                </span>
                                {isActive && (
                                    <div className={cn("ml-auto w-1 h-1 rounded-full bg-pink-500 animate-pulse", isCollapsed && "hidden")} />
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </TooltipProvider>
    )
}
